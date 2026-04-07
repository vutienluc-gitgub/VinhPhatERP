-- Allow order_progress to track standalone work orders (no order needed)

-- 1. Make order_id nullable
ALTER TABLE order_progress ALTER COLUMN order_id DROP NOT NULL;

-- 2. Add work_order_id column
ALTER TABLE order_progress ADD COLUMN IF NOT EXISTS work_order_id uuid REFERENCES work_orders(id) ON DELETE CASCADE;

-- 3. Add index for work_order_id
CREATE INDEX IF NOT EXISTS idx_order_progress_work_order ON order_progress (work_order_id);

-- 4. Drop old unique constraint and add new one
ALTER TABLE order_progress DROP CONSTRAINT IF EXISTS order_progress_order_id_stage_key;

-- 5. Add check: at least one of order_id or work_order_id must be set
ALTER TABLE order_progress ADD CONSTRAINT chk_progress_has_parent
  CHECK (order_id IS NOT NULL OR work_order_id IS NOT NULL);

-- 6. Add unique constraints for both cases  
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_progress_order_stage
  ON order_progress (order_id, stage) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_order_progress_wo_stage
  ON order_progress (work_order_id, stage) WHERE work_order_id IS NOT NULL;
