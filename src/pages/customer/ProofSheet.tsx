import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";

interface ProofSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const ProofSheet = ({ isOpen, onClose, orderId }: ProofSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revisions, setRevisions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock proof data
  const proof = {
    orderId: orderId || 'ORD-123',
    itemName: 'Custom Gift Hamper',
    mockups: [
      `https://picsum.photos/seed/proof-${orderId || 'ORD-123'}-1/800/600`,
      `https://picsum.photos/seed/proof-${orderId || 'ORD-123'}-2/800/600`,
      `https://picsum.photos/seed/proof-${orderId || 'ORD-123'}-3/800/600`,
    ],
  };

  const revisionOptions = [
    { id: 'color', label: 'Adjust colors' },
    { id: 'text', label: 'Fix text/typography' },
    { id: 'layout', label: 'Change layout' },
    { id: 'images', label: 'Replace images' },
  ];

  const handleRevisionToggle = (revisionId: string) => {
    setRevisions(prev =>
      prev.includes(revisionId)
        ? prev.filter(id => id !== revisionId)
        : [...prev, revisionId]
    );
  };

  const handleApprove = async () => {
    setLoading(true);

    try {
      // Submit approval to backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Proof Approved! ✅",
        description: "Your item will now be produced",
      });

      onClose();
      navigate(`/customer/track?orderId=${proof.orderId}`);
    } catch (error) {
      toast({
        title: "Approval failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRevisions = async () => {
    if (revisions.length === 0 && !feedback) {
      toast({
        title: "No changes requested",
        description: "Please select revisions or add feedback",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Submit revisions to backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Revisions Submitted",
        description: "We'll send an updated proof soon",
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
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
        {/* Grabber */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Review Proof</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Item Info */}
          <div>
            <h3 className="font-semibold mb-1">{proof.itemName}</h3>
            <p className="text-sm text-muted-foreground">
              Order ID: {proof.orderId}
            </p>
          </div>

          {/* Mockup Carousel */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Design Mockups</Label>
            <Carousel className="w-full">
              <CarouselContent>
                {proof.mockups.map((mockup, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                      <img
                        src={mockup}
                        alt={`Mockup ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* Fallback icon */}
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                        <FileImage className="w-16 h-16" />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>

          {/* Revisions */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Request Changes (Optional)
            </Label>
            <div className="space-y-3">
              {revisionOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={revisions.includes(option.id)}
                    onCheckedChange={() => handleRevisionToggle(option.id)}
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-sm font-medium mb-2 block">
              Additional Feedback (Optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Provide specific details about changes you'd like..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>

          {/* Non-refundable Warning */}
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning rounded-lg">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-foreground">
              <strong>Important:</strong> Once you approve this proof, the item will be produced and 
              cannot be refunded or modified.
            </p>
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-border p-4 space-y-3">
          {revisions.length > 0 || feedback ? (
            <Button
              onClick={handleSubmitRevisions}
              variant="outline"
              className="w-full h-12"
              size="lg"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Revisions"}
            </Button>
          ) : null}
          <Button
            onClick={handleApprove}
            className="w-full h-12"
            size="lg"
            disabled={loading}
          >
            {loading ? "Approving..." : "Approve & Proceed"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

