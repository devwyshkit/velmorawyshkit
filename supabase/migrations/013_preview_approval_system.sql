-- =====================================================
-- PREVIEW APPROVAL SYSTEM
-- Migrate from design_status to preview_status terminology
-- Add missing preview tracking columns
-- =====================================================

-- Add preview columns to order_items (using modern terminology)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preview_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preview_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preview_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preview_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing design_status to preview_status
UPDATE order_items 
SET preview_status = CASE 
  WHEN design_status = 'pending' THEN 'pending'
  WHEN design_status = 'submitted' THEN 'preview_ready'
  WHEN design_status = 'approved' THEN 'approved'
  WHEN design_status = 'rejected' THEN 'revision_requested'
  ELSE 'pending'
END
WHERE design_status IS NOT NULL;

-- Migrate existing design_proof_url to preview_url
UPDATE order_items 
SET preview_url = design_proof_url
WHERE design_proof_url IS NOT NULL;

-- Migrate existing design_approved_at to preview_approved_at
UPDATE order_items 
SET preview_approved_at = design_approved_at
WHERE design_approved_at IS NOT NULL;

-- Create indexes for preview queries
CREATE INDEX IF NOT EXISTS idx_order_items_preview_status ON order_items(preview_status);
CREATE INDEX IF NOT EXISTS idx_order_items_preview_deadline ON order_items(preview_deadline);

-- Update orders status CHECK constraint to include preview statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'placed', 'confirmed', 'preview_pending', 'preview_ready', 
    'preview_approved', 'revision_requested', 'in_production',
    'production_complete', 'ready_for_pickup', 'picked_up',
    'out_for_delivery', 'delivery_attempted', 'delivered',
    'cancelled', 'return_requested', 'return_picked_up',
    'returned', 'refunded'
  ));

-- Add comment
COMMENT ON COLUMN order_items.preview_url IS 'URL to preview mockup/render of customizable item';
COMMENT ON COLUMN order_items.preview_status IS 'Status: pending, preview_ready, approved, revision_requested';
COMMENT ON COLUMN order_items.revision_count IS 'Number of revisions requested (2 free, then paid)';

