-- Migration: Media Manager — folders, assets, RLS, indexes
-- Supports multi-tenant, soft delete, nested folders

-- ─── Folders ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_folder_name_parent UNIQUE (tenant_id, parent_id, name)
);

-- Index for parent-child lookup
CREATE INDEX IF NOT EXISTS idx_media_folders_parent
  ON public.media_folders(tenant_id, parent_id);

-- ─── Assets ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,       -- UUID-based name on storage
    original_name TEXT NOT NULL,   -- Human-readable original name
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,    -- Full path in Supabase bucket
    bucket TEXT NOT NULL DEFAULT 'public-media',
    public_url TEXT,              -- Cached public URL (only for public bucket)
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ        -- Soft delete
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_media_assets_folder
  ON public.media_assets(tenant_id, folder_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_assets_type
  ON public.media_assets(tenant_id, mime_type) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_media_assets_search
  ON public.media_assets(tenant_id, original_name) WHERE deleted_at IS NULL;

-- ─── RLS ───────────────────────────────────────────
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets  ENABLE ROW LEVEL SECURITY;

-- Folders: tenant-scoped CRUD
CREATE POLICY media_folders_tenant_select ON public.media_folders
  FOR SELECT USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY media_folders_tenant_insert ON public.media_folders
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY media_folders_tenant_update ON public.media_folders
  FOR UPDATE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY media_folders_tenant_delete ON public.media_folders
  FOR DELETE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- Assets: tenant-scoped CRUD
CREATE POLICY media_assets_tenant_select ON public.media_assets
  FOR SELECT USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY media_assets_tenant_insert ON public.media_assets
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY media_assets_tenant_update ON public.media_assets
  FOR UPDATE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY media_assets_tenant_delete ON public.media_assets
  FOR DELETE USING (
    tenant_id IN (
      SELECT t.id FROM public.tenants t
      INNER JOIN public.profiles p ON p.tenant_id = t.id
      WHERE p.id = auth.uid()
    )
  );

-- ─── Updated_at trigger ────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
