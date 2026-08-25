/**
 * Domain types for VinhPhatERP Print Platform.
 * Level 9 Enterprise Architecture - Decoupled Print Subsystem.
 */

export type PrintArtifactType = 'document' | 'label' | 'report' | 'form';

export type FieldKind = 'scalar' | 'collection' | 'computed' | 'conditional';
export type FieldDataType = 'string' | 'number' | 'date' | 'boolean' | 'array';

export interface FieldDefinition {
  id: string;
  documentType: DocumentType;
  kind: FieldKind;
  dataType: FieldDataType;
  label: string;
  category:
    | 'company'
    | 'document'
    | 'customer'
    | 'items'
    | 'transport'
    | 'totals';
  sampleValue: unknown;
  formatter?: (val: unknown) => string;
}

export type DocumentType =
  | 'shipment_delivery'
  | 'inventory_receipt'
  | 'production_order'
  | 'sales_statement'
  | 'payment_receipt'
  | 'fabric_inspection'
  | 'roll_tag';

export type PrinterProfileType =
  | 'laser'
  | 'dot_matrix'
  | 'thermal_receipt'
  | 'thermal_label';

export type PaperFormat = 'A4' | 'A5' | 'K80' | 'DECAL_CUSTOM';

export type PageOrientation = 'portrait' | 'landscape';

export type TemplateStatus = 'active' | 'draft' | 'archived';

export interface PageDimensions {
  widthMm: number;
  heightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapMm?: number;
  isContinuous?: boolean;
}

export type TemplateBlockType =
  | 'text'
  | 'image'
  | 'table'
  | 'qr'
  | 'barcode'
  | 'line'
  | 'signature'
  | 'page_number';

export interface BaseBlock {
  id: string;
  order: number;
  enabled: boolean;
  xMm?: number;
  yMm?: number;
  widthMm?: number;
  heightMm?: number;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  fontSizePt: number;
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  assetId?: string;
  fallbackUrl?: string;
  fit: 'contain' | 'cover';
}

export interface TableColumnConfig {
  key: string;
  label: string;
  widthPercent: number;
  align: 'left' | 'center' | 'right';
  fieldBinding: string;
  formatter?: 'currency' | 'weight_kg' | 'length_m' | 'text';
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  collectionBinding: string;
  columns: TableColumnConfig[];
  showTotalRow: boolean;
  borderStyle: 'solid' | 'dashed' | 'none';
  rowHeightMm: number;
  maxRowsPerPage?: number;
}

export interface QRBlock extends BaseBlock {
  type: 'qr';
  valueBinding: string;
  sizeMm: number;
}

export interface BarcodeBlock extends BaseBlock {
  type: 'barcode';
  format: 'CODE128' | 'EAN13' | 'QR';
  valueBinding: string;
  showText: boolean;
}

export interface LineBlock extends BaseBlock {
  type: 'line';
  orientation: 'horizontal' | 'vertical';
  style: 'solid' | 'dashed' | 'dotted';
  thicknessMm: number;
}

export interface SignatureSlot {
  title: string;
  subtitle?: string;
  requiredRole?: string;
}

export interface SignatureBlock extends BaseBlock {
  type: 'signature';
  slots: SignatureSlot[];
}

export interface PageNumberBlock extends BaseBlock {
  type: 'page_number';
  format: 'Page X of Y' | 'Trang X/Y';
  align: 'left' | 'center' | 'right';
}

export type TemplateBlock =
  | TextBlock
  | ImageBlock
  | TableBlock
  | QRBlock
  | BarcodeBlock
  | LineBlock
  | SignatureBlock
  | PageNumberBlock;

export interface PrintLayoutStyles {
  fontFamily: 'Inter' | 'Roboto' | 'Courier_Mono';
  baseFontSizePt: number;
  showTractorHoles?: boolean;
  lineSpacingMultiplier?: number;
}

export interface PrintLayout {
  schemaVersion: 1;
  coordinateSystem: 'mm';
  page: PageDimensions;
  blocks: TemplateBlock[];
  styles?: PrintLayoutStyles;
}

export interface PrintTemplateEntity {
  id: string;
  tenantId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  artifactType: PrintArtifactType;
  documentType: DocumentType;
  targetPrinterProfile: PrinterProfileType;
  paperFormat: PaperFormat;
  orientation: PageOrientation;
  revision: number;
  status: TemplateStatus;
  isSystem: boolean;
  layout: PrintLayout;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface PrintTemplateDefault {
  id: string;
  tenantId?: string | null;
  documentType: DocumentType;
  printerProfileType: PrinterProfileType;
  paperFormat: PaperFormat;
  templateId: string;
  updatedAt: string;
}

export type OutputTarget = 'pdf' | 'browser' | 'raw_printer';

export interface PrinterProfile {
  id: string;
  name: string;
  profileType: PrinterProfileType;
  outputTarget: OutputTarget;
  supportedFormats: PaperFormat[];
  connection: {
    type: 'system_driver' | 'network_ip' | 'web_usb' | 'print_server';
    address?: string;
  };
  hardwareSettings?: {
    cpi?: 10 | 12 | 15;
    encoding?: 'UTF-8' | 'TCVN3' | 'ASCII';
    escPosDialect?: 'epson' | 'xprinter';
  };
}

export interface PrintJob {
  id: string;
  tenantId?: string | null;
  documentType: DocumentType;
  documentId: string;
  templateId: string;
  printerProfileId?: string | null;
  requestedBy: string;
  status: 'pending' | 'rendering' | 'completed' | 'failed';
  outputType: OutputTarget;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}
