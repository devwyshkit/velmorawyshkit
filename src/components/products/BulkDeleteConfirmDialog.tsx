import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/pages/partner/Products";

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

/**
 * Bulk Delete Confirmation Dialog
 * Safety checks before deleting multiple products
 * Warns about hamper dependencies (like Zomato's dependency checks)
 */
export const BulkDeleteConfirmDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkDeleteConfirmDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [affectedHampers, setAffectedHampers] = useState(0);

  // Check impact on hampers when dialog opens
  useState(() => {
    if (open) {
      checkHamperImpact();
    }
  });

  const checkHamperImpact = async () => {
    try {
      const { checkHamperDependencies } = await import('@/lib/products/bulkOperations');
      const count = await checkHamperDependencies(selectedProducts.map(p => p.id));
      setAffectedHampers(count);
    } catch (error) {
      console.error('Failed to check hamper dependencies:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirmed) {
      toast({
        title: "Confirmation required",
        description: "Please confirm you understand the impact",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { bulkDelete } = await import('@/lib/products/bulkOperations');
      
      await bulkDelete(selectedProducts.map(p => p.id));

      toast({
        title: "Products deleted",
        description: `Successfully deleted ${selectedProducts.length} products`,
      });

      onSuccess();
      onOpenChange(false);
      setConfirmed(false);
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setConfirmed(false);
        setAffectedHampers(0);
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete {selectedProducts.length} Products?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permanent Deletion</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>You are about to permanently delete:</p>
              <ul className="list-disc list-inside space-y-1">
                {selectedProducts.slice(0, 3).map((p, idx) => (
                  <li key={idx}>{p.name}</li>
                ))}
                {selectedProducts.length > 3 && (
                  <li>...and {selectedProducts.length - 3} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>

          {/* Hamper Impact Warning */}
          {affectedHampers > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Impact on Hampers</AlertTitle>
              <AlertDescription className="text-xs">
                These products are used in <strong>{affectedHampers} hampers</strong>.
                Deleting them will affect those hamper listings.
              </AlertDescription>
            </Alert>
          )}

          {/* Products List */}
          <div className="max-h-40 overflow-y-auto p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Products to delete:</p>
            <ul className="text-xs space-y-1">
              {selectedProducts.map((product, idx) => (
                <li key={idx} className="text-muted-foreground">
                  • {product.name} (₹{(product.price / 100).toLocaleString('en-IN')})
                </li>
              ))}
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2 p-3 border-2 border-destructive/20 rounded-lg bg-destructive/5">
            <Checkbox
              id="confirm-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(!!checked)}
            />
            <div className="flex-1">
              <Label
                htmlFor="confirm-delete"
                className="text-sm font-medium cursor-pointer"
              >
                I understand this action is permanent
              </Label>
              <p className="text-xs text-muted-foreground">
                {affectedHampers > 0 && `This will affect ${affectedHampers} hampers. `}
                Deleted products cannot be recovered.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !confirmed}
          >
            {loading ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
