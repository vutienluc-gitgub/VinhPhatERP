import type {
  DocumentType,
  PaperFormat,
  PrinterProfileType,
  PrintTemplateEntity,
} from './types';

export interface ResolveTemplateParams {
  documentType: DocumentType;
  printerProfileType?: PrinterProfileType;
  paperFormat?: PaperFormat;
  templates: PrintTemplateEntity[];
  defaultsMap: Record<string, string>;
}

export function resolvePrintTemplate({
  documentType,
  printerProfileType,
  paperFormat,
  templates,
  defaultsMap,
}: ResolveTemplateParams): PrintTemplateEntity | null {
  // 1. If explicit printerProfileType and paperFormat provided, check defaultsMap
  if (printerProfileType && paperFormat) {
    const contextKey = `${documentType}:${printerProfileType}:${paperFormat}`;
    const defaultId = defaultsMap[contextKey];
    if (defaultId) {
      const match = templates.find(
        (t) => t.id === defaultId && t.status === 'active',
      );
      if (match) return match;
    }
  }

  // 2. Find any default template for this documentType
  const activeForDoc = templates.filter(
    (t) => t.documentType === documentType && t.status === 'active',
  );

  if (activeForDoc.length === 0) {
    // Fallback to any active template in the system or first seed
    return templates.find((t) => t.status === 'active') || templates[0] || null;
  }

  // Check if any active template is referenced in defaultsMap for this docType
  for (const key of Object.keys(defaultsMap)) {
    if (key.startsWith(`${documentType}:`)) {
      const targetId = defaultsMap[key];
      const matched = activeForDoc.find((t) => t.id === targetId);
      if (matched) return matched;
    }
  }

  // Fallback to first active template matching the documentType
  return activeForDoc[0] || null;
}
