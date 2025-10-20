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
import { Loader2 } from "lucide-react";

interface BulkPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  selectedCount: number;
  onComplete: () => void;
}

/**
 * Bulk Price Update Dialog - Swiggy Pattern
 * Allows batch price updates with percentage or flat amount
 */
export const BulkPriceDialog = ({
  open,
  onOpenChange,
  selectedIds,
  selectedCount,
  onComplete,
}: BulkPriceDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<"increase" | "decrease">("increase");
  const [updateType, setUpdateType] = useState<"percentage" | "flat">("percentage");
  const [value, setValue] = useState("10");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Fetch selected products
      const { data: products, error: fetchError } = await supabase
        .from("partner_products")
        .select("id, price")
        .in("id", selectedIds);

      if (fetchError) throw fetchError;

      // Calculate new prices
      const updates = products?.map((product) => {
        let newPrice = product.price;
        const numValue = parseFloat(value);

        if (updateType === "percentage") {
          const multiplier = operation === "increase" ? (1 + numValue / 100) : (1 - numValue / 100);
          newPrice = Math.round(product.price * multiplier);
        } else {
          const adjustment = numValue * 100; // Convert ₹ to paise
          newPrice = operation === "increase" 
            ? product.price + adjustment 
            : Math.max(0, product.price - adjustment);
        }

        return { id: product.id, price: newPrice };
      });

      // Batch update
      let successCount = 0;
      let errorCount = 0;

      for (const update of updates || []) {
        const { error } = await supabase
          .from("partner_products")
          .update({ price: update.price, updated_at: new Date().toISOString() })
          .eq("id", update.id);

        if (error) errorCount++;
        else successCount++;
      }

      // Show results
      if (errorCount === 0) {
        toast({
          title: "Prices Updated",
          description: `Successfully updated ${successCount} product${successCount !== 1 ? 's' : ''}`,
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
          <DialogTitle>Update Prices</DialogTitle>
          <DialogDescription>
            Modify prices for {selectedCount} selected product{selectedCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Operation: Increase or Decrease */}
          <div className="space-y-2">
            <Label>Operation</Label>
            <RadioGroup value={operation} onValueChange={(v) => setOperation(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="increase" id="increase" />
                <Label htmlFor="increase" className="font-normal">Increase prices</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decrease" id="decrease" />
                <Label htmlFor="decrease" className="font-normal">Decrease prices</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Type: Percentage or Flat Amount */}
          <div className="space-y-2">
            <Label>Update Type</Label>
            <RadioGroup value={updateType} onValueChange={(v) => setUpdateType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal">By percentage (%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat" id="flat" />
                <Label htmlFor="flat" className="font-normal">By flat amount (₹)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label htmlFor="value">
              {updateType === "percentage" ? "Percentage" : "Amount (₹)"}
            </Label>
            <Input
              id="value"
              type="number"
              min="0"
              step={updateType === "percentage" ? "1" : "10"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={updateType === "percentage" ? "10" : "100"}
            />
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Preview:</p>
            <p className="text-muted-foreground">
              {operation === "increase" ? "Increase" : "Decrease"} prices by{" "}
              {updateType === "percentage" ? `${value}%` : `₹${value}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Example: ₹2,499 → ₹
              {updateType === "percentage"
                ? Math.round(
                    2499 * (operation === "increase" ? (1 + parseFloat(value || "0") / 100) : (1 - parseFloat(value || "0") / 100))
                  ).toLocaleString("en-IN")
                : (operation === "increase"
                    ? (2499 + parseFloat(value || "0")).toLocaleString("en-IN")
                    : Math.max(0, 2499 - parseFloat(value || "0")).toLocaleString("en-IN")
                  )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !value || parseFloat(value) <= 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update {selectedCount} Product{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

