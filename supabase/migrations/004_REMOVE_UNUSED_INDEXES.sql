-- Remove unused indexes to improve write performance
-- These indexes have never been used in queries and waste storage

-- Full-text search indexes (not implemented yet)
DROP INDEX IF EXISTS idx_occasions_slug;
DROP INDEX IF EXISTS idx_partner_products_search;
DROP INDEX IF EXISTS idx_partner_products_fts;
DROP INDEX IF EXISTS idx_reviews_fts;
DROP INDEX IF EXISTS idx_support_tickets_fts;

-- Sponsored/sourcing feature indexes (features not actively used)
DROP INDEX IF EXISTS idx_partner_products_sponsored;
DROP INDEX IF EXISTS idx_partner_products_bulk_pricing;
DROP INDEX IF EXISTS idx_sourcing_usage_partner_id;
DROP INDEX IF EXISTS idx_sponsored_analytics_partner_id;
DROP INDEX IF EXISTS idx_sponsored_analytics_campaign_id;
DROP INDEX IF EXISTS idx_sponsored_analytics_created_at;
DROP INDEX IF EXISTS idx_sourcing_usage_created_at;
DROP INDEX IF EXISTS idx_sourcing_usage_partner_created_at;

-- Campaign analytics indexes (not actively queried)
DROP INDEX IF EXISTS idx_campaign_analytics_campaign_id;
DROP INDEX IF EXISTS idx_campaign_analytics_created_at;
DROP INDEX IF EXISTS idx_campaign_analytics_partner_id;

-- Review/rating indexes (not actively used)
DROP INDEX IF EXISTS idx_reviews_rating;
DROP INDEX IF EXISTS idx_reviews_item_id;
DROP INDEX IF EXISTS idx_reviews_partner_id;
DROP INDEX IF EXISTS idx_review_responses_review_id;
DROP INDEX IF EXISTS idx_review_flags_review_id;
DROP INDEX IF EXISTS idx_review_flags_user_id;

-- Admin audit indexes (not actively queried)
DROP INDEX IF EXISTS idx_admin_actions_action_type;
DROP INDEX IF EXISTS idx_admin_actions_created_at;
DROP INDEX IF EXISTS idx_admin_actions_target_type;
DROP INDEX IF EXISTS idx_admin_actions_target_id;

-- KAM feature indexes (not actively used)
DROP INDEX IF EXISTS idx_kam_activities_partner_id;
DROP INDEX IF EXISTS idx_kam_activities_activity_type;
DROP INDEX IF EXISTS idx_kam_activities_created_at;
DROP INDEX IF EXISTS idx_kam_partner_assignments_partner_id;
DROP INDEX IF EXISTS idx_kam_partner_assignments_kam_id;

-- Partner approval indexes (not actively queried)
DROP INDEX IF EXISTS idx_partner_approvals_status;
DROP INDEX IF EXISTS idx_partner_approvals_created_at;
DROP INDEX IF EXISTS idx_partner_approvals_partner_id;

-- Payout indexes (not actively queried)
DROP INDEX IF EXISTS idx_payouts_status;
DROP INDEX IF EXISTS idx_payouts_created_at;
DROP INDEX IF EXISTS idx_payout_transactions_transaction_id;
DROP INDEX IF EXISTS idx_payout_transactions_created_at;

-- Return event indexes (not actively queried)
DROP INDEX IF EXISTS idx_return_events_return_id;
DROP INDEX IF EXISTS idx_return_events_event_type;
DROP INDEX IF EXISTS idx_return_events_created_at;

-- Support ticket indexes (not actively queried)
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_priority;
DROP INDEX IF EXISTS idx_support_tickets_created_at;
DROP INDEX IF EXISTS idx_ticket_messages_ticket_id;
DROP INDEX IF EXISTS idx_ticket_messages_created_at;

-- Dispute indexes (not actively queried)
DROP INDEX IF EXISTS idx_disputes_status;
DROP INDEX IF EXISTS idx_disputes_created_at;
DROP INDEX IF EXISTS idx_dispute_messages_dispute_id;
DROP INDEX IF EXISTS idx_dispute_messages_created_at;

-- Partner badge indexes (not actively queried)
DROP INDEX IF EXISTS idx_partner_badges_partner_id;
DROP INDEX IF EXISTS idx_partner_badges_badge_type;
DROP INDEX IF EXISTS idx_partner_badges_created_at;

-- Referral indexes (not actively queried)
DROP INDEX IF EXISTS idx_referral_codes_partner_id;
DROP INDEX IF EXISTS idx_referral_codes_code;
DROP INDEX IF EXISTS idx_referral_codes_created_at;
DROP INDEX IF EXISTS idx_partner_referrals_partner_id;
DROP INDEX IF EXISTS idx_partner_referrals_referred_partner_id;
DROP INDEX IF EXISTS idx_partner_referrals_created_at;

-- Order status indexes (not actively queried)
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_partner_id;

-- Cart item indexes (not actively queried)
DROP INDEX IF EXISTS idx_cart_items_user_id;
DROP INDEX IF EXISTS idx_cart_items_item_id;
DROP INDEX IF EXISTS idx_cart_items_created_at;

-- Wishlist item indexes (not actively queried)
DROP INDEX IF EXISTS idx_wishlist_items_user_id;
DROP INDEX IF EXISTS idx_wishlist_items_item_id;
DROP INDEX IF EXISTS idx_wishlist_items_created_at;

-- Profile indexes (not actively queried)
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_created_at;
DROP INDEX IF EXISTS idx_profiles_updated_at;

-- Partner profile indexes (not actively queried)
DROP INDEX IF EXISTS idx_partner_profiles_status;
DROP INDEX IF EXISTS idx_partner_profiles_created_at;
DROP INDEX IF EXISTS idx_partner_profiles_updated_at;

-- Product indexes (not actively queried)
DROP INDEX IF EXISTS idx_partner_products_status;
DROP INDEX IF EXISTS idx_partner_products_created_at;
DROP INDEX IF EXISTS idx_partner_products_updated_at;
DROP INDEX IF EXISTS idx_partner_products_category;
DROP INDEX IF EXISTS idx_partner_products_price;

-- Campaign indexes (not actively queried)
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_created_at;
DROP INDEX IF EXISTS idx_campaigns_start_date;
DROP INDEX IF EXISTS idx_campaigns_end_date;
