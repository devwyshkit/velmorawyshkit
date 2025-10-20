/**
 * Help Center Types
 * Feature 12: PROMPT 12
 */

export interface HelpArticle {
  id: string;
  title: string;
  content: string; // Markdown
  category: string;
  tags: string[];
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  partner_id: string;
  subject: string;
  message: string;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  created_at: string;
  resolved_at?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'partner' | 'agent';
  sender_name: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

export const HELP_CATEGORIES = [
  { id: 'getting-started', name: 'Getting Started', icon: 'Package' },
  { id: 'products', name: 'Products & Pricing', icon: 'DollarSign' },
  { id: 'orders', name: 'Orders & Fulfillment', icon: 'Truck' },
  { id: 'payments', name: 'Payments & Payouts', icon: 'CreditCard' },
  { id: 'customization', name: 'Customization & Branding', icon: 'Palette' },
  { id: 'account', name: 'Account & Settings', icon: 'Settings' },
];

