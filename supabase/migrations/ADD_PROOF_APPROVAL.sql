-- Proof Approval Flow Database Schema
-- Allows customers to approve mockups before hamper production

-- Table: proof_submissions
CREATE TABLE IF NOT EXISTS proof_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partner_profiles(partner_id),
  customer_id UUID, -- Can be null for guest orders
  mockup_urls TEXT[] DEFAULT '{}', -- Array of Cloudinary URLs
  status TEXT DEFAULT 'pending', -- pending, approved, revision_requested, rejected
  revision_count INTEGER DEFAULT 0,
  max_revisions INTEGER DEFAULT 2,
  customer_feedback TEXT,
  branding_requirements TEXT[], -- Array of requirements (from product add-ons)
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: proof_revisions (revision history)
CREATE TABLE IF NOT EXISTS proof_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proof_submission_id UUID REFERENCES proof_submissions(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  mockup_urls TEXT[] DEFAULT '{}',
  customer_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add proof fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS requires_proof BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS proof_submission_id UUID REFERENCES proof_submissions(id),
ADD COLUMN IF NOT EXISTS proof_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS proof_approved_at TIMESTAMPTZ;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proof_submissions_order ON proof_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_partner ON proof_submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_customer ON proof_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_proof_submissions_status ON proof_submissions(status);
CREATE INDEX IF NOT EXISTS idx_proof_revisions_submission ON proof_revisions(proof_submission_id);
CREATE INDEX IF NOT EXISTS idx_orders_requires_proof ON orders(requires_proof) WHERE requires_proof = true;

-- RLS Policies for proof_submissions
ALTER TABLE proof_submissions ENABLE ROW LEVEL SECURITY;

-- Partners can view and manage their own proof submissions
CREATE POLICY "Partners can view their own proofs"
  ON proof_submissions FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can insert their own proofs"
  ON proof_submissions FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can update their own proofs"
  ON proof_submissions FOR UPDATE
  USING (partner_id = auth.uid());

-- Customers can view and approve proofs for their orders
CREATE POLICY "Customers can view proofs for their orders"
  ON proof_submissions FOR SELECT
  USING (
    customer_id = auth.uid() OR
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update proofs for their orders"
  ON proof_submissions FOR UPDATE
  USING (
    customer_id = auth.uid() OR
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- Admins can view all proofs
CREATE POLICY "Admins can view all proofs"
  ON proof_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- RLS Policies for proof_revisions
ALTER TABLE proof_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view revisions for their proofs"
  ON proof_revisions FOR SELECT
  USING (
    proof_submission_id IN (
      SELECT id FROM proof_submissions WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can insert revisions"
  ON proof_revisions FOR INSERT
  WITH CHECK (
    proof_submission_id IN (
      SELECT id FROM proof_submissions WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view revisions for their proofs"
  ON proof_revisions FOR SELECT
  USING (
    proof_submission_id IN (
      SELECT id FROM proof_submissions 
      WHERE customer_id = auth.uid() OR 
            order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    )
  );

-- Function to auto-update order when proof is approved
CREATE OR REPLACE FUNCTION update_order_on_proof_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE orders 
    SET proof_approved = TRUE,
        proof_approved_at = NOW()
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order when proof is approved
DROP TRIGGER IF EXISTS trigger_update_order_on_proof_approval ON proof_submissions;
CREATE TRIGGER trigger_update_order_on_proof_approval
  AFTER UPDATE OF status ON proof_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_order_on_proof_approval();

-- Function to increment revision count
CREATE OR REPLACE FUNCTION increment_proof_revision()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proof_submissions 
  SET revision_count = revision_count + 1,
      updated_at = NOW()
  WHERE id = NEW.proof_submission_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment revision count
DROP TRIGGER IF EXISTS trigger_increment_revision ON proof_revisions;
CREATE TRIGGER trigger_increment_revision
  AFTER INSERT ON proof_revisions
  FOR EACH ROW
  EXECUTE FUNCTION increment_proof_revision();

COMMENT ON TABLE proof_submissions IS 'Mockup proofs for customer approval before hamper production';
COMMENT ON TABLE proof_revisions IS 'Revision history for proof submissions';
COMMENT ON COLUMN proof_submissions.max_revisions IS 'Maximum allowed revisions (default 2)';
COMMENT ON COLUMN proof_submissions.branding_requirements IS 'List of branding requirements from product add-ons';

