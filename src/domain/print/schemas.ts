import { z } from 'zod';

export const pageDimensionsSchema = z.object({
  widthMm: z.number().min(30).max(1000),
  heightMm: z.number().min(30).max(1000),
  marginTopMm: z.number().min(0).max(100),
  marginBottomMm: z.number().min(0).max(100),
  marginLeftMm: z.number().min(0).max(100),
  marginRightMm: z.number().min(0).max(100),
  gapMm: z.number().min(0).max(50).optional(),
  isContinuous: z.boolean().optional(),
});

const baseBlockSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(0),
  enabled: z.boolean(),
  xMm: z.number().optional(),
  yMm: z.number().optional(),
  widthMm: z.number().optional(),
  heightMm: z.number().optional(),
});

export const textBlockSchema = baseBlockSchema.extend({
  type: z.literal('text'),
  content: z.string(),
  fontSizePt: z.number().min(6).max(72),
  fontWeight: z.enum(['normal', 'bold']),
  align: z.enum(['left', 'center', 'right']),
});

export const imageBlockSchema = baseBlockSchema.extend({
  type: z.literal('image'),
  assetId: z.string().optional(),
  fallbackUrl: z.string().optional(),
  fit: z.enum(['contain', 'cover']),
});

export const tableColumnConfigSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  widthPercent: z.number().min(1).max(100),
  align: z.enum(['left', 'center', 'right']),
  fieldBinding: z.string().min(1),
  formatter: z.enum(['currency', 'weight_kg', 'length_m', 'text']).optional(),
});

export const tableBlockSchema = baseBlockSchema.extend({
  type: z.literal('table'),
  collectionBinding: z.string().min(1),
  columns: z.array(tableColumnConfigSchema),
  showTotalRow: z.boolean(),
  borderStyle: z.enum(['solid', 'dashed', 'none']),
  rowHeightMm: z.number().min(3).max(50),
  maxRowsPerPage: z.number().int().min(1).optional(),
});

export const qrBlockSchema = baseBlockSchema.extend({
  type: z.literal('qr'),
  valueBinding: z.string().min(1),
  sizeMm: z.number().min(10).max(100),
});

export const barcodeBlockSchema = baseBlockSchema.extend({
  type: z.literal('barcode'),
  format: z.enum(['CODE128', 'EAN13', 'QR']),
  valueBinding: z.string().min(1),
  showText: z.boolean(),
});

export const lineBlockSchema = baseBlockSchema.extend({
  type: z.literal('line'),
  orientation: z.enum(['horizontal', 'vertical']),
  style: z.enum(['solid', 'dashed', 'dotted']),
  thicknessMm: z.number().min(0.1).max(10),
});

export const signatureSlotSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  requiredRole: z.string().optional(),
});

export const signatureBlockSchema = baseBlockSchema.extend({
  type: z.literal('signature'),
  slots: z.array(signatureSlotSchema),
});

export const pageNumberBlockSchema = baseBlockSchema.extend({
  type: z.literal('page_number'),
  format: z.enum(['Page X of Y', 'Trang X/Y']),
  align: z.enum(['left', 'center', 'right']),
});

export const templateBlockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  imageBlockSchema,
  tableBlockSchema,
  qrBlockSchema,
  barcodeBlockSchema,
  lineBlockSchema,
  signatureBlockSchema,
  pageNumberBlockSchema,
]);

export const printLayoutStylesSchema = z.object({
  fontFamily: z.enum(['Inter', 'Roboto', 'Courier_Mono']),
  baseFontSizePt: z.number().min(6).max(24),
  showTractorHoles: z.boolean().optional(),
  lineSpacingMultiplier: z.number().min(0.8).max(3).optional(),
});

export const printLayoutSchema = z.object({
  schemaVersion: z.literal(1),
  coordinateSystem: z.literal('mm'),
  page: pageDimensionsSchema,
  blocks: z.array(templateBlockSchema),
  styles: printLayoutStylesSchema.optional(),
});

export const printTemplateSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().nullable().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  artifactType: z.enum(['document', 'label', 'report', 'form']),
  documentType: z.enum([
    'shipment_delivery',
    'inventory_receipt',
    'production_order',
    'sales_statement',
    'payment_receipt',
    'fabric_inspection',
    'roll_tag',
  ]),
  targetPrinterProfile: z.enum([
    'laser',
    'dot_matrix',
    'thermal_receipt',
    'thermal_label',
  ]),
  paperFormat: z.enum(['A4', 'A5', 'K80', 'DECAL_CUSTOM']),
  orientation: z.enum(['portrait', 'landscape']),
  revision: z.number().int().min(1),
  status: z.enum(['active', 'draft', 'archived']),
  isSystem: z.boolean(),
  layout: printLayoutSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

export type PrintTemplateSchemaInput = z.infer<typeof printTemplateSchema>;
