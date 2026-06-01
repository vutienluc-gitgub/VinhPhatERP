-- Add new columns for Machine Specifications
ALTER TABLE machine_specifications
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual';

-- Set existing auto-generated ones to 'auto_generated' based on the fact that they were generated in the previous migration
UPDATE machine_specifications
SET source_type = 'auto_generated'
WHERE source_type = 'manual'; -- since they were all generated

-- Ensure code is unique per tenant
ALTER TABLE machine_specifications
DROP CONSTRAINT IF EXISTS machine_specifications_tenant_code_key;

ALTER TABLE machine_specifications
ADD CONSTRAINT machine_specifications_tenant_code_key UNIQUE (tenant_id, code);

-- Create index for faster lookup by code
CREATE INDEX IF NOT EXISTS idx_machine_specs_code ON machine_specifications(tenant_id, code);
