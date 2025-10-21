-- Kitting Workflow Database Schema
-- Tracks hamper assembly from component delivery to final pickup

-- Table: kitting_jobs (one per hamper order)
CREATE TABLE IF NOT EXISTS kitting_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partner_profiles(partner_id),
  status TEXT DEFAULT 'awaiting_components', 
  -- statuses: awaiting_components, ready_to_kit, in_progress, qc_pending, completed, shipped
  components_received_at TIMESTAMPTZ,
  kitting_started_at TIMESTAMPTZ,
  kitting_completed_at TIMESTAMPTZ,
  qc_completed_at TIMESTAMPTZ,
  pickup_scheduled_time TIMESTAMPTZ,
  pickup_completed_at TIMESTAMPTZ,
  total_units INTEGER NOT NULL, -- How many hampers to assemble
  units_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: kitting_components (track each component type delivery for a job)
CREATE TABLE IF NOT EXISTS kitting_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitting_job_id UUID REFERENCES kitting_jobs(id) ON DELETE CASCADE,
  component_product_id UUID REFERENCES partner_products(id),
  sourcing_order_id UUID REFERENCES sourcing_orders(id),
  quantity_needed INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ordered', -- ordered, shipped, delivered
  eta TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  supplier_partner_id UUID REFERENCES partner_profiles(partner_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: kitting_steps (assembly checklist per unit)
CREATE TABLE IF NOT EXISTS kitting_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitting_job_id UUID REFERENCES kitting_jobs(id) ON DELETE CASCADE,
  unit_number INTEGER NOT NULL, -- Which hamper unit (1 to total_units)
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES partner_profiles(partner_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: kitting_qc_photos (quality control per unit)
CREATE TABLE IF NOT EXISTS kitting_qc_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kitting_job_id UUID REFERENCES kitting_jobs(id) ON DELETE CASCADE,
  unit_number INTEGER NOT NULL, -- Which hamper unit
  photo_url TEXT NOT NULL, -- Cloudinary URL
  photo_type TEXT DEFAULT 'qc', -- qc, proof, packaging
  uploaded_by UUID REFERENCES partner_profiles(partner_id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kitting_jobs_partner ON kitting_jobs(partner_id);
CREATE INDEX IF NOT EXISTS idx_kitting_jobs_order ON kitting_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_kitting_jobs_status ON kitting_jobs(status);
CREATE INDEX IF NOT EXISTS idx_kitting_components_job ON kitting_components(kitting_job_id);
CREATE INDEX IF NOT EXISTS idx_kitting_components_status ON kitting_components(status);
CREATE INDEX IF NOT EXISTS idx_kitting_steps_job ON kitting_steps(kitting_job_id);
CREATE INDEX IF NOT EXISTS idx_kitting_steps_unit ON kitting_steps(unit_number);
CREATE INDEX IF NOT EXISTS idx_kitting_qc_photos_job ON kitting_qc_photos(kitting_job_id);

-- RLS Policies for kitting_jobs
ALTER TABLE kitting_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own kitting jobs"
  ON kitting_jobs FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can insert their own kitting jobs"
  ON kitting_jobs FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can update their own kitting jobs"
  ON kitting_jobs FOR UPDATE
  USING (partner_id = auth.uid());

-- Admins can view all kitting jobs
CREATE POLICY "Admins can view all kitting jobs"
  ON kitting_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for kitting_components
ALTER TABLE kitting_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view kitting components for their jobs"
  ON kitting_components FOR SELECT
  USING (
    kitting_job_id IN (
      SELECT id FROM kitting_jobs WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update kitting components for their jobs"
  ON kitting_components FOR UPDATE
  USING (
    kitting_job_id IN (
      SELECT id FROM kitting_jobs WHERE partner_id = auth.uid()
    )
  );

-- Component suppliers can view their delivery tasks
CREATE POLICY "Suppliers can view their component deliveries"
  ON kitting_components FOR SELECT
  USING (supplier_partner_id = auth.uid());

CREATE POLICY "Suppliers can update their component deliveries"
  ON kitting_components FOR UPDATE
  USING (supplier_partner_id = auth.uid());

-- RLS Policies for kitting_steps
ALTER TABLE kitting_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage steps for their jobs"
  ON kitting_steps FOR ALL
  USING (
    kitting_job_id IN (
      SELECT id FROM kitting_jobs WHERE partner_id = auth.uid()
    )
  );

-- RLS Policies for kitting_qc_photos
ALTER TABLE kitting_qc_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage QC photos for their jobs"
  ON kitting_qc_photos FOR ALL
  USING (
    kitting_job_id IN (
      SELECT id FROM kitting_jobs WHERE partner_id = auth.uid()
    )
  );

-- Function to auto-update kitting job status
CREATE OR REPLACE FUNCTION update_kitting_job_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all components are delivered
  IF (SELECT COUNT(*) FROM kitting_components 
      WHERE kitting_job_id = NEW.kitting_job_id 
      AND status != 'delivered') = 0 THEN
    
    UPDATE kitting_jobs 
    SET status = 'ready_to_kit',
        components_received_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.kitting_job_id 
    AND status = 'awaiting_components';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job status when component is delivered
DROP TRIGGER IF EXISTS trigger_update_kitting_status ON kitting_components;
CREATE TRIGGER trigger_update_kitting_status
  AFTER UPDATE OF status ON kitting_components
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered')
  EXECUTE FUNCTION update_kitting_job_status();

COMMENT ON TABLE kitting_jobs IS 'Tracks hamper assembly jobs from component arrival to pickup';
COMMENT ON TABLE kitting_components IS 'Tracks delivery status of each component type for a kitting job';
COMMENT ON TABLE kitting_steps IS 'Assembly checklist steps per hamper unit';
COMMENT ON TABLE kitting_qc_photos IS 'Quality control photos uploaded during assembly';

