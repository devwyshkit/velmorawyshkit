/**
 * Bulk Delete Confirmation Dialog
 * Feature 2: PROMPT 8
 */

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { bulkDeleteProducts } from "@/lib/products/bulkOperations";

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: any[];
  onSuccess: () => void;
}

export const BulkDeleteConfirmDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess
}: BulkDeleteConfirmDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!user || !confirmed) return;

    setLoading(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      await bulkDeleteProducts(productIds, user.id);

      toast({
        title: "Products deleted",
        description: `Successfully deleted ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''}.`,
      });

      onSuccess();
      onOpenChange(false);
      setConfirmed(false);
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4">
          <div className="rounded-md bg-destructive/10 p-3 space-y-2">
            <p className="text-sm font-medium text-destructive">Warning:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Products will be removed from all collections</li>
              <li>Active orders with these products may be affected</li>
              <li>This action is permanent and cannot be undone</li>
            </ul>
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <Checkbox
              id="confirm-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <Label
              htmlFor="confirm-delete"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this action cannot be undone
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!confirmed || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

