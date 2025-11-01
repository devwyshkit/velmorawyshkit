-- =====================================================
-- SCHEDULED JOBS
-- Background job queue for scheduled tasks
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job details
  type VARCHAR(50) NOT NULL,
  -- Types: generate_preview, send_feedback_request, auto_approve_preview,
  --        check_production_status, send_reminder, etc.
  
  -- Context
  related_type VARCHAR(50), -- 'order', 'order_item', 'user'
  related_id UUID,
  payload JSONB,
  
  -- Scheduling
  run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed'
  )),
  
  -- Results
  result JSONB,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_run_at ON scheduled_jobs(run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_type ON scheduled_jobs(type);

-- RLS
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Only system can access scheduled jobs
CREATE POLICY "System only"
  ON scheduled_jobs FOR ALL
  USING (false); -- Service role only

-- Add comment
COMMENT ON TABLE scheduled_jobs IS 'Background job queue for scheduled tasks. Service role only.';

