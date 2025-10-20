/**
 * Dispute Detail Sheet
 * Feature 9: PROMPT 2
 * View and resolve customer disputes
 */

import { useState } from "react";
import { AlertCircle, Upload } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { Dispute } from "@/types/disputes";
import { formatDistanceToNow } from "date-fns";

interface DisputeDetailProps {
  dispute: Dispute;
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeDetail = ({ dispute, onClose, onSuccess }: DisputeDetailProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resolutionType, setResolutionType] = useState<'full_refund' | 'partial_refund' | 'replacement' | 'rejected'>('full_refund');
  const [partialAmount, setPartialAmount] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmitResolution = async () => {
    if (!user) return;

    if (resolutionType === 'rejected' && !responseMessage.trim()) {
      toast({
        title: "Explanation required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        resolution_type: resolutionType,
        response: responseMessage,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      };

      if (resolutionType === 'partial_refund') {
        updateData.refund_amount = parseFloat(partialAmount) * 100; // Convert to paise
      } else if (resolutionType === 'full_refund') {
        // Would fetch order total from orders table
        updateData.refund_amount = 100000; // Placeholder
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', dispute.id);

      if (error) throw error;

      toast({
        title: "Resolution submitted",
        description: "Customer will be notified of your decision",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Failed to submit resolution",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dispute Details</SheetTitle>
          <SheetDescription>
            Review and resolve customer complaint
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Customer Info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Customer</Label>
                <p className="font-medium">{dispute.customer_name || 'Customer'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Order</Label>
                <p className="font-mono text-sm">{dispute.order_number || dispute.order_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reported</Label>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(dispute.reported_at), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Issue Description */}
          <div>
            <Label>Issue Reported</Label>
            <p className="mt-2 text-sm leading-relaxed p-4 bg-muted rounded-lg">
              {dispute.issue}
            </p>
          </div>

          {/* Customer Evidence */}
          {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
            <div>
              <Label>Customer Evidence</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {dispute.evidence_urls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolution Form */}
          {dispute.status === 'open' && (
            <div className="space-y-4">
              <div>
                <Label>Propose Resolution</Label>
                <RadioGroup value={resolutionType} onValueChange={(value: any) => setResolutionType(value)} className="mt-3 space-y-3">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="full_refund" id="full_refund" className="mt-1" />
                    <div>
                      <Label htmlFor="full_refund" className="font-medium cursor-pointer">Full Refund</Label>
                      <p className="text-sm text-muted-foreground">Refund complete order amount</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="partial_refund" id="partial_refund" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="partial_refund" className="font-medium cursor-pointer">Partial Refund</Label>
                      <p className="text-sm text-muted-foreground mb-2">Refund partial amount</p>
                      {resolutionType === 'partial_refund' && (
                        <Input
                          type="number"
                          placeholder="Amount in ₹"
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="replacement" id="replacement" className="mt-1" />
                    <div>
                      <Label htmlFor="replacement" className="font-medium cursor-pointer">Replacement</Label>
                      <p className="text-sm text-muted-foreground">Schedule pickup and send replacement</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="rejected" id="rejected" className="mt-1" />
                    <div>
                      <Label htmlFor="rejected" className="font-medium cursor-pointer">Reject Claim</Label>
                      <p className="text-sm text-muted-foreground">Dispute will escalate to admin</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Response Message */}
              <div>
                <Label>Message to Customer {resolutionType === 'rejected' && <span className="text-destructive">*</span>}</Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Explain your decision to the customer..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Submit Button */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Policy:</strong> Disputes must be resolved within 48 hours. 
                  Customer will receive your decision via email.
                </p>
              </div>

              <Button 
                onClick={handleSubmitResolution}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Submitting...' : 'Submit Resolution'}
              </Button>
            </div>
          )}

          {/* Already Resolved */}
          {dispute.status !== 'open' && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-800">
                  ✓ <strong>Resolved:</strong> {dispute.resolution_type?.replace('_', ' ')}
                </p>
                {dispute.response && (
                  <p className="text-sm text-muted-foreground mt-2">{dispute.response}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

