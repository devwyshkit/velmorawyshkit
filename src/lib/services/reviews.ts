// DISABLED AUTHENTICATION - All reviews functions now return mock data

export interface ReviewPayload {
  reviewable_type: 'store' | 'product';
  reviewable_id: string;
  order_id: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export const submitReview = async (payload: ReviewPayload) => {
  // DISABLED AUTHENTICATION - Return mock success
  // In mock mode, just return success without API calls
  return {
    id: 'mock-review-' + Date.now(),
    ...payload,
    customer_id: 'mock-user-123',
    created_at: new Date().toISOString(),
  };
};

export const fetchReviews = async (reviewableType: 'store' | 'product', reviewableId: string) => {
  // DISABLED AUTHENTICATION - Return empty array, no API calls
  // In mock mode, reviews are not critical for demo flow
  return [];
};

export const updateReview = async (reviewId: string, payload: Partial<ReviewPayload>) => {
  // DISABLED AUTHENTICATION - Return mock success
  // In mock mode, just return success without API calls
  return {
    id: reviewId,
    ...payload,
    customer_id: 'mock-user-123',
    updated_at: new Date().toISOString(),
  };
};

