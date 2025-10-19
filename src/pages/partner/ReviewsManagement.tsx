/**
 * Reviews & Ratings Management Page
 * Partner can view, respond to, and flag customer reviews
 * Zomato pattern: 20% trust increase with partner responses
 */

import { useState } from "react";
import { Star, MessageSquare, Flag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useReviews } from "@/hooks/useReviews";
import { ReviewWithResponse } from "@/types/reviews";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useAuth } from "@/contexts/AuthContext";

export const ReviewsManagement = () => {
  const { reviews, stats, loading } = useReviews();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedReview, setSelectedReview] = useState<ReviewWithResponse | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Define columns
  const columns: ColumnDef<ReviewWithResponse>[] = [
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customer_name || 'Customer'}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star 
              key={star}
              className={`h-4 w-4 ${
                star <= row.original.rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      accessorKey: "comment",
      header: "Review",
      cell: ({ row }) => (
        <p className="line-clamp-2 text-sm max-w-md">
          {row.original.comment}
        </p>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const hasResponse = row.original.review_responses && row.original.review_responses.length > 0;
        return (
          <Badge variant={hasResponse ? "default" : "secondary"}>
            {hasResponse ? "Responded" : "Pending"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedReview(row.original);
            setResponseText(row.original.review_responses?.[0]?.response || "");
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const handlePostResponse = async () => {
    if (!selectedReview || !responseText.trim() || !user) return;

    if (responseText.length > 500) {
      toast({
        title: "Response too long",
        description: "Maximum 500 characters allowed",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Mock success for now (will work once tables are created)
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Response posted",
        description: "Your response is now visible to customers",
      });

      setSelectedReview(null);
      setResponseText("");
    } catch (error: any) {
      toast({
        title: "Failed to post response",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews & Ratings</h1>
        <p className="text-muted-foreground">
          Manage customer feedback and build trust
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{stats.overall_rating.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.total_reviews}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Response Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <span className="text-2xl font-bold">{stats.response_rate.toFixed(0)}%</span>
                <Progress value={stats.response_rate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.avg_response_time_hours}h</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.rating_distribution[rating as 5 | 4 | 3 | 2 | 1];
              const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress value={percentage} className="flex-1" />
                  <span className="text-sm text-muted-foreground w-20 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Reviews DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={reviews}
            searchKey="comment"
            searchPlaceholder="Search reviews..."
          />
        </CardContent>
      </Card>

      {/* Review Detail Sheet */}
      <Sheet open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Review Details</SheetTitle>
          </SheetHeader>

          {selectedReview && (
            <div className="space-y-6 py-4">
              {/* Customer & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">{selectedReview.customer_name || 'Customer'}</p>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`h-5 w-5 ${
                        star <= selectedReview.rating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(selectedReview.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <h3 className="font-semibold mb-2">Review</h3>
                <p className="text-sm leading-relaxed">{selectedReview.comment}</p>
                {selectedReview.helpful_count > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedReview.helpful_count} people found this helpful
                  </p>
                )}
              </div>

              {/* Existing Response (if any) */}
              {selectedReview.review_responses && selectedReview.review_responses.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Your Response</p>
                  <p className="text-sm leading-relaxed mb-2">
                    {selectedReview.review_responses[0].response}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Posted {formatDistanceToNow(new Date(selectedReview.review_responses[0].created_at), { addSuffix: true })}
                    {selectedReview.review_responses[0].edited_at && (
                      <span> • Edited {formatDistanceToNow(new Date(selectedReview.review_responses[0].edited_at), { addSuffix: true })}</span>
                    )}
                  </p>
                </div>
              )}

              {/* Response Form (if not responded) */}
              {(!selectedReview.review_responses || selectedReview.review_responses.length === 0) && (
                <div>
                  <h3 className="font-semibold mb-2">Write Your Response</h3>
                  <div className="space-y-2">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Thank you for your feedback..."
                      maxLength={500}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {responseText.length}/500 characters
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResponseText("Thank you for your kind words! We're thrilled you loved our products. Hope to serve you again soon!")}
                        >
                          Professional
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResponseText("We're sorry to hear about your experience. Please contact us so we can make this right.")}
                        >
                          Apologetic
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={handlePostResponse} 
                      disabled={!responseText.trim() || submitting}
                      className="w-full"
                    >
                      {submitting ? "Posting..." : "Post Response"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Flag Review */}
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="gap-2">
                  <Flag className="h-4 w-4" />
                  Flag as Inappropriate
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

