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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { Loader2, AlertCircle } from "lucide-react";

interface BulkStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  selectedCount: number;
  onComplete: () => void;
}

/**
 * Bulk Stock Update Dialog - Zomato Pattern
 * Allows batch stock updates (set/increase/decrease)
 */
export const BulkStockDialog = ({
  open,
  onOpenChange,
  selectedIds,
  selectedCount,
  onComplete,
}: BulkStockDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<"set" | "increase" | "decrease">("set");
  const [value, setValue] = useState("100");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      let lowStockWarnings = 0;

      if (operation === "set") {
        // Set to specific value
        const newStock = parseInt(value);
        
        for (const id of selectedIds) {
          const { error } = await supabase
            .from("partner_products")
            .update({ 
              stock: newStock,
              updated_at: new Date().toISOString()
            })
            .eq("id", id);

          if (error) errorCount++;
          else {
            successCount++;
            if (newStock < 50) lowStockWarnings++;
          }
        }
      } else {
        // Increase or decrease
        const { data: products, error: fetchError } = await supabase
          .from("partner_products")
          .select("id, stock")
          .in("id", selectedIds);

        if (fetchError) throw fetchError;

        for (const product of products || []) {
          const adjustment = parseInt(value);
          const newStock = operation === "increase"
            ? product.stock + adjustment
            : Math.max(0, product.stock - adjustment);

          const { error } = await supabase
            .from("partner_products")
            .update({ 
              stock: newStock,
              updated_at: new Date().toISOString()
            })
            .eq("id", product.id);

          if (error) errorCount++;
          else {
            successCount++;
            if (newStock < 50) lowStockWarnings++;
          }
        }
      }

      // Show results
      if (errorCount === 0) {
        toast({
          title: "Stock Updated",
          description: `Successfully updated ${successCount} product${successCount !== 1 ? 's' : ''}${
            lowStockWarnings > 0 ? `. ${lowStockWarnings} now below low stock threshold` : ''
          }`,
          variant: lowStockWarnings > 0 ? "default" : "default",
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Updated ${successCount} products, ${errorCount} failed`,
          variant: "destructive",
        });
      }

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
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            Modify stock for {selectedCount} selected product{selectedCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Operation */}
          <div className="space-y-2">
            <Label>Operation</Label>
            <RadioGroup value={operation} onValueChange={(v) => setOperation(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set" id="set" />
                <Label htmlFor="set" className="font-normal">Set stock to specific value</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="increase" id="increase" />
                <Label htmlFor="increase" className="font-normal">Increase stock by</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decrease" id="decrease" />
                <Label htmlFor="decrease" className="font-normal">Decrease stock by</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label htmlFor="stock-value">
              {operation === "set" ? "Stock Quantity" : "Units"}
            </Label>
            <Input
              id="stock-value"
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="100"
            />
          </div>

          {/* Low Stock Warning */}
          {operation === "set" && parseInt(value) < 50 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">Low Stock Alert</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Stock will be below 50 units. Low stock alerts will trigger for affected products.
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Preview:</p>
            <p className="text-muted-foreground">
              {operation === "set" && `Set stock to ${value} units`}
              {operation === "increase" && `Increase stock by ${value} units`}
              {operation === "decrease" && `Decrease stock by ${value} units`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Example: 50 units → {
                operation === "set" ? value :
                operation === "increase" ? (50 + parseInt(value || "0")) :
                Math.max(0, 50 - parseInt(value || "0"))
              } units
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !value || parseInt(value) < 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

