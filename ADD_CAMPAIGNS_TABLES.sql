-- Add campaigns tables for Feature 5: Campaign Management (PROMPT 4)

-- Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('discount', 'free_addon', 'bundle')),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC,
  products TEXT[] NOT NULL, -- Array of product IDs
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  featured BOOLEAN DEFAULT false,
  banner_url TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'ended')),
  impressions INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue BIGINT DEFAULT 0, -- In paise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign analytics table
CREATE TABLE IF NOT EXISTS public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date) -- One row per campaign per day
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_partner ON public.campaigns(partner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON public.campaigns(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON public.campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign ON public.campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON public.campaign_analytics(date DESC);

-- RLS Policies
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Partners can manage their own campaigns
CREATE POLICY "Partners can manage own campaigns" ON public.campaigns
  FOR ALL USING (partner_id = auth.uid());

-- Partners can read their own analytics
CREATE POLICY "Partners can read own analytics" ON public.campaign_analytics
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE partner_id = auth.uid()
    )
  );

-- Create storage bucket for campaign banners (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-banners', 'campaign-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Partners can upload their own banners
CREATE POLICY IF NOT EXISTS "Partners can upload campaign banners" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'campaign-banners' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY IF NOT EXISTS "Anyone can view campaign banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'campaign-banners');

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ Campaigns tables created:';
  RAISE NOTICE '  - campaigns (with RLS)';
  RAISE NOTICE '  - campaign_analytics (with RLS)';
  RAISE NOTICE '  - campaign-banners storage bucket';
  RAISE NOTICE '  - Indexes for performance';
END $$;

