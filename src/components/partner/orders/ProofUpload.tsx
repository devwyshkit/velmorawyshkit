import { useState, useEffect } from "react";
import { Upload, Send, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";

interface ProofUploadProps {
  orderId: string;
  partnerId: string;
  brandingRequirements?: string[];
  onProofSent?: () => void;
}

interface ProofSubmission {
  id: string;
  status: string;
  mockup_urls: string[];
  revision_count: number;
  max_revisions: number;
  customer_feedback?: string;
}

/**
 * ProofUpload Component
 * Partner uploads mockup proofs for customer approval
 * Supports revisions (max 2)
 */
export const ProofUpload = ({
  orderId,
  partnerId,
  brandingRequirements = [],
  onProofSent,
}: ProofUploadProps) => {
  const { toast } = useToast();
  const [mockups, setMockups] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [proofSubmission, setProofSubmission] = useState<ProofSubmission | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<any[]>([]);

  useEffect(() => {
    loadExistingProof();
  }, [orderId]);

  const loadExistingProof = async () => {
    try {
      const { data, error } = await supabase
        .from('proof_submissions')
        .select('*, proof_revisions(*)')
        .eq('order_id', orderId)
        .single();

      if (error) {
        console.log('No existing proof found');
        return;
      }

      setProofSubmission({
        id: data.id,
        status: data.status,
        mockup_urls: data.mockup_urls || [],
        revision_count: data.revision_count,
        max_revisions: data.max_revisions,
        customer_feedback: data.customer_feedback,
      });

      setMockups(data.mockup_urls || []);
      setRevisionHistory(data.proof_revisions || []);
    } catch (error) {
      console.error('Load proof error:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (mockups.length + files.length > 3) {
      toast({
        title: "Maximum 3 mockups",
        description: "You can upload up to 3 mockup images",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Mock upload (would use Cloudinary in production)
      const uploadedUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setMockups([...mockups, ...uploadedUrls]);

      toast({
        title: "Mockups uploaded",
        description: `${files.length} image(s) added`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeMockup = (index: number) => {
    setMockups(mockups.filter((_, i) => i !== index));
  };

  const handleSendToCustomer = async () => {
    if (mockups.length === 0) {
      toast({
        title: "No mockups uploaded",
        description: "Please upload at least one mockup",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      if (proofSubmission) {
        // Create new revision
        await supabase.from('proof_revisions').insert({
          proof_submission_id: proofSubmission.id,
          revision_number: proofSubmission.revision_count + 1,
          mockup_urls: mockups,
        });

        await supabase
          .from('proof_submissions')
          .update({
            mockup_urls: mockups,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', proofSubmission.id);
      } else {
        // Create new proof submission
        await supabase.from('proof_submissions').insert({
          order_id: orderId,
          partner_id: partnerId,
          mockup_urls: mockups,
          branding_requirements: brandingRequirements,
          status: 'pending',
        });
      }

      toast({
        title: "Proof sent to customer",
        description: "Customer will review within 24 hours",
      });

      onProofSent?.();
      loadExistingProof();
    } catch (error) {
      toast({
        title: "Failed to send proof",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const revisionsRemaining = proofSubmission 
    ? proofSubmission.max_revisions - proofSubmission.revision_count
    : 2;

  const canRevise = !proofSubmission || proofSubmission.revision_count < proofSubmission.max_revisions;

  return (
    <div className="space-y-4">
      {/* Branding Requirements */}
      {brandingRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {brandingRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Proof Status */}
      {proofSubmission && (
        <Card className={
          proofSubmission.status === 'approved' ? 'border-green-600 bg-green-50 dark:bg-green-950' :
          proofSubmission.status === 'revision_requested' ? 'border-amber-600 bg-amber-50 dark:bg-amber-950' :
          ''
        }>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {proofSubmission.status === 'approved' && '✓ Proof Approved'}
                  {proofSubmission.status === 'pending' && '⏳ Awaiting Customer Review'}
                  {proofSubmission.status === 'revision_requested' && '← Revision Requested'}
                </p>
                {proofSubmission.customer_feedback && (
                  <p className="text-xs text-muted-foreground mt-1">
                    "{proofSubmission.customer_feedback}"
                  </p>
                )}
              </div>
              <Badge variant={revisionsRemaining > 0 ? 'secondary' : 'destructive'}>
                {revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} left
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mockup Upload */}
      {proofSubmission?.status !== 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mockup Images ({mockups.length}/3)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mockup Preview */}
            {mockups.length > 0 && (
              <div className="mb-4">
                <Carousel className="w-full">
                  <CarouselContent>
                    {mockups.map((url, index) => (
                      <CarouselItem key={index} className="basis-1/2 md:basis-1/3">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={url}
                            alt={`Mockup ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => removeMockup(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {mockups.length > 1 && (
                    <>
                      <CarouselPrevious />
                      <CarouselNext />
                    </>
                  )}
                </Carousel>
              </div>
            )}

            {/* Upload Button */}
            {mockups.length < 3 && canRevise && (
              <div>
                <label htmlFor="proof-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Upload Mockup Images</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB each
                    </p>
                  </div>
                </label>
                <input
                  id="proof-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </div>
            )}

            {/* Send to Customer Button */}
            {mockups.length > 0 && canRevise && (
              <Button
                className="w-full"
                onClick={handleSendToCustomer}
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Send className="h-4 w-4 mr-2 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Customer for Approval
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Revision History */}
      {revisionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revision History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revisionHistory.map((revision, idx) => (
                <div key={revision.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Revision {revision.revision_number}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(revision.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {revision.customer_feedback && (
                    <p className="text-sm text-muted-foreground">
                      "{revision.customer_feedback}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning: Non-refundable */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Important:</strong> Production costs are non-refundable after customer approval.
          Ensure mockups accurately reflect the final product.
        </AlertDescription>
      </Alert>
    </div>
  );
};

