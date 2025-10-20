/**
 * Bulk Status Change Dialog
 * Feature 2: PROMPT 8
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
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { bulkChangeStatus } from "@/lib/products/bulkOperations";
import type { StatusUpdate } from "@/types/bulkOperations";

const formSchema = z.object({
  status: z.enum(["active", "inactive", "out_of_stock"]),
});

interface BulkStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: any[];
  onSuccess: () => void;
}

export const BulkStatusChangeDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess
}: BulkStatusChangeDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "active",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      const update: StatusUpdate = {
        status: values.status,
      };

      await bulkChangeStatus(productIds, update, user.id);

      toast({
        title: "Status updated",
        description: `Successfully updated status for ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''}.`,
      });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Change status for {selectedProducts.length} selected product{selectedProducts.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="active" id="active" className="mt-1" />
                        <div>
                          <Label htmlFor="active" className="font-medium">Active</Label>
                          <p className="text-sm text-muted-foreground">
                            Products will appear in customer UI
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="inactive" id="inactive" className="mt-1" />
                        <div>
                          <Label htmlFor="inactive" className="font-medium">Inactive</Label>
                          <p className="text-sm text-muted-foreground">
                            Products will be hidden from customers
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="out_of_stock" id="out_of_stock" className="mt-1" />
                        <div>
                          <Label htmlFor="out_of_stock" className="font-medium">Out of Stock</Label>
                          <p className="text-sm text-muted-foreground">
                            Sets stock to 0 and marks inactive
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {loading ? 'Updating...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

