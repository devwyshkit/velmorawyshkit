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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { Loader2, AlertTriangle } from "lucide-react";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  selectedCount: number;
  onComplete: () => void;
}

/**
 * Bulk Delete Confirmation Dialog - Safety First
 * Prevents accidental deletion with confirmation checkbox
 */
export const BulkDeleteDialog = ({
  open,
  onOpenChange,
  selectedIds,
  selectedCount,
  onComplete,
}: BulkDeleteDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("partner_products")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      toast({
        title: "Products Deleted",
        description: `Successfully deleted ${selectedCount} product${selectedCount !== 1 ? 's' : ''}`,
      });

      onOpenChange(false);
      onComplete();
      setConfirmed(false);
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset confirmation when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) setConfirmed(false);
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Products
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">
              ⚠️ You are about to delete {selectedCount} product{selectedCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              This will permanently remove:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Product listings from customer UI</li>
              <li>All product images and data</li>
              <li>Product analytics and history</li>
              <li>Associated bulk pricing tiers</li>
              <li>Customization add-ons</li>
            </ul>
          </div>

          {/* Note about active orders */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> Existing orders with these products will not be affected. Only new orders will be prevented.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="confirm-delete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand this action cannot be undone
              </Label>
              <p className="text-xs text-muted-foreground">
                {selectedCount} product{selectedCount !== 1 ? 's' : ''} will be permanently deleted
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!confirmed || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete {selectedCount} Product{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

