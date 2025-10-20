/**
 * Reviews List Component
 * Feature 4: PROMPT 9
 * DataTable with filters and review detail sheet
 */

import { useState } from "react";
import { Star, MessageSquare, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewDetail } from "./ReviewDetail";
import type { Review, ReviewStats } from "@/types/reviews";
import { formatDistanceToNow } from "date-fns";

interface ReviewsListProps {
  reviews: Review[];
  stats: ReviewStats;
  onReviewUpdate: () => void;
}

export const ReviewsList = ({ reviews, stats, onReviewUpdate }: ReviewsListProps) => {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'no_response'>('all');

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'no_response') return !(review as any).review_responses?.length;
    return review.rating === parseInt(filter);
  });

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No reviews yet</h3>
          <p className="text-sm text-muted-foreground">
            Customer reviews will appear here once you receive orders
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
            <SelectItem value="no_response">Without Response</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="px-3 py-1.5">
          {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.rating_distribution[rating as 1 | 2 | 3 | 4 | 5];
            const percentage = stats.total_reviews > 0 
              ? (count / stats.total_reviews) * 100 
              : 0;
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>
                <span className="text-sm text-muted-foreground w-16 text-right">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.map(review => {
          const hasResponse = !!(review as any).review_responses?.length;
          
          return (
            <Card 
              key={review.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedReview(review)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{review.customer_name || 'Customer'}</p>
                        {renderStars(review.rating)}
                      </div>
                      {review.product_name && (
                        <p className="text-sm text-muted-foreground">
                          {review.product_name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                      {hasResponse ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          ✓ Responded
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Review Comment */}
                  <p className="text-sm line-clamp-2">{review.comment}</p>

                  {/* Helpful Count */}
                  {review.helpful_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{review.helpful_count} found this helpful</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Review Detail Sheet */}
      {selectedReview && (
        <ReviewDetail
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onSuccess={() => {
            setSelectedReview(null);
            onReviewUpdate();
          }}
        />
      )}
    </>
  );
};

