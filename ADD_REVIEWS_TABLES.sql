-- Reviews & Ratings Tables
-- Feature 9: PROMPT 9 - Ratings & Reviews Management
-- Create reviews, review_responses, and review_flags tables

-- Main reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL, -- Reference to orders table
  product_id UUID, -- Optional: specific product review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  photos TEXT[], -- Array of Cloudinary URLs
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (char_length(response) <= 500), -- Max 500 chars
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(review_id) -- Only one response per review
);

-- Flagged reviews for moderation
CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'off_topic')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_partner ON reviews(partner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_status ON review_flags(status);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Partners can view reviews for their products"
  ON reviews FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can respond to their reviews"
  ON review_responses FOR INSERT
  WITH CHECK (
    review_id IN (
      SELECT id FROM reviews WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can view own responses"
  ON review_responses FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can update own responses"
  ON review_responses FOR UPDATE
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can flag reviews"
  ON review_flags FOR INSERT
  WITH CHECK (partner_id = auth.uid());

COMMENT ON TABLE reviews IS 'Customer reviews and ratings for partners/products';
COMMENT ON TABLE review_responses IS 'Partner responses to customer reviews';
COMMENT ON TABLE review_flags IS 'Flagged reviews for admin moderation';
