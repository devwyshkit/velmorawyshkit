import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TrendingUp, TrendingDown } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/pages/partner/Products";

const priceUpdateSchema = z.object({
  operation: z.enum(['increase', 'decrease']),
  type: z.enum(['percentage', 'flat']),
  value: z.number().min(0.01, "Value must be greater than 0"),
  applyTo: z.enum(['price', 'wholesale', 'both']),
});

type PriceUpdateValues = z.infer<typeof priceUpdateSchema>;

interface BulkPriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

/**
 * Bulk Price Update Dialog
 * Allows updating prices for multiple products (increase/decrease by % or flat amount)
 * Swiggy/Zomato menu bulk edit pattern
 */
export const BulkPriceUpdateDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkPriceUpdateDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<PriceUpdateValues>({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      operation: 'increase',
      type: 'percentage',
      value: 10,
      applyTo: 'price',
    },
  });

  const watchedValues = form.watch();

  // Preview calculation for first 3 products
  const getPreview = () => {
    return selectedProducts.slice(0, 3).map(product => {
      let newPrice = product.price;
      
      if (watchedValues.operation === 'increase') {
        if (watchedValues.type === 'percentage') {
          newPrice = Math.round(product.price * (1 + watchedValues.value / 100));
        } else {
          newPrice = product.price + Math.round(watchedValues.value * 100); // Convert to paise
        }
      } else {
        if (watchedValues.type === 'percentage') {
          newPrice = Math.round(product.price * (1 - watchedValues.value / 100));
        } else {
          newPrice = product.price - Math.round(watchedValues.value * 100); // Convert to paise
        }
      }

      return {
        name: product.name,
        oldPrice: product.price,
        newPrice: Math.max(100, newPrice), // Min ₹1
      };
    });
  };

  const onSubmit = async (values: PriceUpdateValues) => {
    setLoading(true);

    try {
      // Import bulk operations logic
      const { updatePrices } = await import('@/lib/products/bulkOperations');
      
      await updatePrices(
        selectedProducts.map(p => p.id),
        {
          operation: values.operation,
          type: values.type,
          value: values.value,
          applyTo: values.applyTo,
        }
      );

      toast({
        title: "Prices updated",
        description: `Successfully updated ${selectedProducts.length} products`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update prices",
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
          <DialogTitle>Update Prices ({selectedProducts.length} products)</DialogTitle>
          <DialogDescription>
            Bulk update prices for selected products
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Operation: Increase or Decrease */}
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
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="increase" id="increase" />
                        <Label htmlFor="increase" className="flex items-center gap-1 cursor-pointer">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Increase
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="decrease" id="decrease" />
                        <Label htmlFor="decrease" className="flex items-center gap-1 cursor-pointer">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          Decrease
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type: Percentage or Flat */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update By</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage" className="cursor-pointer">Percentage (%)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flat" id="flat" />
                        <Label htmlFor="flat" className="cursor-pointer">Flat Amount (₹)</Label>
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
                    {watchedValues.type === 'percentage' ? 'Percentage' : 'Amount'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={watchedValues.type === 'percentage' ? "10" : "100"}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Apply To */}
            <FormField
              control={form.control}
              name="applyTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apply To</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="price" id="price" />
                        <Label htmlFor="price" className="cursor-pointer">Retail Price Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="wholesale" id="wholesale" />
                        <Label htmlFor="wholesale" className="cursor-pointer">Wholesale Price Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="cursor-pointer">Both Prices</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Preview ({preview.length} of {selectedProducts.length})</p>
              {preview.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-muted-foreground">
                      ₹{(item.oldPrice / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="font-medium text-primary">
                      ₹{(item.newPrice / 100).toLocaleString('en-IN')}
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
