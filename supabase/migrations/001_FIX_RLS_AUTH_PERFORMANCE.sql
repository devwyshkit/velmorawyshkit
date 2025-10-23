-- Fix auth.uid() performance in all RLS policies
-- Replace direct auth.uid() calls with (select auth.uid())
-- This improves performance by evaluating auth.uid() once per query instead of per row

-- profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles  
  FOR UPDATE USING (id = (select auth.uid()));

-- cart_items table
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own cart" ON cart_items;
CREATE POLICY "Users can insert own cart" ON cart_items
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own cart" ON cart_items;
CREATE POLICY "Users can delete own cart" ON cart_items
  FOR DELETE USING (user_id = (select auth.uid()));

-- wishlist_items table
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist_items;
CREATE POLICY "Users can view own wishlist" ON wishlist_items
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own wishlist" ON wishlist_items;
CREATE POLICY "Users can insert own wishlist" ON wishlist_items
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlist_items;
CREATE POLICY "Users can delete own wishlist" ON wishlist_items
  FOR DELETE USING (user_id = (select auth.uid()));

-- cart table
DROP POLICY IF EXISTS "Users can view own cart" ON cart;
CREATE POLICY "Users can view own cart" ON cart
  FOR SELECT USING (user_id = (select auth.uid()));

-- wishlist table
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (user_id = (select auth.uid()));

-- orders table
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- partner_profiles table
DROP POLICY IF EXISTS "Partners can view own profile" ON partner_profiles;
CREATE POLICY "Partners can view own profile" ON partner_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can update own profile" ON partner_profiles;
CREATE POLICY "Partners can update own profile" ON partner_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can insert own profile" ON partner_profiles;
CREATE POLICY "Partners can insert own profile" ON partner_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON partner_profiles;
CREATE POLICY "Admins can view all profiles" ON partner_profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role = 'admin'
  ));

-- partner_products table
DROP POLICY IF EXISTS "Partners can view own products" ON partner_products;
CREATE POLICY "Partners can view own products" ON partner_products
  FOR SELECT USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can insert own products" ON partner_products;
CREATE POLICY "Partners can insert own products" ON partner_products
  FOR INSERT WITH CHECK (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can update own products" ON partner_products;
CREATE POLICY "Partners can update own products" ON partner_products
  FOR UPDATE USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can delete own products" ON partner_products;
CREATE POLICY "Partners can delete own products" ON partner_products
  FOR DELETE USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all products" ON partner_products;
CREATE POLICY "Admins can view all products" ON partner_products
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role = 'admin'
  ));

-- reviews table
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (user_id = (select auth.uid()));

-- review_responses table
DROP POLICY IF EXISTS "Partners can view own responses" ON review_responses;
CREATE POLICY "Partners can view own responses" ON review_responses
  FOR SELECT USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can insert own responses" ON review_responses;
