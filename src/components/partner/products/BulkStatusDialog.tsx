import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { Loader2, Info } from "lucide-react";

interface BulkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  selectedCount: number;
  onComplete: () => void;
}

/**
 * Bulk Status Change Dialog - Swiggy/Zomato Pattern
 * Toggle product availability in customer UI
 */
export const BulkStatusDialog = ({
  open,
  onOpenChange,
  selectedIds,
  selectedCount,
  onComplete,
}: BulkStatusDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("active");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const isActive = newStatus === "active";

      const { error } = await supabase
        .from("partner_products")
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Successfully ${isActive ? 'activated' : 'deactivated'} ${selectedCount} product${selectedCount !== 1 ? 's' : ''}`,
      });

      onOpenChange(false);
      onComplete();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Update visibility for {selectedCount} selected product{selectedCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label>New Status</Label>
            <RadioGroup value={newStatus} onValueChange={setNewStatus}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="active" />
                <Label htmlFor="active" className="font-normal">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="inactive" />
                <Label htmlFor="inactive" className="font-normal">Inactive</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Impact Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">Impact:</p>
              <p className="text-blue-700 dark:text-blue-300">
                {newStatus === "active"
                  ? "Products will be visible in customer UI, search results, and available for ordering."
                  : "Products will be hidden from customer UI and unavailable for new orders. Existing orders not affected."}
              </p>
            </div>
          </div>

          {/* Inactive Warning */}
          {newStatus === "inactive" && (
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Note:</p>
              <p>Inactive products:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Won't appear in customer search or browse</li>
                <li>Can't be added to cart or hampers</li>
                <li>Existing orders will complete normally</li>
                <li>You can reactivate anytime</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {newStatus === "active" ? "Activate" : "Deactivate"} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

