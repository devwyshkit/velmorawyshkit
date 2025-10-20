import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/pages/partner/Products";

const stockUpdateSchema = z.object({
  operation: z.enum(['set', 'increase', 'decrease']),
  value: z.number().min(0, "Stock cannot be negative"),
});

type StockUpdateValues = z.infer<typeof stockUpdateSchema>;

interface BulkStockUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

/**
 * Bulk Stock Update Dialog
 * Set, increase, or decrease stock for multiple products
 */
export const BulkStockUpdateDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkStockUpdateDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<StockUpdateValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues:{
      operation: 'set',
      value: 100,
    },
  });

  const watchedValues = form.watch();

  // Preview calculation
  const getPreview = () => {
    return selectedProducts.slice(0, 3).map(product => {
      let newStock = product.stock || 0;
      
      if (watchedValues.operation === 'set') {
        newStock = watchedValues.value;
      } else if (watchedValues.operation === 'increase') {
        newStock = (product.stock || 0) + watchedValues.value;
      } else if (watchedValues.operation === 'decrease') {
        newStock = Math.max(0, (product.stock || 0) - watchedValues.value);
      }

      return {
        name: product.name,
        oldStock: product.stock || 0,
        newStock,
      };
    });
  };

  const onSubmit = async (values: StockUpdateValues) => {
    setLoading(true);

    try {
      const { updateStock } = await import('@/lib/products/bulkOperations');
      
      await updateStock(
        selectedProducts.map(p => p.id),
        {
          operation: values.operation,
          value: values.value,
        }
      );

      // Count products that will have low stock after update
      const preview = getPreview();
      const lowStockCount = preview.filter(p => p.newStock < 50).length;

      toast({
        title: "Stock updated",
        description: `Successfully updated ${selectedProducts.length} products`,
        ...(lowStockCount > 0 && {
          variant: "default",
          action: <p className="text-xs text-muted-foreground mt-1">⚠️ {lowStockCount} products now have low stock</p>,
        }),
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const preview = getPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Stock ({selectedProducts.length} products)</DialogTitle>
          <DialogDescription>
            Bulk update inventory for selected products
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Operation */}
            <FormField
              control={form.control}
              name="operation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="set" id="set" />
                        <Label htmlFor="set" className="cursor-pointer">Set to specific value</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="increase" id="increase" />
                        <Label htmlFor="increase" className="cursor-pointer">Increase by</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="decrease" id="decrease" />
                        <Label htmlFor="decrease" className="cursor-pointer">Decrease by</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Value */}
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedValues.operation === 'set' ? 'New Stock Quantity' : 'Amount'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning for decrease */}
            {watchedValues.operation === 'decrease' && (
              <Alert variant="destructive">
                <Package className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Low stock alert will trigger for products below 50 units
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Preview</p>
              {preview.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-muted-foreground">
                      {item.oldStock} units
                    </span>
                    <span className={cn(
                      "font-medium",
                      item.newStock < 50 ? "text-destructive" : "text-primary"
                    )}>
                      {item.newStock} units
                    </span>
                  </div>
                </div>
              ))}
              {selectedProducts.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  ...and {selectedProducts.length - 3} more
                </p>
              )}
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
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Apply Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Import cn for className utility
import { cn } from "@/lib/utils";
