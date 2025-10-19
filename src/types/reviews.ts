/**
 * Reviews & Ratings Types
 * Customer feedback management (Zomato pattern: 20% trust increase with responses)
 */

export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewStatus = 'pending' | 'responded' | 'flagged';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type FlagReason = 'spam' | 'offensive' | 'fake' | 'off_topic';
export type FlagStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  partner_id: string;
  customer_id: string;
  order_id: string;
  product_id?: string;
  rating: ReviewRating;
  comment: string;
  photos?: string[];
  helpful_count: number;
  created_at: string;
  customer_name?: string; // Anonymized (e.g., "Priya M.")
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  partner_id: string;
  response: string;
  created_at: string;
  edited_at?: string;
}

export interface ReviewFlag {
  id: string;
  review_id: string;
  partner_id: string;
  reason: FlagReason;
  status: FlagStatus;
  created_at: string;
}

export interface ReviewWithResponse extends Review {
  review_responses?: ReviewResponse[];
}

export interface ReviewStats {
  overall_rating: number;
  total_reviews: number;
  response_rate: number; // Percentage
  avg_response_time_hours: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

