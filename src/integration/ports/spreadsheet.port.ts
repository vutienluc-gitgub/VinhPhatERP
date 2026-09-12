/**
 * Spreadsheet Port -- Application-level interface (Hexagonal Architecture)
 *
 * Defines the contract for ANY spreadsheet provider.
 * Application Services only import this interface.
 *
 * Adapter implementations:
 *   GoogleSheetsAdapter implements ISpreadsheetPort
 *   ExcelAdapter       implements ISpreadsheetPort  (future)
 *   ...
 *
 * Dependency flow:
 *   Application -> ISpreadsheetPort -> GoogleSheetsAdapter -> Google API
 *   Application does NOT know Google API exists.
 */

// -- Row Data ----------------------------------------------------------------

export interface SheetRowData {
  /** Hidden column -- idempotency key (entity UUID from ERP) */
  erpRecordId: string;
  /** Hidden column -- monotonic version for OCC */
  erpVersion: number;
  /** Hidden column -- deterministic sync ID */
  syncId: string;
  /** Visible column values in order */
  values: (string | number | null)[];
}

// -- Config ------------------------------------------------------------------

export interface SpreadsheetConfig {
  spreadsheetId: string;
  sheetTabName: string;
}

// -- Port Interface ----------------------------------------------------------

export interface ISpreadsheetPort {
  /**
   * Upsert 1 row (idempotent based on erpRecordId).
   *
   * Logic:
   *   - If row exists and erpVersion <= existing -> SKIP
   *   - If row exists and erpVersion > existing  -> UPDATE
   *   - If row not found -> APPEND
   */
  upsertRow(config: SpreadsheetConfig, row: SheetRowData): Promise<void>;

  /** Batch upsert multiple rows */
  batchUpsertRows(
    config: SpreadsheetConfig,
    rows: SheetRowData[],
  ): Promise<void>;

  /** Read rows where status column = READY (Phase 3: inbound import) */
  readReadyRows(config: SpreadsheetConfig): Promise<Record<string, unknown>[]>;

  /** Update status column on import tab (Phase 3) */
  updateImportStatus(
    config: SpreadsheetConfig,
    rowIndex: number,
    status: string,
    message?: string,
  ): Promise<void>;

  /** Test connection -- returns true if spreadsheet is accessible */
  testConnection(config: SpreadsheetConfig): Promise<boolean>;
}
