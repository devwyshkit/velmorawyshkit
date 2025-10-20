import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const statusChangeSchema = z.object({
  status: z.enum(['active', 'inactive', 'out_of_stock']),
});

type StatusChangeValues = z.infer<typeof statusChangeSchema>;

interface BulkStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

export const BulkStatusChangeDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkStatusChangeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<StatusChangeValues>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const watchedStatus = form.watch('status');

  const onSubmit = async (values: StatusChangeValues) => {
    setLoading(true);

    try {
      const { changeStatus } = await import('@/lib/products/bulkOperations');
      
      await changeStatus(
        selectedProducts.map(p => p.id),
        values.status
      );

      toast({
        title: "Status updated",
        description: `${selectedProducts.length} products are now ${values.status.replace('_', ' ')}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to change status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Status ({selectedProducts.length} products)</DialogTitle>
          <DialogDescription>
            Update status for selected products
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium">Active</p>
                            <p className="text-xs text-muted-foreground">Visible in customer UI</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="inactive" id="inactive" />
                        <Label htmlFor="inactive" className="flex items-center gap-2 cursor-pointer flex-1">
                          <XCircle className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-medium">Inactive</p>
                            <p className="text-xs text-muted-foreground">Hidden from customer UI</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value="out_of_stock" id="out_of_stock" />
                        <Label htmlFor="out_of_stock" className="flex items-center gap-2 cursor-pointer flex-1">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <div>
                            <p className="font-medium">Out of Stock</p>
                            <p className="text-xs text-muted-foreground">Visible but not orderable</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Impact Warning */}
            {watchedStatus === 'inactive' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Inactive products won't appear in customer UI search or listings. 
                  You can reactivate them anytime.
                </AlertDescription>
              </Alert>
            )}

            {watchedStatus === 'out_of_stock' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Products marked as out of stock will be visible but customers cannot add them to cart.
                  Sourcing will be auto-disabled.
                </AlertDescription>
              </Alert>
            )}

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
                {loading ? "Updating..." : `Update ${selectedProducts.length} Products`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
