-- Add indexes for unindexed foreign keys
-- This improves JOIN performance and lookup speed

-- admin_actions table
CREATE INDEX IF NOT EXISTS idx_admin_actions_performed_by ON admin_actions(performed_by);

-- cart table
CREATE INDEX IF NOT EXISTS idx_cart_item_id ON cart(item_id);

-- dispute_messages table
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender_id ON dispute_messages(sender_id);

-- kam_activities table
CREATE INDEX IF NOT EXISTS idx_kam_activities_created_by ON kam_activities(created_by);

-- kam_partner_assignments table
CREATE INDEX IF NOT EXISTS idx_kam_partner_assignments_assigned_by ON kam_partner_assignments(assigned_by);

-- partner_approvals table
CREATE INDEX IF NOT EXISTS idx_partner_approvals_admin_id ON partner_approvals(admin_id);

-- partner_profiles table
CREATE INDEX IF NOT EXISTS idx_partner_profiles_approved_by ON partner_profiles(approved_by);

-- payout_transactions table
CREATE INDEX IF NOT EXISTS idx_payout_transactions_payout_id ON payout_transactions(payout_id);

-- payouts table
CREATE INDEX IF NOT EXISTS idx_payouts_processed_by ON payouts(processed_by);

-- return_events table
CREATE INDEX IF NOT EXISTS idx_return_events_created_by ON return_events(created_by);

-- review_flags table
CREATE INDEX IF NOT EXISTS idx_review_flags_partner_id ON review_flags(partner_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_review_id ON review_flags(review_id);

-- review_responses table
CREATE INDEX IF NOT EXISTS idx_review_responses_partner_id ON review_responses(partner_id);

-- ticket_messages table
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);

-- wishlist table
CREATE INDEX IF NOT EXISTS idx_wishlist_item_id ON wishlist(item_id);
