import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PRINT_TEMPLATES_SEED,
  PACKING_LIST_TEMPLATES,
  getFieldsForDocument,
  printTemplateSchema,
  resolvePrintTemplate,
} from '@/domain/print';

describe('packing_list print templates', () => {
  it('ships two A5 landscape packing-list templates in the seed', () => {
    expect(PACKING_LIST_TEMPLATES).toHaveLength(2);
    for (const tpl of PACKING_LIST_TEMPLATES) {
      expect(tpl.documentType).toBe('packing_list');
      expect(tpl.paperFormat).toBe('A5');
      expect(tpl.orientation).toBe('landscape');
      expect(tpl.status).toBe('active');
    }
  });

  it('exposes the packing-list templates through the aggregate seed', () => {
    const ids = DEFAULT_PRINT_TEMPLATES_SEED.map((t) => t.id);
    expect(ids).toContain('tpl-packing-list-a5-laser');
    expect(ids).toContain('tpl-packing-list-a5-dot-matrix');
  });

  it('validates every packing-list template against the print schema', () => {
    for (const tpl of PACKING_LIST_TEMPLATES) {
      const result = printTemplateSchema.safeParse(tpl);
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    }
  });

  it('binds the table to the packing_list.rolls collection', () => {
    const table = PACKING_LIST_TEMPLATES[0]?.layout.blocks.find(
      (b) => b.type === 'table',
    );
    expect(table?.type).toBe('table');
    if (table?.type === 'table') {
      expect(table.collectionBinding).toBe('packing_list.rolls');
      expect(table.columns.some((c) => c.fieldBinding === 'weight_kg')).toBe(
        true,
      );
    }
  });
});

describe('packing_list field registry', () => {
  it('registers packing-list fields including the roll collection', () => {
    const fields = getFieldsForDocument('packing_list');
    const ids = fields.map((f) => f.id);
    expect(ids).toContain('document.number');
    expect(ids).toContain('customer.name');
    expect(ids).toContain('packing_list.rolls');
    expect(ids).toContain('packing_list.totals.total_weight_kg');
  });

  it('includes company fields for every document type', () => {
    const fields = getFieldsForDocument('packing_list');
    expect(fields.some((f) => f.category === 'company')).toBe(true);
  });
});

describe('resolvePrintTemplate for packing_list', () => {
  it('prefers the context default for packing_list:laser:A5', () => {
    const resolved = resolvePrintTemplate({
      documentType: 'packing_list',
      printerProfileType: 'laser',
      paperFormat: 'A5',
      templates: DEFAULT_PRINT_TEMPLATES_SEED,
      defaultsMap: {
        'packing_list:laser:A5': 'tpl-packing-list-a5-laser',
      },
    });
    expect(resolved?.id).toBe('tpl-packing-list-a5-laser');
  });

  it('falls back to an active packing_list template when no default exists', () => {
    const resolved = resolvePrintTemplate({
      documentType: 'packing_list',
      templates: DEFAULT_PRINT_TEMPLATES_SEED,
      defaultsMap: {},
    });
    expect(resolved?.documentType).toBe('packing_list');
  });
});
