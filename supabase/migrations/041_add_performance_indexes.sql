-- Performance Indexes Migration
-- Adds indexes for common filter and sort operations (2025 pattern)
-- Optimizes queries for banners, occasions, store_items, promotional_offers, order_items

-- Banners indexes (for home page queries)
CREATE INDEX IF NOT EXISTS idx_banners_is_active_position 
  ON banners(is_active, position) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_banners_position 
  ON banners(position) 
  WHERE is_active = true;

-- Occasions indexes (for home page queries)
CREATE INDEX IF NOT EXISTS idx_occasions_is_active_position 
  ON occasions(is_active, position) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_occasions_position 
  ON occasions(position) 
  WHERE is_active = true;

-- Store items indexes (for catalog and pricing queries)
CREATE INDEX IF NOT EXISTS idx_store_items_store_id_status_active 
  ON store_items(store_id, status, is_active) 
  WHERE status = 'approved' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_store_items_store_id_active 
  ON store_items(store_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_store_items_price 
  ON store_items(price) 
  WHERE status = 'approved' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_store_items_status_active 
  ON store_items(status, is_active) 
  WHERE status = 'approved' AND is_active = true;

-- Promotional offers indexes (for offers queries)
CREATE INDEX IF NOT EXISTS idx_promotional_offers_status_active_end_date 
  ON promotional_offers(status, is_active, end_date) 
  WHERE status = 'active' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_promotional_offers_store_id_status 
  ON promotional_offers(store_id, status, is_active) 
  WHERE status = 'active' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_promotional_offers_end_date 
  ON promotional_offers(end_date) 
  WHERE status = 'active' AND is_active = true;

-- Order items indexes (for preview and order tracking)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
  ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_preview_status 
  ON order_items(preview_status) 
  WHERE preview_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id_preview_status 
  ON order_items(order_id, preview_status);

-- Orders indexes (additional for common filters)
CREATE INDEX IF NOT EXISTS idx_orders_store_id_status_created 
  ON orders(store_id, status, created_at DESC) 
  WHERE status IN ('placed', 'confirmed', 'preview_pending');

CREATE INDEX IF NOT EXISTS idx_orders_customer_id_status 
  ON orders(customer_id, status, created_at DESC);

-- Cart items indexes (for cart operations)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id 
  ON cart_items(user_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_store_id 
  ON cart_items(store_id);

-- Addresses indexes (for address management)
CREATE INDEX IF NOT EXISTS idx_addresses_user_id_default 
  ON addresses(user_id, is_default) 
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_addresses_user_id 
  ON addresses(user_id);

-- Comments
COMMENT ON INDEX idx_banners_is_active_position IS 'Optimizes banners query for home page (filtered by is_active, sorted by position)';
COMMENT ON INDEX idx_occasions_is_active_position IS 'Optimizes occasions query for home page (filtered by is_active, sorted by position)';
COMMENT ON INDEX idx_store_items_store_id_status_active IS 'Optimizes store items query for catalog (filtered by store_id, status, is_active)';
COMMENT ON INDEX idx_promotional_offers_status_active_end_date IS 'Optimizes promotional offers query (filtered by status, is_active, end_date)';
COMMENT ON INDEX idx_order_items_order_id_preview_status IS 'Optimizes order items query for preview tracking (filtered by order_id, preview_status)';
COMMENT ON INDEX idx_orders_store_id_status_created IS 'Optimizes orders query for partner dashboard (filtered by store_id, status, sorted by created_at)';