CREATE POLICY "Partners can insert own responses" ON review_responses
  FOR INSERT WITH CHECK (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can update own responses" ON review_responses;
CREATE POLICY "Partners can update own responses" ON review_responses
  FOR UPDATE USING (partner_id = (select auth.uid()));

-- review_flags table
DROP POLICY IF EXISTS "Users can flag reviews" ON review_flags;
CREATE POLICY "Users can flag reviews" ON review_flags
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- disputes table
DROP POLICY IF EXISTS "Users can view own disputes" ON disputes;
CREATE POLICY "Users can view own disputes" ON disputes
  FOR SELECT USING (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert disputes" ON disputes;
CREATE POLICY "Users can insert disputes" ON disputes
  FOR INSERT WITH CHECK (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own disputes" ON disputes;
CREATE POLICY "Users can update own disputes" ON disputes
  FOR UPDATE USING (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()));

-- dispute_messages table
DROP POLICY IF EXISTS "Users can view dispute messages" ON dispute_messages;
CREATE POLICY "Users can view dispute messages" ON dispute_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM disputes 
    WHERE id = dispute_id 
    AND (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Users can insert dispute messages" ON dispute_messages;
CREATE POLICY "Users can insert dispute messages" ON dispute_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM disputes 
    WHERE id = dispute_id 
    AND (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Users can update dispute messages" ON dispute_messages;
CREATE POLICY "Users can update dispute messages" ON dispute_messages
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM disputes 
    WHERE id = dispute_id 
    AND (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()))
  ));

-- returns table
DROP POLICY IF EXISTS "Users can view own returns" ON returns;
CREATE POLICY "Users can view own returns" ON returns
  FOR SELECT USING (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert returns" ON returns;
CREATE POLICY "Users can insert returns" ON returns
  FOR INSERT WITH CHECK (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own returns" ON returns;
CREATE POLICY "Users can update own returns" ON returns
  FOR UPDATE USING (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own returns" ON returns;
CREATE POLICY "Users can delete own returns" ON returns
  FOR DELETE USING (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()));

-- return_events table
DROP POLICY IF EXISTS "Users can view return events" ON return_events;
CREATE POLICY "Users can view return events" ON return_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM returns 
    WHERE id = return_id 
    AND (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Users can insert return events" ON return_events;
CREATE POLICY "Users can insert return events" ON return_events
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM returns 
    WHERE id = return_id 
    AND (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()))
  ));

-- campaigns table
DROP POLICY IF EXISTS "Partners can view own campaigns" ON campaigns;
CREATE POLICY "Partners can view own campaigns" ON campaigns
  FOR SELECT USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can insert own campaigns" ON campaigns;
CREATE POLICY "Partners can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can update own campaigns" ON campaigns;
CREATE POLICY "Partners can update own campaigns" ON campaigns
  FOR UPDATE USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can delete own campaigns" ON campaigns;
CREATE POLICY "Partners can delete own campaigns" ON campaigns
  FOR DELETE USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all campaigns" ON campaigns;
CREATE POLICY "Admins can view all campaigns" ON campaigns
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role = 'admin'
  ));

-- campaign_analytics table
DROP POLICY IF EXISTS "Partners can view own analytics" ON campaign_analytics;
CREATE POLICY "Partners can view own analytics" ON campaign_analytics
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM campaigns 
    WHERE id = campaign_id 
    AND partner_id = (select auth.uid())
  ));

-- partner_badges table
DROP POLICY IF EXISTS "Partners can view own badges" ON partner_badges;
CREATE POLICY "Partners can view own badges" ON partner_badges
  FOR SELECT USING (partner_id = (select auth.uid()));

-- referral_codes table
DROP POLICY IF EXISTS "Partners can view own referral codes" ON referral_codes;
CREATE POLICY "Partners can view own referral codes" ON referral_codes
  FOR SELECT USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can insert own referral codes" ON referral_codes;
CREATE POLICY "Partners can insert own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (partner_id = (select auth.uid()));

-- partner_referrals table
DROP POLICY IF EXISTS "Partners can view own referrals" ON partner_referrals;
CREATE POLICY "Partners can view own referrals" ON partner_referrals
  FOR SELECT USING (partner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Partners can insert own referrals" ON partner_referrals;
CREATE POLICY "Partners can insert own referrals" ON partner_referrals
  FOR INSERT WITH CHECK (partner_id = (select auth.uid()));

-- support_tickets table
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own tickets" ON support_tickets;
CREATE POLICY "Users can insert own tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- ticket_messages table
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
CREATE POLICY "Users can view ticket messages" ON ticket_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_id 
    AND user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert ticket messages" ON ticket_messages;
CREATE POLICY "Users can insert ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM support_tickets 
    WHERE id = ticket_id 
    AND user_id = (select auth.uid())
  ));

-- sourcing_usage table
DROP POLICY IF EXISTS "Partners can view own sourcing" ON sourcing_usage;
CREATE POLICY "Partners can view own sourcing" ON sourcing_usage
  FOR SELECT USING (partner_id = (select auth.uid()));

-- sponsored_analytics table
DROP POLICY IF EXISTS "Partners can view own sponsored analytics" ON sponsored_analytics;
CREATE POLICY "Partners can view own sponsored analytics" ON sponsored_analytics
  FOR SELECT USING (partner_id = (select auth.uid()));
