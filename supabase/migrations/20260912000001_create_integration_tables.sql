-- =====================================================================
-- Google Sheets Integration — Database Schema
-- =====================================================================
-- 4 tables for the Integration Layer:
--   1. integration_connections    — External provider connections
--   2. integration_sheet_mappings — Entity ↔ Sheet tab mapping
--   3. integration_sync_jobs      — Transactional Outbox / Queue
--   4. integration_sync_logs      — Audit trail per sync attempt
--
-- SECURITY: Private keys are stored EXCLUSIVELY in Supabase Secrets.
--           This schema does NOT contain any credential columns.
-- =====================================================================

-- 1. Integration Connections
-- Manages connections to external providers (Google Sheets, Excel, etc.)
CREATE TABLE IF NOT EXISTS integration_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid,
    provider        VARCHAR(50)  NOT NULL,
    name            VARCHAR(200) NOT NULL,
    config          JSONB        NOT NULL DEFAULT '{}',
    status          VARCHAR(20)  NOT NULL DEFAULT 'active',
    last_synced_at  TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE integration_connections IS
  'External integration connections. Credentials (private keys) are stored '
  'exclusively in Supabase Secrets — never in this table.';

COMMENT ON COLUMN integration_connections.config IS
  'Non-sensitive config only: { spreadsheet_id, service_account_email }. '
  'Private key lives in GOOGLE_SA_PRIVATE_KEY env var.';

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_connections_tenant_isolation"
    ON integration_connections
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 2. Sheet Tab Mappings
-- Maps ERP entity types to specific Google Sheet tabs
CREATE TABLE IF NOT EXISTS integration_sheet_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid,
    connection_id   UUID         NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50)  NOT NULL,
    direction       VARCHAR(20)  NOT NULL,
    sheet_tab_name  VARCHAR(200) NOT NULL,
    column_mapping  JSONB        NOT NULL DEFAULT '{}',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (connection_id, entity_type, direction)
);

ALTER TABLE integration_sheet_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_sheet_mappings_tenant_isolation"
    ON integration_sheet_mappings
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 3. Sync Jobs (Transactional Outbox)
-- Persistent queue for all sync operations.
-- sync_id is DETERMINISTIC: SHA-256(entity_type + entity_id + version + connection_id).
-- Retry N times with same entity+version always produces the same sync_id.
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid,
    connection_id   UUID         REFERENCES integration_connections(id),
    provider        VARCHAR(50)  NOT NULL DEFAULT 'google_sheets',
    direction       VARCHAR(20)  NOT NULL,
    entity_type     VARCHAR(50)  NOT NULL,
    entity_id       UUID         NOT NULL,
    sync_id         VARCHAR(128) NOT NULL,
    version         INT          NOT NULL DEFAULT 1,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
    payload         JSONB,
    attempt_count   INT          NOT NULL DEFAULT 0,
    max_attempts    INT          NOT NULL DEFAULT 5,
    next_retry_at   TIMESTAMPTZ,
    last_error      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,

    UNIQUE (sync_id)
);

COMMENT ON COLUMN integration_sync_jobs.sync_id IS
  'Deterministic idempotency key: SHA-256(entity_type + entity_id + version + connection_id). '
  'Retry N times always produces the same job — no duplicates.';

-- Worker polling index: find pending or retryable jobs
CREATE INDEX IF NOT EXISTS idx_sync_jobs_pending_retry
    ON integration_sync_jobs(status, next_retry_at)
    WHERE status IN ('pending', 'failed');

-- Lookup by entity
CREATE INDEX IF NOT EXISTS idx_sync_jobs_entity
    ON integration_sync_jobs(entity_type, entity_id);

ALTER TABLE integration_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_sync_jobs_tenant_isolation"
    ON integration_sync_jobs
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 4. Sync Logs (Audit Trail)
-- Detailed log entries per sync job attempt
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL DEFAULT (current_setting('app.current_tenant_id', true))::uuid,
    job_id          UUID         NOT NULL REFERENCES integration_sync_jobs(id) ON DELETE CASCADE,
    level           VARCHAR(10)  NOT NULL DEFAULT 'info',
    message         TEXT         NOT NULL,
    details         JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_job
    ON integration_sync_logs(job_id, created_at);

ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_sync_logs_tenant_isolation"
    ON integration_sync_logs
    FOR ALL
    USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
