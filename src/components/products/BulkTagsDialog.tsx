/**
 * Bulk Tags Dialog
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { bulkUpdateTags } from "@/lib/products/bulkOperations";
import type { TagsUpdate } from "@/types/bulkOperations";

const AVAILABLE_TAGS = [
  { value: "trending", label: "Trending" },
  { value: "featured", label: "Featured" },
  { value: "new", label: "New Arrival" },
  { value: "bestseller", label: "Best Seller" },
  { value: "festive", label: "Festival Special" },
  { value: "premium", label: "Premium" },
];

const formSchema = z.object({
  tags: z.array(z.string()).min(1, "Select at least one tag"),
  operation: z.enum(["add", "remove", "replace"]),
});

interface BulkTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: any[];
  onSuccess: () => void;
}

export const BulkTagsDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess
}: BulkTagsDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tags: [],
      operation: "add",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      const update: TagsUpdate = {
        tags: values.tags,
        operation: values.operation,
      };

      await bulkUpdateTags(productIds, update, user.id);

      toast({
        title: "Tags updated",
        description: `Successfully updated tags for ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''}.`,
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
          <DialogTitle>Update Tags</DialogTitle>
          <DialogDescription>
            Update tags for {selectedProducts.length} selected product{selectedProducts.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="add" id="add" />
                        <Label htmlFor="add">Add tags</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remove" id="remove" />
                        <Label htmlFor="remove">Remove tags</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="replace" id="replace" />
                        <Label htmlFor="replace">Replace all tags</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Select Tags</FormLabel>
                  <div className="space-y-2">
                    {AVAILABLE_TAGS.map((tag) => (
                      <FormField
                        key={tag.value}
                        control={form.control}
                        name="tags"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={tag.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(tag.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, tag.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== tag.value
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {tag.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
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
                {loading ? 'Updating...' : 'Apply Tags'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

