import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  DEFAULT_PRINT_TEMPLATES_SEED,
  type DocumentType,
  type PaperFormat,
  type PrinterProfileType,
  type PrintTemplateEntity,
} from '@/domain/print';

const STORAGE_KEY = 'vinhphat_print_templates_v2';
const DEFAULTS_KEY = 'vinhphat_print_template_defaults_v2';

interface PrintDefaultsMap {
  [contextKey: string]: string; // "shipment_delivery:dot_matrix:A5" -> templateId
}

function getStoredTemplates(): PrintTemplateEntity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_PRINT_TEMPLATES_SEED),
      );
      return DEFAULT_PRINT_TEMPLATES_SEED;
    }
    const parsed = JSON.parse(raw) as PrintTemplateEntity[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_PRINT_TEMPLATES_SEED;
  } catch {
    return DEFAULT_PRINT_TEMPLATES_SEED;
  }
}

function getStoredDefaults(): PrintDefaultsMap {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (!raw) {
      const initialMap: PrintDefaultsMap = {
        'shipment_delivery:dot_matrix:A5': 'tpl-shipment-a5-dot-matrix',
        'shipment_delivery:laser:A4': 'tpl-shipment-a4-laser',
        'roll_tag:thermal_label:DECAL_CUSTOM': 'tpl-roll-tag-barcode',
        'inventory_receipt:laser:A4': 'tpl-inventory-receipt-a4',
        'production_order:laser:A4': 'tpl-production-order-a4',
      };
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(initialMap));
      return initialMap;
    }
    return JSON.parse(raw) as PrintDefaultsMap;
  } catch {
    return {};
  }
}

export function usePrintTemplates() {
  return useQuery({
    queryKey: ['print-templates'],
    queryFn: async (): Promise<PrintTemplateEntity[]> => {
      // Return local templates list (synced with localStorage & seeds)
      return getStoredTemplates();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrintTemplateDefaults() {
  return useQuery({
    queryKey: ['print-template-defaults'],
    queryFn: async (): Promise<PrintDefaultsMap> => {
      return getStoredDefaults();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePrintTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      newTemplate: Omit<
        PrintTemplateEntity,
        'id' | 'createdAt' | 'updatedAt' | 'revision'
      >,
    ): Promise<PrintTemplateEntity> => {
      const current = getStoredTemplates();
      const entity: PrintTemplateEntity = {
        ...newTemplate,
        id: `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        revision: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [entity, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return entity;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-templates'] });
    },
  });
}

export function useUpdatePrintTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updatedEntity: PrintTemplateEntity,
    ): Promise<PrintTemplateEntity> => {
      const current = getStoredTemplates();
      const nextList = current.map((item) =>
        item.id === updatedEntity.id
          ? {
              ...updatedEntity,
              revision: item.revision + 1,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
      return updatedEntity;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-templates'] });
    },
  });
}

export function useDuplicatePrintTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      templateId: string;
      newName: string;
      newCode: string;
    }): Promise<PrintTemplateEntity> => {
      const current = getStoredTemplates();
      const target = current.find((t) => t.id === params.templateId);
      if (!target) {
        throw new Error('Template not found');
      }

      const entity: PrintTemplateEntity = {
        ...target,
        id: `tpl-${Date.now().toString(36)}-copy`,
        name: params.newName,
        code: params.newCode,
        isSystem: false,
        revision: 1,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [entity, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return entity;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-templates'] });
    },
  });
}

export function useSetDefaultPrintTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      templateId: string;
      documentType: DocumentType;
      printerProfileType: PrinterProfileType;
      paperFormat: PaperFormat;
    }) => {
      const contextKey = `${params.documentType}:${params.printerProfileType}:${params.paperFormat}`;
      const currentDefaults = getStoredDefaults();
      currentDefaults[contextKey] = params.templateId;
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(currentDefaults));
      return { contextKey, templateId: params.templateId };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['print-template-defaults'],
      });
    },
  });
}

export function useArchivePrintTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const current = getStoredTemplates();
      const nextList = current.map((item) =>
        item.id === templateId
          ? {
              ...item,
              status:
                item.status === 'archived'
                  ? ('active' as const)
                  : ('archived' as const),
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
      return templateId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-templates'] });
    },
  });
}
