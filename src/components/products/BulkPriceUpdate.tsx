/**
 * Bulk Price Update Dialog
 * Allows updating prices by percentage or flat amount
 * Shows preview of changes before applying
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
import { PriceUpdate } from "@/types/bulkOperations";
import { bulkUpdatePrices } from "@/lib/products/bulkOperations";
import { useToast } from "@/hooks/use-toast";

const priceUpdateSchema = z.object({
  operation: z.enum(['increase', 'decrease']),
  type: z.enum(['percentage', 'flat']),
  value: z.number().min(0.01, "Value must be greater than 0"),
  applyTo: z.enum(['retail', 'wholesale', 'both']),
});

interface BulkPriceUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

export const BulkPriceUpdateDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess
}: BulkPriceUpdateProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof priceUpdateSchema>>({
    resolver: zodResolver(priceUpdateSchema),
    defaultValues: {
      operation: 'increase',
      type: 'percentage',
      value: 10,
      applyTo: 'retail'
    }
  });

  const onSubmit = async (values: z.infer<typeof priceUpdateSchema>) => {
    setLoading(true);
    try {
      const update: PriceUpdate = {
        operation: values.operation,
        type: values.type,
        value: values.value,
        applyTo: values.applyTo
      };

      const result = await bulkUpdatePrices(
        selectedProducts.map(p => p.id),
        update
      );

      if (result.success) {
        toast({
          title: "Prices updated",
          description: `Successfully updated ${result.updated} product(s)`,
        });
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
  const watchType = form.watch('type');
  const watchValue = form.watch('value');

  // Calculate example preview
  const examplePrice = 100000; // ₹1,000 in paise
  let exampleNewPrice = examplePrice;
  
  if (watchOperation === 'increase') {
    exampleNewPrice = watchType === 'percentage'
      ? examplePrice * (1 + watchValue / 100)
      : examplePrice + (watchValue * 100);
  } else {
    exampleNewPrice = watchType === 'percentage'
      ? examplePrice * (1 - watchValue / 100)
      : examplePrice - (watchValue * 100);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Prices</DialogTitle>
          <DialogDescription>
            Update prices for {selectedProducts.length} selected product(s)
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
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="increase" id="increase" />
                        <Label htmlFor="increase">Increase</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="decrease" id="decrease" />
                        <Label htmlFor="decrease">Decrease</Label>
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
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage">Percentage (%)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flat" id="flat" />
                        <Label htmlFor="flat">Flat Amount (₹)</Label>
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
                    {watchType === 'percentage' ? 'Percentage' : 'Amount (₹)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={watchType === 'percentage' ? "1" : "0.01"}
                      min="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Apply To (retail/wholesale/both) - Simplified for MVP */}
            {/* <FormField
              control={form.control}
              name="applyTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apply To</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="retail" id="retail" />
                        <Label htmlFor="retail">Retail</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="wholesale" id="wholesale" />
                        <Label htmlFor="wholesale">Wholesale</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both">Both</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* Preview */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-1">Example:</p>
              <p className="text-sm">
                ₹{(examplePrice / 100).toFixed(2)} → ₹{(exampleNewPrice / 100).toFixed(2)}
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

