/**
 * Bulk Stock Update Dialog
 * Allows setting, increasing, or decreasing stock for multiple products
 */

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Product } from "@/pages/partner/Products";
import { StockUpdate } from "@/types/bulkOperations";
import { bulkUpdateStock } from "@/lib/products/bulkOperations";
import { useToast } from "@/hooks/use-toast";

const stockUpdateSchema = z.object({
  operation: z.enum(['set', 'increase', 'decrease']),
  value: z.number().int().min(0, "Value must be 0 or greater"),
});

interface BulkStockUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

export const BulkStockUpdateDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess
}: BulkStockUpdateProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof stockUpdateSchema>>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      operation: 'set',
      value: 100,
    }
  });

  const onSubmit = async (values: z.infer<typeof stockUpdateSchema>) => {
    setLoading(true);
    try {
      const update: StockUpdate = {
        operation: values.operation,
        value: values.value
      };

      const result = await bulkUpdateStock(
        selectedProducts.map(p => p.id),
        update
      );

      if (result.success) {
        toast({
          title: "Stock updated",
          description: `Successfully updated ${result.updated} product(s)`,
        });
        
        // Check if any products will have low stock
        const lowStockWarning = selectedProducts.some(p => {
          let newStock = p.stock;
          if (values.operation === 'set') newStock = values.value;
          else if (values.operation === 'increase') newStock = p.stock + values.value;
          else newStock = p.stock - values.value;
          return newStock < 50;
        });

        if (lowStockWarning) {
          toast({
            title: "Low stock warning",
            description: "Some products now have low stock (<50 units)",
            variant: "default",
          });
        }

        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Update failed",
          description: result.errors?.join(', ') || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const watchOperation = form.watch('operation');
  const watchValue = form.watch('value');

  // Calculate example
  const exampleCurrentStock = 50;
  let exampleNewStock = exampleCurrentStock;
  if (watchOperation === 'set') exampleNewStock = watchValue;
  else if (watchOperation === 'increase') exampleNewStock = exampleCurrentStock + watchValue;
  else exampleNewStock = exampleCurrentStock - watchValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            Update stock for {selectedProducts.length} selected product(s)
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
                      value={field.value}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="set" id="set" />
                        <Label htmlFor="set">Set to value</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="increase" id="inc" />
                        <Label htmlFor="inc">Increase by</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="decrease" id="dec" />
                        <Label htmlFor="dec">Decrease by</Label>
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
                    {watchOperation === 'set' ? 'Stock Value' : 'Amount'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-1">Example:</p>
              <p className="text-sm">
                Stock: {exampleCurrentStock} → {exampleNewStock}
                {exampleNewStock < 50 && (
                  <span className="ml-2 text-yellow-600">⚠️ Low stock alert will trigger</span>
                )}
              </p>
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
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

