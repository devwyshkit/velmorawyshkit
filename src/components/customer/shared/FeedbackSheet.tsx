import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FeedbackSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export const FeedbackSheet = ({ isOpen, onClose, orderId }: FeedbackSheetProps) => {
  const { toast } = useToast();
  const [productRating, setProductRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Submit feedback to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Feedback submitted! ✅",
        description: "Thank you for helping us improve",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2">
        {/* Grabber */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        <div className="p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">How was your order?</h2>
            <p className="text-sm text-muted-foreground">#{orderId}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium block mb-2">🎁 Product Quality</Label>
            <p className="text-xs text-muted-foreground mb-2">Gifts Co</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={cn(
                    "h-8 w-8 cursor-pointer transition-colors",
                    star <= productRating ? "fill-primary text-primary" : "text-muted-foreground/30"
                  )}
                  onClick={() => setProductRating(star)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium block mb-2">🚗 Delivery Experience</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={cn(
                    "h-8 w-8 cursor-pointer transition-colors",
                    star <= deliveryRating ? "fill-primary text-primary" : "text-muted-foreground/30"
                  )}
                  onClick={() => setDeliveryRating(star)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="feedback" className="text-sm font-medium mb-2 block">
              💬 Tell us more (optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || productRating === 0 || deliveryRating === 0}
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

