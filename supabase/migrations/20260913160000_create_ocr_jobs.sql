-- ============================================================================
-- Migration: Create OCR Jobs Audit & Anti-Fraud Persistence Table
-- Description: Stores scan telemetry, raw provenance JSON, SHA-256 image hashes,
--              and linkages to yarn receipts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL DEFAULT 'YARN_WEIGHING_SLIP',
  status VARCHAR(30) NOT NULL DEFAULT 'EXTRACTED',

  -- Anti-Fraud & File Reference
  image_hash VARCHAR(64) NOT NULL,
  original_image_url TEXT,
  file_name TEXT,

  -- Telemetry & Diagnostics
  correlation_id VARCHAR(64) NOT NULL,
  engine VARCHAR(30) NOT NULL DEFAULT 'gemini-2.5-flash',
  duration_ms INTEGER,
  vision_duration_ms INTEGER,

  -- Provenance Data
  raw_extraction_json JSONB NOT NULL,
  suggested_receipt_json JSONB,

  -- Audit Flags
  needs_manual_review BOOLEAN NOT NULL DEFAULT false,
  review_reasons JSONB DEFAULT '[]'::jsonb,
  math_discrepancy BOOLEAN NOT NULL DEFAULT false,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_type VARCHAR(30),

  -- Linkages
  created_receipt_id UUID REFERENCES public.yarn_receipts(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Indexes for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_image_hash ON public.ocr_jobs(image_hash);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_tenant_created ON public.ocr_jobs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_status ON public.ocr_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_receipt ON public.ocr_jobs(created_receipt_id);

-- Row Level Security (RLS)
ALTER TABLE public.ocr_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_ocr_jobs" ON public.ocr_jobs
  USING (tenant_id = (SELECT current_setting('app.tenant_id', true))::uuid);
