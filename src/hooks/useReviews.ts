/**
 * Reviews Hook
 * Fetches and manages partner reviews with real-time subscriptions
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/integrations/supabase-client';
import { Review, ReviewWithResponse, ReviewStats } from '@/types/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateOverallSentiment } from '@/lib/reviews/sentiment';

export const useReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithResponse[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch reviews (with mock data for development)
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Note: This will work once reviews tables are created
        const { data, error } = await supabase
          .from('reviews')
          .select('*, review_responses(*)')
          .eq('partner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Reviews fetch failed, using mock:', error);
          // Mock reviews for development
          const mockReviews: ReviewWithResponse[] = [
            {
              id: '1',
              partner_id: user.id,
              customer_id: 'cust-1',
              order_id: 'order-1',
              rating: 5,
              comment: 'Excellent quality products! Fast delivery and great packaging. Highly recommend!',
              helpful_count: 15,
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              customer_name: 'Priya M.',
              review_responses: []
            },
            {
              id: '2',
              partner_id: user.id,
              customer_id: 'cust-2',
              order_id: 'order-2',
              product_id: 'product-1',
              rating: 4,
              comment: 'Good products but delivery was a bit slow. Overall satisfied.',
              helpful_count: 8,
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              customer_name: 'Rahul S.',
              review_responses: []
            },
            {
              id: '3',
              partner_id: user.id,
              customer_id: 'cust-3',
              order_id: 'order-3',
              rating: 3,
              comment: 'Product was okay, but packaging could be better.',
              helpful_count: 3,
              created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              customer_name: 'Amit K.',
              review_responses: [{
                id: 'resp-1',
                review_id: '3',
                partner_id: user.id,
                response: 'Thank you for the feedback! We\'re working on improving our packaging.',
                created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
              }]
            }
          ];
          setReviews(mockReviews);

          // Calculate stats
          const sentiment = calculateOverallSentiment(mockReviews);
          const ratingDist = { 5: 1, 4: 1, 3: 1, 2: 0, 1: 0 };
          setStats({
            overall_rating: 4.0,
            total_reviews: 3,
            response_rate: 33, // 1/3 responded
            avg_response_time_hours: 24,
            rating_distribution: ratingDist,
            sentiment
          });
        } else {
          setReviews(data || []);
          // Calculate real stats
          if (data && data.length > 0) {
            const sentiment = calculateOverallSentiment(data);
            const totalRating = data.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = totalRating / data.length;
            const responded = data.filter(r => r.review_responses && r.review_responses.length > 0).length;
            const responseRate = (responded / data.length) * 100;

            const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            data.forEach(r => {
              ratingDist[r.rating]++;
            });

            setStats({
              overall_rating: avgRating,
              total_reviews: data.length,
              response_rate: responseRate,
              avg_response_time_hours: 4, // TODO: Calculate from data
              rating_distribution: ratingDist,
              sentiment
            });
          }
        }
      } catch (error) {
        console.error('Reviews fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  // Real-time subscription for new reviews
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('partner-reviews')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `partner_id=eq.${user.id}`
        },
        (payload) => {
          const newReview = payload.new as Review;
          setReviews(prev => [newReview as ReviewWithResponse, ...prev]);
          
          toast({
            title: "New Review Received",
            description: `${newReview.rating}★ from customer`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return { reviews, stats, loading, refetch: () => {} };
};

