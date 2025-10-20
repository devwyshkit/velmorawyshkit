/**
 * Bulk Price Update Dialog
 * Feature 2: PROMPT 8
 * Allows updating prices for multiple products
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { bulkUpdatePrices } from "@/lib/products/bulkOperations";
import type { PriceUpdate } from "@/types/bulkOperations";

const formSchema = z.object({
  operation: z.enum(["increase", "decrease"]),
  type: z.enum(["percentage", "flat"]),
  value: z.number().min(0.01, "Value must be greater than 0"),
  applyTo: z.enum(["retail", "wholesale", "both"]),
});

interface BulkPriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: any[];
  onSuccess: () => void;
}

export const BulkPriceUpdateDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess
}: BulkPriceUpdateDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operation: "increase",
      type: "percentage",
      value: 10,
      applyTo: "retail",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      const update: PriceUpdate = {
        operation: values.operation,
        type: values.type,
        value: values.value,
        applyTo: values.applyTo,
      };

      const result = await bulkUpdatePrices(productIds, update, user.id);

      if (result.success > 0) {
        toast({
          title: "Prices updated",
          description: `Successfully updated ${result.success} product${result.success !== 1 ? 's' : ''}.${
            result.failed > 0 ? ` ${result.failed} failed.` : ''
          }`,
        });
      }

      if (result.errors.length > 0) {
        console.error('Price update errors:', result.errors);
        toast({
          title: "Some updates failed",
          description: `${result.errors.length} product${result.errors.length !== 1 ? 's' : ''} could not be updated.`,
          variant: "destructive",
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
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

  // Calculate example price
  const examplePrice = 1499; // ₹1,499
  const values = form.watch();
  let exampleNewPrice = examplePrice;
  
  if (values.operation === 'increase') {
    if (values.type === 'percentage') {
      exampleNewPrice = examplePrice * (1 + values.value / 100);
    } else {
      exampleNewPrice = examplePrice + (values.value * 100);
    }
  } else {
    if (values.type === 'percentage') {
      exampleNewPrice = examplePrice * (1 - values.value / 100);
    } else {
      exampleNewPrice = Math.max(100, examplePrice - (values.value * 100));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Prices</DialogTitle>
          <DialogDescription>
            Update prices for {selectedProducts.length} selected product{selectedProducts.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                    Value {values.type === 'percentage' ? '(%)' : '(₹)'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="retail" id="retail" />
                        <Label htmlFor="retail">Retail Price Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="wholesale" id="wholesale" />
                        <Label htmlFor="wholesale">Wholesale Price Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both">Both Prices</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Preview Example:</p>
              <p className="text-muted-foreground">
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
                {loading ? 'Updating...' : 'Apply Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

