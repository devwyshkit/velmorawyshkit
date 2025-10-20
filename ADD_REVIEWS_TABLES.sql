-- Add reviews tables for Feature 4: Reviews & Ratings Management (PROMPT 9)

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  product_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  photos TEXT[], -- Array of Cloudinary URLs
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review responses table
CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- Review flags table
CREATE TABLE IF NOT EXISTS public.review_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'off_topic')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_partner ON public.reviews(partner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON public.review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_review ON public.review_flags(review_id);

-- RLS Policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;

-- Reviews: Partners can read their own reviews, customers can create
CREATE POLICY "Partners can read own reviews" ON public.reviews
  FOR SELECT USING (partner_id = auth.uid());

CREATE POLICY "Customers can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Review responses: Partners can manage their own responses
CREATE POLICY "Partners can manage own responses" ON public.review_responses
  FOR ALL USING (partner_id = auth.uid());

-- Review flags: Partners can flag reviews
CREATE POLICY "Partners can flag reviews" ON public.review_flags
  FOR INSERT WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can read own flags" ON public.review_flags
  FOR SELECT USING (partner_id = auth.uid());

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE '✅ Reviews tables created:';
  RAISE NOTICE '  - reviews (with RLS)';
  RAISE NOTICE '  - review_responses (with RLS)';
  RAISE NOTICE '  - review_flags (with RLS)';
  RAISE NOTICE '  - Indexes created for performance';
END $$;

