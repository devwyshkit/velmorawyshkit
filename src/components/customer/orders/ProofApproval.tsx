import { useState, useEffect } from "react";
import { CheckCircle2, MessageCircle, ArrowLeft, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";

interface ProofApprovalProps {
  proofId: string;
  orderId: string;
  onApproved?: () => void;
}

interface ProofData {
  id: string;
  mockup_urls: string[];
  status: string;
  revision_count: number;
  max_revisions: number;
  branding_requirements?: string[];
  partner_name?: string;
}

/**
 * ProofApproval Component
 * Customer reviews and approves/requests revisions for proof mockups
 */
export const ProofApproval = ({
  proofId,
  orderId,
  onApproved,
}: ProofApprovalProps) => {
  const { toast } = useToast();
  const [proof, setProof] = useState<ProofData | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadProof();
  }, [proofId]);

  const loadProof = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proof_submissions')
        .select(`
          *,
          partner_profiles(business_name)
        `)
        .eq('id', proofId)
        .single();

      if (error) {
        console.error('Load proof error:', error);
        return;
      }

      setProof({
        id: data.id,
        mockup_urls: data.mockup_urls || [],
        status: data.status,
        revision_count: data.revision_count,
        max_revisions: data.max_revisions,
        branding_requirements: data.branding_requirements || [],
        partner_name: data.partner_profiles?.business_name,
      });
    } catch (error) {
      console.error('Load proof error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await supabase
        .from('proof_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', proofId);

      toast({
        title: "Proof approved! ✓",
        description: "Partner will begin production",
      });

      onApproved?.();
    } catch (error) {
      toast({
        title: "Approval failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback required",
        description: "Please describe what changes you'd like",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await supabase
        .from('proof_submissions')
        .update({
          status: 'revision_requested',
          customer_feedback: feedback,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proofId);

      toast({
        title: "Revision requested",
        description: "Partner will update the mockups",
      });

      setShowFeedbackForm(false);
      setFeedback("");
      loadProof();
    } catch (error) {
      toast({
        title: "Request failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !proof) {
    return <div className="p-8 text-center">Loading proof...</div>;
  }

  const revisionsRemaining = proof.max_revisions - proof.revision_count;
  const canRequestRevision = revisionsRemaining > 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Proof Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">Mockup Proof Review</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                From {proof.partner_name || 'Vendor'}
              </p>
            </div>
            <Badge variant={revisionsRemaining > 0 ? 'secondary' : 'destructive'}>
              {revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} left
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Branding Requirements */}
      {proof.branding_requirements && proof.branding_requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Branding Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {proof.branding_requirements.map((req, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  {req}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Mockup Carousel */}
      <Card>
        <CardContent className="p-6">
          <Carousel className="w-full">
            <CarouselContent>
              {proof.mockup_urls.map((url, index) => (
                <CarouselItem key={index}>
                  <div 
                    className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
                    onClick={() => setSelectedImage(url)}
                  >
                    <img
                      src={url}
                      alt={`Mockup ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Mockup {index + 1} of {proof.mockup_urls.length}
                  </p>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {proof.status !== 'approved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleApprove}
            disabled={processing}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Approve & Proceed
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFeedbackForm(true)}
            disabled={!canRequestRevision || processing}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Request Changes
          </Button>
        </div>
      )}

      {/* Warning */}
      <Alert>
        <AlertDescription className="text-xs">
          <strong>Note:</strong> Production begins immediately after approval and cannot be reversed.
          Please review carefully.
        </AlertDescription>
      </Alert>

      {/* Feedback Form Dialog */}
      <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Describe what changes you'd like (e.g., 'Make the logo larger', 'Use blue color instead of red')..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {feedback.length}/500 characters
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeedbackForm(false);
                  setFeedback("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestRevision}
                disabled={!feedback.trim() || processing}
                className="flex-1"
              >
                {processing ? 'Sending...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size Image Viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <img
            src={selectedImage || ''}
            alt="Mockup full size"
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

