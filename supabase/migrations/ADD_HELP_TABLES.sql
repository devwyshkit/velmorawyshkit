-- Help Center & Support Tables
-- Feature 12: PROMPT 12 - Help Center/Support
-- Create help_articles, support_tickets, and ticket_messages tables

-- Help articles (CMS content)
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  category VARCHAR(100) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT TRUE
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., TKT-12345
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID, -- Admin/support agent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket messages (real-time chat)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('partner', 'agent')),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[], -- Cloudinary URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Full-text search for articles
CREATE INDEX IF NOT EXISTS idx_help_articles_fts ON help_articles USING GIN(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published);

-- Ticket indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_partner ON support_tickets(partner_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at ASC);

-- Enable RLS
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published articles"
  ON help_articles FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Partners can view own tickets"
  ON support_tickets FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can view own ticket messages"
  ON ticket_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can send messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    ticket_id IN (
      SELECT id FROM support_tickets WHERE partner_id = auth.uid()
    )
  );

-- Seed help articles
INSERT INTO help_articles (title, content, category, tags) VALUES
('How to add products', '# Adding Products\n\nTo add a product to your catalog:\n\n1. Navigate to **Products** page\n2. Click **Add Product** button\n3. Fill in basic information\n4. Upload product images\n5. Set pricing and stock\n6. Configure bulk pricing tiers (optional)\n7. Enable customization add-ons (optional)\n8. Click **Create Product**\n\nYour product will be visible to customers immediately after creation.', 'Products & Pricing', ARRAY['products', 'getting started']),
('Setting up bulk pricing', '# Bulk Pricing\n\nBulk pricing allows you to offer discounts for larger quantity orders.\n\n## How to Set Up:\n\n1. Open product form\n2. Expand **Bulk Pricing Tiers** accordion\n3. Click **Add Tier**\n4. Enter minimum quantity and discounted price\n5. Add up to 5 tiers\n6. Save product\n\n## Example:\n- Tier 1: 10-49 units at ₹1,300 (13% off)\n- Tier 2: 50-99 units at ₹1,200 (20% off)\n- Tier 3: 100+ units at ₹1,100 (27% off)', 'Products & Pricing', ARRAY['bulk pricing', 'discounts']),
('Understanding commission structure', '# Commission Structure\n\nWyshkit uses a tiered commission model:\n\n- **Standard Partners:** 20% commission\n- **Premium Partners:** 15% commission (with Premium badge)\n- **Top Sellers:** 15% commission\n\n## How Commissions Work:\n\n1. Customer pays full price (₹2,499)\n2. Platform fee deducted (₹500 @ 20%)\n3. You receive payout (₹1,999)\n\n## Reducing Your Commission:\n\nEarn the **Premium Partner** badge by:\n- Completing 50+ orders\n- Maintaining 4.8+ rating\n- Generating ₹5L+ revenue\n\nThis automatically reduces your commission to 15%.', 'Payments & Payouts', ARRAY['commission', 'payments'])
ON CONFLICT DO NOTHING;

COMMENT ON TABLE badge_definitions IS 'Static badge configuration';
COMMENT ON TABLE partner_badges IS 'Partner achievement badges';
COMMENT ON TABLE help_articles IS 'Searchable help articles with markdown content';
COMMENT ON TABLE support_tickets IS 'Partner support tickets';
COMMENT ON TABLE ticket_messages IS 'Real-time support chat messages';
