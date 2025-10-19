/**
 * Bulk Delete Confirmation Dialog
 * Requires explicit confirmation to prevent accidental deletions
 */

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { Product } from "@/pages/partner/Products";
import { bulkDeleteProducts } from "@/lib/products/bulkOperations";
import { useToast } from "@/hooks/use-toast";

interface BulkDeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

export const BulkDeleteConfirmDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess
}: BulkDeleteConfirmProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!confirmed) {
      toast({
        title: "Confirmation required",
        description: "Please confirm you understand this action cannot be undone",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await bulkDeleteProducts(selectedProducts.map(p => p.id));

      if (result.success) {
        toast({
          title: "Products deleted",
          description: `Successfully deleted ${result.deleted} product(s)`,
        });
        onSuccess();
        onOpenChange(false);
        setConfirmed(false);
      } else {
        toast({
          title: "Delete failed",
          description: result.errors?.join(', ') || "Unknown error",
          variant: "destructive",
        });
      }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Products
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm font-medium text-destructive mb-2">
              You are about to delete {selectedProducts.length} product(s):
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 max-h-32 overflow-y-auto">
              {selectedProducts.slice(0, 10).map(p => (
                <li key={p.id} className="list-disc">{p.name}</li>
              ))}
              {selectedProducts.length > 10 && (
                <li className="list-disc">...and {selectedProducts.length - 10} more</li>
              )}
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="confirm" 
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <Label htmlFor="confirm" className="text-sm font-normal">
              I understand this action cannot be undone and will permanently delete these products
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmed(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading || !confirmed}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

