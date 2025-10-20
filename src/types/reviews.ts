/**
 * Reviews & Ratings Types
 * Feature 4: PROMPT 9
 */

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export type ReviewFlagReason = 'spam' | 'offensive' | 'fake' | 'off_topic';

export type ReviewFlagStatus = 'pending' | 'approved' | 'rejected';

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
  customer_name?: string;
  product_name?: string;
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
  reason: ReviewFlagReason;
  status: ReviewFlagStatus;
  created_at: string;
}

export interface ReviewWithResponse extends Review {
  review_responses?: ReviewResponse[];
  has_response: boolean;
}

export interface ReviewStats {
  overall_rating: number;
  total_reviews: number;
  response_rate: number;
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
  top_keywords: Array<{
    word: string;
    count: number;
  }>;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  content: string;
  tone: 'professional' | 'friendly' | 'apologetic';
}

