import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

const tagsSchema = z.object({
  tags: z.array(z.string()).min(1, "Select at least one tag"),
});

type TagsValues = z.infer<typeof tagsSchema>;

interface BulkTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

const AVAILABLE_TAGS = [
  { id: 'festival', label: 'Festival', description: 'Perfect for festival gifting' },
  { id: 'trending', label: 'Trending', description: 'Popular right now' },
  { id: 'new_arrival', label: 'New Arrival', description: 'Recently added' },
  { id: 'best_seller', label: 'Best Seller', description: 'Top selling product' },
  { id: 'premium', label: 'Premium', description: 'High-end product' },
  { id: 'corporate', label: 'Corporate', description: 'Bulk/corporate gifting' },
];

export const BulkTagsDialog = ({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BulkTagsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<TagsValues>({
    resolver: zodResolver(tagsSchema),
    defaultValues: {
      tags: [],
    },
  });

  const onSubmit = async (values: TagsValues) => {
    setLoading(true);

    try {
      const { addTags } = await import('@/lib/products/bulkOperations');
      
      await addTags(
        selectedProducts.map(p => p.id),
        values.tags
      );

      toast({
        title: "Tags added",
        description: `Added ${values.tags.length} tags to ${selectedProducts.length} products`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to add tags",
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
          <DialogTitle>Add Tags ({selectedProducts.length} products)</DialogTitle>
          <DialogDescription>
            Select tags to add to selected products
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Available Tags</FormLabel>
                  <div className="space-y-3">
                    {AVAILABLE_TAGS.map((tag) => (
                      <FormField
                        key={tag.id}
                        control={form.control}
                        name="tags"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={tag.id}
                              className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(tag.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, tag.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== tag.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="flex-1">
                                <FormLabel className="font-medium cursor-pointer">
                                  {tag.label}
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  {tag.description}
                                </p>
                              </div>
                            </FormItem>
                          );
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
                {loading ? "Adding..." : "Add Tags"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
