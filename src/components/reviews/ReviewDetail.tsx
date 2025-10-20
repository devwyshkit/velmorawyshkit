/**
 * Review Detail Sheet
 * Feature 4: PROMPT 9
 * Allows partners to respond to reviews
 */

import { useState } from "react";
import { Star, Flag, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { Review, ReviewResponse } from "@/types/reviews";
import { formatDistanceToNow } from "date-fns";

interface ReviewDetailProps {
  review: Review;
  onClose: () => void;
  onSuccess: () => void;
}

const RESPONSE_TEMPLATES = [
  {
    name: "Thank you",
    tone: "friendly",
    template: "Thank you for your kind words! We're thrilled you loved [product]. Hope to serve you again soon!"
  },
  {
    name: "Apologize",
    tone: "apologetic",
    template: "We're sorry to hear about your experience. Please contact us at support@wyshkit.com so we can make this right."
  },
  {
    name: "Improve",
    tone: "professional",
    template: "Thank you for the feedback! We're always working to improve our products and service."
  },
];

const MAX_CHARS = 500;

export const ReviewDetail = ({ review, onClose, onSuccess }: ReviewDetailProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);

  const existingResponse = (review as any).review_responses?.[0];
  const hasResponse = !!existingResponse;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleTemplateClick = (template: string) => {
    setResponse(template);
  };

  const handlePostResponse = async () => {
    if (!user || !response.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('review_responses')
        .insert({
          review_id: review.id,
          partner_id: user.id,
          response: response.trim(),
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Response posted",
        description: "Your response is now visible to customers",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Failed to post response",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditResponse = async () => {
    if (!user || !response.trim() || !existingResponse) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('review_responses')
        .update({
          response: response.trim(),
          edited_at: new Date().toISOString(),
        })
        .eq('id', existingResponse.id);

      if (error) throw error;

      toast({
        title: "Response updated",
        description: "Your changes have been saved",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Failed to update response",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFlagReview = async (reason: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('review_flags')
        .insert({
          review_id: review.id,
          partner_id: user.id,
          reason,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Review flagged",
        description: "Our team will review this within 24 hours",
      });

      setShowFlagDialog(false);
    } catch (error: any) {
      toast({
        title: "Failed to flag review",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Review Details</SheetTitle>
          <SheetDescription>
            View and respond to customer feedback
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Customer & Product Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Customer</Label>
              <p className="font-medium">{review.customer_name || 'Anonymous Customer'}</p>
            </div>
            {review.product_name && (
              <div>
                <Label className="text-muted-foreground">Product</Label>
                <p className="font-medium">{review.product_name}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Order</Label>
              <p className="font-mono text-sm">{review.order_id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <p className="text-sm">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Rating & Review */}
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Rating</Label>
              <div className="mt-1">{renderStars(review.rating)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Review</Label>
              <p className="mt-1 text-sm leading-relaxed">{review.comment}</p>
            </div>
            {review.helpful_count > 0 && (
              <p className="text-xs text-muted-foreground">
                {review.helpful_count} customer{review.helpful_count !== 1 ? 's' : ''} found this helpful
              </p>
            )}
          </div>

          {/* Existing Response (if any) */}
          {hasResponse && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Your Response</Label>
                {existingResponse.edited_at && (
                  <Badge variant="secondary" className="text-xs">
                    Edited {formatDistanceToNow(new Date(existingResponse.edited_at), { addSuffix: true })}
                  </Badge>
                )}
              </div>
              <p className="text-sm">{existingResponse.response}</p>
              <p className="text-xs text-muted-foreground">
                Posted {formatDistanceToNow(new Date(existingResponse.created_at), { addSuffix: true })}
              </p>
            </div>
          )}

          {/* Response Form */}
          {(!hasResponse || response) && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{hasResponse ? 'Edit Response' : 'Write Response'}</Label>
                  <span className={`text-xs ${
                    response.length > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {response.length}/{MAX_CHARS}
                  </span>
                </div>
                <Textarea
                  value={response}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setResponse(e.target.value);
                    }
                  }}
                  placeholder={hasResponse 
                    ? "Edit your response..." 
                    : "Write a thoughtful response to this review..."}
                  rows={6}
                  className="resize-none"
                />
              </div>

              {/* Template Buttons */}
              {!hasResponse && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Templates:</Label>
                  <div className="flex flex-wrap gap-2">
                    {RESPONSE_TEMPLATES.map(template => (
                      <Button
                        key={template.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTemplateClick(template.template)}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Post/Edit Button */}
              <Button
                onClick={hasResponse ? handleEditResponse : handlePostResponse}
                disabled={!response.trim() || response.length > MAX_CHARS || loading}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Saving...' : (hasResponse ? 'Update Response' : 'Post Response')}
              </Button>
            </div>
          )}

          {/* Edit Button (if already responded and not editing) */}
          {hasResponse && !response && (
            <Button
              variant="outline"
              onClick={() => setResponse(existingResponse.response)}
              className="w-full"
            >
              Edit Response
            </Button>
          )}

          {/* Flag Button */}
          <Button
            variant="outline"
            onClick={() => setShowFlagDialog(true)}
            className="w-full gap-2 text-destructive"
          >
            <Flag className="h-4 w-4" />
            Flag as Inappropriate
          </Button>

          {/* Flag Dialog (simple version - can be expanded) */}
          {showFlagDialog && (
            <div className="p-4 border rounded-lg space-y-3">
              <Label>Why are you flagging this review?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleFlagReview('spam')}>
                  Spam
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleFlagReview('offensive')}>
                  Offensive
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleFlagReview('fake')}>
                  Fake
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleFlagReview('off_topic')}>
                  Off-topic
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowFlagDialog(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

