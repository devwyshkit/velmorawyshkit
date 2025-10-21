-- Migration: Product Approval Workflow
-- Description: Admin review and approval required before products go live
-- Based on Swiggy/Zomato menu approval pattern

-- ============================================================================
-- 1. ADD APPROVAL FIELDS TO PARTNER_PRODUCTS
-- ============================================================================

ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending_review' 
  CHECK (approval_status IN ('pending_review', 'approved', 'rejected', 'changes_requested')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update existing products to approved (grandfather existing data)
UPDATE partner_products
SET approval_status = 'approved',
    approved_at = NOW(),
    reviewed_at = NOW()
WHERE approval_status = 'pending_review' OR approval_status IS NULL;

COMMENT ON COLUMN partner_products.approval_status IS 'Product moderation status: pending_review → approved/rejected/changes_requested';

-- ============================================================================
-- 2. RLS POLICIES - CRITICAL FOR SECURITY!
-- ============================================================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Customers can view products" ON partner_products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON partner_products;

-- Customers and anonymous users only see APPROVED products
DROP POLICY IF EXISTS "Customers see approved products only" ON partner_products;
CREATE POLICY "Customers see approved products only"
  ON partner_products FOR SELECT
  TO anon, authenticated
  USING (
    approval_status = 'approved' 
    AND is_active = TRUE
  );

-- Partners see their OWN products (any status)
DROP POLICY IF EXISTS "Partners view own products all statuses" ON partner_products;
CREATE POLICY "Partners view own products all statuses"
  ON partner_products FOR SELECT
  USING (partner_id = auth.uid());

-- Partners can INSERT products (default to pending_review)
DROP POLICY IF EXISTS "Partners can create products" ON partner_products;
CREATE POLICY "Partners can create products"
  ON partner_products FOR INSERT
  WITH CHECK (
    partner_id = auth.uid() 
    AND approval_status = 'pending_review'
  );

-- Partners can UPDATE own products (resets to pending_review if approved)
DROP POLICY IF EXISTS "Partners can update own products" ON partner_products;
CREATE POLICY "Partners can update own products"
  ON partner_products FOR UPDATE
  USING (partner_id = auth.uid())
  WITH CHECK (
    partner_id = auth.uid()
    -- Significant changes require re-approval
  );

-- Only admins can approve/reject products
DROP POLICY IF EXISTS "Only admins can approve products" ON partner_products;
CREATE POLICY "Only admins can approve products"
  ON partner_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================================
-- 3. TRIGGER: NOTIFY PARTNER ON REJECTION
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_product_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status change
  IF NEW.approval_status != OLD.approval_status THEN
    -- Rejected: Notify partner
    IF NEW.approval_status = 'rejected' THEN
      RAISE NOTICE 'Product % (%) rejected by admin. Reason: %', 
        NEW.id, NEW.name, NEW.rejection_reason;
      
      -- TODO: Send email via Edge Function
      -- await supabase.functions.invoke('send-email', {
      --   to: partner.email,
      --   template: 'product-rejected',
      --   data: { product_name, reason }
      -- });
    END IF;

    -- Approved: Notify partner (optional)
    IF NEW.approval_status = 'approved' THEN
      RAISE NOTICE 'Product % (%) approved! Now live for customers.', 
        NEW.id, NEW.name;
    END IF;

    NEW.reviewed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_product_status_change ON partner_products;
CREATE TRIGGER on_product_status_change
  BEFORE UPDATE ON partner_products
  FOR EACH ROW
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION notify_product_status_change();

-- ============================================================================
-- 4. TRIGGER: RESET TO PENDING ON SIGNIFICANT EDIT
-- ============================================================================

CREATE OR REPLACE FUNCTION check_product_reapproval()
RETURNS TRIGGER AS $$
BEGIN
  -- If approved product has significant changes, require re-approval
  IF OLD.approval_status = 'approved' AND (
    NEW.name != OLD.name OR
    NEW.description != OLD.description OR
    NEW.images != OLD.images OR
    NEW.price != OLD.price
  ) THEN
    NEW.approval_status = 'pending_review';
    NEW.reviewed_at = NULL;
    
    RAISE NOTICE 'Product % edited. Requires re-approval.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_reapproval ON partner_products;
CREATE TRIGGER check_reapproval
  BEFORE UPDATE ON partner_products
  FOR EACH ROW
  WHEN (OLD.approval_status = 'approved')
  EXECUTE FUNCTION check_product_reapproval();

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_approval_status ON partner_products(approval_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_pending_review ON partner_products(approval_status, created_at DESC) 
  WHERE approval_status = 'pending_review';
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON partner_products(approved_by);

-- ============================================================================
-- 6. ADMIN MODERATION STATS VIEW (HELPER)
-- ============================================================================

CREATE OR REPLACE VIEW admin_moderation_stats AS
SELECT 
  COUNT(*) FILTER (WHERE approval_status = 'pending_review') AS pending_count,
  COUNT(*) FILTER (WHERE approval_status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE approval_status = 'rejected') AS rejected_count,
  COUNT(*) FILTER (WHERE approval_status = 'changes_requested') AS changes_requested_count,
  COUNT(*) AS total_products,
  COUNT(DISTINCT partner_id) AS total_partners_with_products,
  AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) FILTER (WHERE approved_at IS NOT NULL) AS avg_approval_time_hours
FROM partner_products;

-- Success message
SELECT 
  'Product approval workflow created!' AS status,
  (SELECT pending_count FROM admin_moderation_stats) AS products_pending_review;

