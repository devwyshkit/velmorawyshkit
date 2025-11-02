import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { submitReview } from "@/lib/services/reviews";

interface RatingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItems: Array<{
    id: string;
    name: string;
    image: string;
    quantity: number;
  }>;
}

interface RatingData {
  overallRating: number;
  qualityRating: number;
  deliveryRating: number;
  packagingRating: number;
  wouldRecommend: boolean;
  feedback: string;
  tags: string[];
}

export const RatingSheet = ({ isOpen, onClose, orderId, orderItems }: RatingSheetProps) => {
  const { toast } = useToast();
  const [ratingData, setRatingData] = useState<RatingData>({
    overallRating: 0,
    qualityRating: 0,
    deliveryRating: 0,
    packagingRating: 0,
    wouldRecommend: true,
    feedback: '',
    tags: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (category: keyof RatingData, rating: number) => {
    if (typeof ratingData[category] === 'number') {
      setRatingData(prev => ({
        ...prev,
        [category]: rating,
      }));
    }
  };

  const handleTagToggle = (tag: string) => {
    setRatingData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async () => {
    if (ratingData.overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit review for each item in the order
      for (const item of orderItems) {
        await submitReview({
          reviewable_type: 'product',
          reviewable_id: item.id,
          order_id: orderId,
          rating: ratingData.overallRating,
          title: ratingData.tags.join(', ') || undefined,
          comment: ratingData.feedback || undefined,
        });
      }
      
      toast({
        title: "Thank you for your feedback!",
        description: "Your rating helps us improve our service.",
      });
      
      onClose();
    } catch (error) {
      console.error('Review submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ 
    category, 
    label, 
    value 
  }: { 
    category: keyof RatingData; 
    label: string; 
    value: number; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(category, star)}
            className="p-1 transition-colors hover:scale-110"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value === 1 ? 'Poor' : value === 2 ? 'Fair' : value === 3 ? 'Good' : value === 4 ? 'Very Good' : 'Excellent'}
          </span>
        )}
      </div>
    </div>
  );

  const qualityTags = [
    'Excellent quality',
    'Good value for money',
    'Fast delivery',
    'Great packaging',
    'As described',
    'Would order again',
  ];

  const issueTags = [
    'Poor quality',
    'Late delivery',
    'Damaged packaging',
    'Not as described',
    'Wrong item',
    'Poor communication',
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-xl p-0 overflow-y-auto sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Drag Handle - Material Design 3 */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div className="px-4 pb-4 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Rate Your Experience</h2>
            <p className="text-sm text-muted-foreground">
              Help us improve by sharing your feedback
            </p>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Order Items</Label>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Rating */}
          <StarRating
            category="overallRating"
            label="Overall Experience *"
            value={ratingData.overallRating}
          />

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <StarRating
              category="qualityRating"
              label="Product Quality"
              value={ratingData.qualityRating}
            />
            
            <StarRating
              category="deliveryRating"
              label="Delivery Experience"
              value={ratingData.deliveryRating}
            />
            
            <StarRating
              category="packagingRating"
              label="Packaging"
              value={ratingData.packagingRating}
            />
          </div>

          {/* Would Recommend */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Would you recommend {partnerName}?</Label>
            <RadioGroup
              value={ratingData.wouldRecommend.toString()}
              onValueChange={(value) => setRatingData(prev => ({
                ...prev,
                wouldRecommend: value === 'true',
              }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="recommend-yes" />
                <Label htmlFor="recommend-yes" className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  Yes, I would recommend
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="recommend-no" />
                <Label htmlFor="recommend-no" className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  No, I would not recommend
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quality Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What did you like? (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {qualityTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    ratingData.tags.includes(tag)
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label={`${ratingData.tags.includes(tag) ? 'Remove' : 'Add'} tag: ${tag}`}
                  title={`${ratingData.tags.includes(tag) ? 'Remove' : 'Add'} tag: ${tag}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Any issues? (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {issueTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    ratingData.tags.includes(tag)
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label={`${ratingData.tags.includes(tag) ? 'Remove' : 'Add'} issue tag: ${tag}`}
                  title={`${ratingData.tags.includes(tag) ? 'Remove' : 'Add'} issue tag: ${tag}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us more about your experience..."
              value={ratingData.feedback}
              onChange={(e) => setRatingData(prev => ({
                ...prev,
                feedback: e.target.value,
              }))}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || ratingData.overallRating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
