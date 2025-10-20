-- Migration: Add Help Center Tables
-- Feature: PROMPT 12 - Help Center/Support
-- Description: Searchable FAQ and support tickets

-- Help Articles Table
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  category VARCHAR(50) NOT NULL, -- getting_started, products, orders, payments, etc.
  tags TEXT[],
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- TKT-12345
  partner_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Ticket Messages Table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- partner, agent
  sender_name VARCHAR(255),
  message TEXT NOT NULL,
  attachments TEXT[], -- Cloudinary URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_views ON help_articles(views DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_partner ON support_tickets(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at DESC);

-- Full-text search index for articles
CREATE INDEX IF NOT EXISTS idx_help_articles_search ON help_articles USING gin(to_tsvector('english', title || ' ' || content));

-- Comments
COMMENT ON TABLE help_articles IS 'Self-service help articles and FAQs';
COMMENT ON TABLE support_tickets IS 'Partner support tickets';
COMMENT ON TABLE ticket_messages IS 'Support ticket conversation thread';

