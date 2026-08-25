import type { DocumentType, OutputTarget, PrintJob } from './types';

const JOBS_STORAGE_KEY = 'vinhphat_print_jobs_v2';

export function getStoredPrintJobs(): PrintJob[] {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrintJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordPrintJob(params: {
  documentType: DocumentType;
  documentId: string;
  templateId: string;
  outputType: OutputTarget;
  requestedBy?: string;
  status?: 'pending' | 'rendering' | 'completed' | 'failed';
  error?: string | null;
}): PrintJob {
  const current = getStoredPrintJobs();
  const job: PrintJob = {
    id: `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    documentType: params.documentType,
    documentId: params.documentId,
    templateId: params.templateId,
    requestedBy: params.requestedBy || 'Người dùng hiện tại',
    status: params.status || 'completed',
    outputType: params.outputType,
    error: params.error || null,
    createdAt: new Date().toISOString(),
    completedAt: params.status === 'failed' ? null : new Date().toISOString(),
  };

  // Keep last 100 print jobs
  const updated = [job, ...current].slice(0, 100);
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  return job;
}
