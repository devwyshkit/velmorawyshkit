/**
 * Return Detail Sheet
 * Feature 10: PROMPT 3
 * Approve/reject return requests with pickup scheduling
 */

import { useState } from "react";
import { Calendar, Truck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { Return } from "@/types/returns";
import { formatDistanceToNow } from "date-fns";

interface ReturnDetailProps {
  returnRequest: Return;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnDetail = ({ returnRequest, onClose, onSuccess }: ReturnDetailProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [showPickupScheduler, setShowPickupScheduler] = useState(false);

  const handleApprove = async () => {
    setShowPickupScheduler(true);
  };

  const handleSchedulePickup = async () => {
    if (!pickupDate) {
      toast({
        title: "Date required",
        description: "Please select a pickup date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('returns')
        .update({
          status: 'pickup_scheduled',
          approved_at: new Date().toISOString(),
          pickup_scheduled_at: pickupDate,
        })
        .eq('id', returnRequest.id);

      if (error) throw error;

      toast({
        title: "Pickup scheduled",
        description: `Pickup scheduled for ${pickupDate}`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Failed to schedule pickup",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.length < 20) {
      toast({
        title: "Reason required",
        description: "Please provide a detailed reason (min 20 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('returns')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', returnRequest.id);

      if (error) throw error;

      toast({
        title: "Return rejected",
        description: "Customer will be notified",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Failed to reject return",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels = {
      wrong_item: 'Wrong Item Sent',
      damaged: 'Product Damaged',
      not_as_described: 'Not As Described',
      changed_mind: 'Changed Mind',
      other: 'Other Reason',
    };
    return labels[reason as keyof typeof labels] || reason;
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Return Request Details</SheetTitle>
          <SheetDescription>
            Review and process customer return request
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Customer & Order Info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Customer</Label>
                <p className="font-medium">{returnRequest.customer_name || 'Customer'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Product</Label>
                <p>{returnRequest.product_name || 'Product'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reason</Label>
                <Badge variant="outline">{getReasonLabel(returnRequest.reason)}</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Requested</Label>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(returnRequest.requested_at), { addSuffix: true })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Photos */}
          {returnRequest.photos && returnRequest.photos.length > 0 && (
            <div>
              <Label>Customer Evidence</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {returnRequest.photos.map((url, idx) => (
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

          {/* Policy Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <p className="text-sm text-blue-800 font-medium">Return Policy:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 7-day return window for non-custom orders</li>
              <li>• Non-refundable for custom orders after proof approval</li>
              <li>• Pickup must be scheduled within 7 days</li>
            </ul>
          </div>

          {/* Action Buttons */}
          {returnRequest.status === 'pending' && !showPickupScheduler && (
            <div className="space-y-3">
              <Button
                onClick={handleApprove}
                className="w-full gap-2"
              >
                <Truck className="h-4 w-4" />
                Approve & Schedule Pickup
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowPickupScheduler(false)}
                className="w-full"
              >
                Reject Return
              </Button>
            </div>
          )}

          {/* Pickup Scheduler */}
          {showPickupScheduler && returnRequest.status === 'pending' && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Schedule Pickup</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label>Pickup Date</Label>
                      <Input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Time Slot</Label>
                      <RadioGroup value={pickupSlot} onValueChange={(value: any) => setPickupSlot(value)} className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="morning" id="morning" />
                          <Label htmlFor="morning" className="cursor-pointer">Morning (10 AM - 2 PM)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="afternoon" id="afternoon" />
                          <Label htmlFor="afternoon" className="cursor-pointer">Afternoon (2 PM - 6 PM)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="evening" id="evening" />
                          <Label htmlFor="evening" className="cursor-pointer">Evening (6 PM - 9 PM)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleSchedulePickup}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Scheduling...' : 'Confirm Pickup'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPickupScheduler(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Form */}
          {returnRequest.status === 'pending' && !showPickupScheduler && (
            <div className="space-y-3">
              <Label>Rejection Reason (if rejecting)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you're rejecting this return (min 20 characters)..."
                rows={4}
              />
              {rejectionReason.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {rejectionReason.length}/20 characters {rejectionReason.length >= 20 && '✓'}
                </p>
              )}
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectionReason.length < 20 || loading}
                className="w-full"
              >
                {loading ? 'Submitting...' : 'Confirm Rejection'}
              </Button>
            </div>
          )}

          {/* Already Processed */}
          {returnRequest.status !== 'pending' && (
            <Card className={returnRequest.status === 'approved' || returnRequest.status === 'pickup_scheduled' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">
                  {returnRequest.status === 'rejected' ? '✗ Rejected' : '✓ Approved'}
                </p>
                {returnRequest.rejection_reason && (
                  <p className="text-sm text-muted-foreground mt-2">{returnRequest.rejection_reason}</p>
                )}
                {returnRequest.pickup_scheduled_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Pickup: {new Date(returnRequest.pickup_scheduled_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

