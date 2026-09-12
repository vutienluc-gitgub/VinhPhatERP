/**
 * Google Sheets Adapter -- Infrastructure Layer
 *
 * Implements ISpreadsheetPort using Google Sheets API v4.
 * Runs ENTIRELY server-side (Supabase Edge Function).
 *
 * Credentials:
 *   Read from environment variables (Supabase Secrets):
 *     - GOOGLE_SA_EMAIL
 *     - GOOGLE_SA_PRIVATE_KEY
 *
 * React/UI layer MUST NOT import this file.
 *
 * Dependency flow:
 *   Application -> ISpreadsheetPort (port) -> GoogleSheetsAdapter (this file) -> Google API
 */

import type {
  ISpreadsheetPort,
  SpreadsheetConfig,
  SheetRowData,
} from '@/integration/ports/spreadsheet.port';
import { getGoogleAccessToken } from '@/integration/adapters/google-sheets/google-sheets.auth';
import {
  SHEETS_API_BASE,
  type GoogleValueRange,
  type ResolvedRow,
} from '@/integration/adapters/google-sheets/google-sheets.types';

// -- Hidden column indices (0-based, relative to the full row) ---------------
// These columns are appended AFTER visible columns.
// The exact offset depends on the sheet type, but the last 3 columns are always:
//   [...visible_columns, ERP_RECORD_ID, ERP_VERSION, SYNC_ID]
const HIDDEN_COL_COUNT = 3;

export class GoogleSheetsAdapter implements ISpreadsheetPort {
  private readonly serviceAccountEmail: string;
  private readonly privateKey: string;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(serviceAccountEmail: string, privateKey: string) {
    this.serviceAccountEmail = serviceAccountEmail;
    this.privateKey = privateKey;
  }

  // -- Auth Helper -----------------------------------------------------------

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    this.accessToken = await getGoogleAccessToken(
      this.serviceAccountEmail,
      this.privateKey,
    );
    // Token valid for 1 hour, refresh 5 min early
    this.tokenExpiresAt = now + 55 * 60 * 1000;
    return this.accessToken;
  }

  private async sheetsRequest<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Google Sheets API error (${response.status}): ${errorText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  // -- Read All Rows ---------------------------------------------------------

  private async readAllRows(
    config: SpreadsheetConfig,
  ): Promise<(string | number)[][]> {
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(config.sheetTabName)}`;

    try {
      const data = await this.sheetsRequest<GoogleValueRange>(url);
      return data.values || [];
    } catch {
      // Sheet may be empty or not exist yet
      return [];
    }
  }

  // -- Find Row by ERP Record ID ---------------------------------------------

  private findExistingRow(
    rows: (string | number)[][],
    erpRecordId: string,
    totalVisibleColumns: number,
  ): ResolvedRow | null {
    const erpIdColIndex = totalVisibleColumns; // First hidden column

    for (let i = 1; i < rows.length; i++) {
      // Skip header row (i=0)
      const row = rows[i];
      if (row && String(row[erpIdColIndex]) === erpRecordId) {
        const versionColIndex = totalVisibleColumns + 1;
        return {
          rowIndex: i + 1, // 1-indexed for Sheets API
          erpRecordId: String(row[erpIdColIndex]),
          erpVersion: Number(row[versionColIndex]) || 0,
        };
      }
    }
    return null;
  }

  // -- ISpreadsheetPort Implementation ----------------------------------------

  async upsertRow(config: SpreadsheetConfig, row: SheetRowData): Promise<void> {
    const existingRows = await this.readAllRows(config);
    const visibleColCount = row.values.length;
    const fullRowValues = [
      ...row.values,
      row.erpRecordId,
      row.erpVersion,
      row.syncId,
    ];

    const existing = this.findExistingRow(
      existingRows,
      row.erpRecordId,
      visibleColCount,
    );

    if (existing) {
      // Version guard: skip if existing version >= new version
      if (existing.erpVersion >= row.erpVersion) {
        return;
      }

      // UPDATE existing row
      const range = `${config.sheetTabName}!A${existing.rowIndex}`;
      const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;

      await this.sheetsRequest(url, {
        method: 'PUT',
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [fullRowValues],
        }),
      });
    } else {
      // APPEND new row
      const range = `${config.sheetTabName}!A1`;
      const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

      await this.sheetsRequest(url, {
        method: 'POST',
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [fullRowValues],
        }),
      });
    }
  }

  async batchUpsertRows(
    config: SpreadsheetConfig,
    rows: SheetRowData[],
  ): Promise<void> {
    // Process sequentially to maintain idempotency guarantees
    for (const row of rows) {
      await this.upsertRow(config, row);
    }
  }

  async readReadyRows(
    config: SpreadsheetConfig,
  ): Promise<Record<string, unknown>[]> {
    const rows = await this.readAllRows(config);
    if (rows.length < 2) return []; // No data rows (only header or empty)

    const headers = rows[0];
    if (!headers) return [];

    const statusColIndex = headers.findIndex(
      (h) => String(h).toLowerCase() === 'trang thai',
    );

    if (statusColIndex === -1) return [];

    const result: Record<string, unknown>[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const statusVal = row[statusColIndex];
      if (
        statusVal !== undefined &&
        String(statusVal).toUpperCase() === 'READY'
      ) {
        const record: Record<string, unknown> = { _rowIndex: i + 1 };
        for (let j = 0; j < headers.length; j++) {
          const headerName = headers[j];
          if (headerName !== undefined) {
            record[String(headerName)] = row[j] ?? null;
          }
        }
        result.push(record);
      }
    }
    return result;
  }

  async updateImportStatus(
    config: SpreadsheetConfig,
    rowIndex: number,
    status: string,
    message?: string,
  ): Promise<void> {
    const rows = await this.readAllRows(config);
    if (rows.length === 0) return;

    const headers = rows[0];
    if (!headers) return;

    const statusColIndex = headers.findIndex(
      (h) => String(h).toLowerCase() === 'trang thai',
    );
    const errorColIndex = headers.findIndex(
      (h) => String(h).toLowerCase() === 'loi',
    );

    if (statusColIndex === -1) return;

    // Convert column index to letter (A, B, C, ..., Z, AA, AB...)
    const colLetter = (idx: number): string => {
      let result = '';
      let n = idx;
      while (n >= 0) {
        result = String.fromCharCode((n % 26) + 65) + result;
        n = Math.floor(n / 26) - 1;
      }
      return result;
    };

    // Update status cell
    const statusCell = `${config.sheetTabName}!${colLetter(statusColIndex)}${rowIndex}`;
    const statusUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(statusCell)}?valueInputOption=RAW`;

    await this.sheetsRequest(statusUrl, {
      method: 'PUT',
      body: JSON.stringify({
        range: statusCell,
        values: [[status]],
      }),
    });

    // Update error message cell if applicable
    if (message && errorColIndex !== -1) {
      const errorCell = `${config.sheetTabName}!${colLetter(errorColIndex)}${rowIndex}`;
      const errorUrl = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(errorCell)}?valueInputOption=RAW`;

      await this.sheetsRequest(errorUrl, {
        method: 'PUT',
        body: JSON.stringify({
          range: errorCell,
          values: [[message]],
        }),
      });
    }
  }

  async testConnection(config: SpreadsheetConfig): Promise<boolean> {
    try {
      const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${encodeURIComponent(config.sheetTabName)}!A1`;
      await this.sheetsRequest<GoogleValueRange>(url);
      return true;
    } catch {
      return false;
    }
  }
}

// -- Suppressed import: HIDDEN_COL_COUNT is used implicitly in findExistingRow
void HIDDEN_COL_COUNT;
