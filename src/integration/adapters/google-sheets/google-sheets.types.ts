/**
 * Google Sheets API -- Type definitions
 *
 * Types specific to Google Sheets API v4 responses and requests.
 * Only used inside the google-sheets adapter -- never leaked to Application layer.
 */

/** Google Sheets API v4 -- ValueRange response */
export interface GoogleValueRange {
  range: string;
  majorDimension: 'ROWS' | 'COLUMNS';
  values: (string | number)[][];
}

/** Google Sheets API v4 -- AppendValuesResponse */
export interface GoogleAppendResponse {
  spreadsheetId: string;
  tableRange: string;
  updates: {
    spreadsheetId: string;
    updatedRange: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
  };
}

/** Google Sheets API v4 -- UpdateValuesResponse */
export interface GoogleUpdateResponse {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

/** Internal: Resolved row position on the sheet */
export interface ResolvedRow {
  rowIndex: number;
  erpRecordId: string;
  erpVersion: number;
}

/** Google Sheets API base URL */
export const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
