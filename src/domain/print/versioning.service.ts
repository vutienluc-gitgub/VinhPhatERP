import type { PrintTemplateEntity } from './types';

export interface PrintTemplateRevision {
  id: string;
  templateId: string;
  revision: number;
  templateSnapshot: PrintTemplateEntity;
  savedBy: string;
  note?: string;
  createdAt: string;
}

const REVISIONS_STORAGE_KEY = 'vinhphat_print_template_revisions_v2';

export function getStoredRevisions(
  templateId?: string,
): PrintTemplateRevision[] {
  try {
    const raw = localStorage.getItem(REVISIONS_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as PrintTemplateRevision[];
    if (!Array.isArray(all)) return [];
    return templateId ? all.filter((r) => r.templateId === templateId) : all;
  } catch {
    return [];
  }
}

export function saveTemplateRevision(
  template: PrintTemplateEntity,
  savedBy = 'Quản trị viên',
  note = 'Cập nhật bản thiết kế',
): PrintTemplateRevision {
  const current = getStoredRevisions();
  const revision: PrintTemplateRevision = {
    id: `rev-${template.id}-${template.revision}-${Date.now().toString(36)}`,
    templateId: template.id,
    revision: template.revision,
    templateSnapshot: JSON.parse(
      JSON.stringify(template),
    ) as PrintTemplateEntity,
    savedBy,
    note,
    createdAt: new Date().toISOString(),
  };

  const updated = [revision, ...current].slice(0, 200); // keep up to 200 revisions
  try {
    localStorage.setItem(REVISIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota
  }

  return revision;
}
