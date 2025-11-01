-- =====================================================
-- REVIEWS
-- =====================================================

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic: can review stores OR products
  reviewable_type VARCHAR(20) NOT NULL CHECK (reviewable_type IN ('store', 'product')),
  reviewable_id UUID NOT NULL,
  
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(customer_id, reviewable_type, reviewable_id, order_id)
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "Customers can create reviews for their orders"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = reviews.order_id
      AND orders.customer_id = auth.uid()
      AND orders.status = 'delivered'
    )
  );

CREATE POLICY "Customers can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = customer_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewable ON reviews(reviewable_type, reviewable_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE reviews IS 'Polymorphic reviews (stores and products). Created 2025-01-28.';

