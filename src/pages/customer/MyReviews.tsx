import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Star, Edit, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { safeJsonParse } from "@/lib/utils/safe-json";

/**
 * MyReviews - Swiggy 2025 Pattern
 * 
 * View all your reviews:
 * - Edit reviews
 * - Delete reviews
 * - View order context
 */
interface Review {
  id: string;
  order_id: string;
  order_number?: string;
  item_name: string;
  item_image?: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export const MyReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
// Helper to load reviews synchronously (Swiggy 2025 pattern)
const loadReviewsSync = (userId?: string): Review[] => {
  try {
    const stored = localStorage.getItem('wyshkit_reviews');
    if (stored) {
      const allReviews = JSON.parse(stored);
      // Filter reviews for current user
      if (userId) {
        return allReviews.filter((r: Review) => 
          r.order_id && r.order_id.includes(userId)
        );
      }
      return [];
    } else {
      // Sample reviews for demo
      const sampleReviews: Review[] = [
        {
          id: 'rev_1',
          order_id: 'order_1',
          order_number: 'ORD-001',
          item_name: 'Custom Birthday Cake',
          item_image: 'https://via.placeholder.com/150',
          rating: 5,
          comment: 'Excellent quality! The cake was exactly as described and delivered on time.',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      return sampleReviews;
    }
  } catch (error) {
    logger.error('Failed to load reviews', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const MyReviews = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  // Swiggy 2025: Initialize reviews synchronously to prevent empty flash
  const [reviews, setReviews] = useState<Review[]>(() => loadReviewsSync(user?.id));
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  // Refresh reviews when user changes (Swiggy 2025 pattern)
  useEffect(() => {
    const userReviews = loadReviewsSync(user?.id);
    setReviews(userReviews);
  }, [user]);

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setIsEditSheetOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingReview) return;

    const updated = reviews.map(review =>
      review.id === editingReview.id
        ? {
            ...review,
            rating: editRating,
            comment: editComment,
            updated_at: new Date().toISOString(),
          }
        : review
    );

    setReviews(updated);
    saveReviews(updated);
    setIsEditSheetOpen(false);
    setEditingReview(null);
    toast({
      title: 'Review updated',
      description: 'Your review has been updated successfully.',
    });
  };

  const handleDelete = (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      const updated = reviews.filter(review => review.id !== reviewId);
      setReviews(updated);
      saveReviews(updated);
      toast({
        title: 'Review deleted',
        description: 'Your review has been deleted.',
      });
    }
  };

  const saveReviews = (reviewsToSave: Review[]) => {
    try {
      const allReviews = safeJsonParse(localStorage.getItem('wyshkit_reviews'), [] as Review[]);
      const otherReviews = allReviews.filter((r: Review) => 
        !reviewsToSave.some(ur => ur.id === r.id)
      );
      localStorage.setItem('wyshkit_reviews', JSON.stringify([...otherReviews, ...reviewsToSave]));
    } catch (error) {
      logger.error('Failed to save reviews', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Helmet>
        <title>My Reviews | Wyshkit</title>
        <meta name="description" content="View and manage your reviews" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="My Reviews" showBackButton />

        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-4 md:space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <Star className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold mb-2">No Reviews Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    You haven't reviewed any orders yet. Rate your orders to help other customers!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      {review.item_image && (
                        <img
                          src={review.item_image}
                          alt={review.item_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{review.item_name}</p>
                            {review.order_number && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Order {review.order_number}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(review.updated_at || review.created_at)}
                          {review.updated_at && ' (edited)'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(review)}
                        className="flex-1"
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(review.id)}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        <CustomerBottomNav />

        {/* Edit Review Sheet */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 overflow-y-auto snap-y snap-mandatory">
            <SheetHeader>
              <SheetTitle>Edit Review</SheetTitle>
            </SheetHeader>

            <div className="px-6 pb-6 space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          star <= editRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  placeholder="Share your experience..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button onClick={handleSaveEdit} className="w-full h-12">
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditSheetOpen(false)}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};


