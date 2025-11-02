import { supabase } from '@/lib/integrations/supabase-client';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...payload,
      customer_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchReviews = async (reviewableType: 'store' | 'product', reviewableId: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewable_type', reviewableType)
    .eq('reviewable_id', reviewableId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateReview = async (reviewId: string, payload: Partial<ReviewPayload>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .update(payload)
    .eq('id', reviewId)
    .eq('customer_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

