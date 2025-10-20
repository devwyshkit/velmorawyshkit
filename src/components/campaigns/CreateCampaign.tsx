/**
 * Create Campaign Sheet
 * Feature 5: PROMPT 4
 * Form to create/edit campaigns with banner upload
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Upload } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { Campaign, CampaignFormData } from "@/types/campaigns";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["discount", "free_addon", "bundle"]),
  discount_type: z.enum(["percentage", "flat"]).optional(),
  discount_value: z.number().min(1).optional(),
  products: z.array(z.string()).min(1, "Select at least one product"),
  start_date: z.date(),
  end_date: z.date(),
  featured: z.boolean().default(false),
  banner_url: z.string().optional(),
  terms: z.string().optional(),
}).refine((data) => {
  if (data.type === 'discount') {
    return data.discount_type && data.discount_value;
  }
  return true;
}, {
  message: "Discount type and value required for discount campaigns",
  path: ["discount_value"],
}).refine((data) => {
  return data.end_date > data.start_date;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

interface CreateCampaignProps {
  campaign?: Campaign | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCampaign = ({ campaign, onClose, onSuccess }: CreateCampaignProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(campaign?.banner_url || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: campaign ? {
      name: campaign.name,
      type: campaign.type,
      discount_type: campaign.discount_type,
      discount_value: campaign.discount_value,
      products: campaign.products,
      start_date: new Date(campaign.start_date),
      end_date: new Date(campaign.end_date),
      featured: campaign.featured,
      terms: campaign.terms,
    } : {
      name: "",
      type: "discount",
      discount_type: "percentage",
      discount_value: 10,
      products: [],
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 86400000), // 7 days from now
      featured: false,
      terms: "",
    },
  });

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partner_products')
        .select('id, name, images, price')
        .eq('partner_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({
        title: "File too large",
        description: "Banner must be under 2MB",
        variant: "destructive",
      });
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    setLoading(true);
    try {
      let bannerUrl = campaign?.banner_url || null;

      // Upload banner if new file selected
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('campaign-banners')
          .upload(fileName, bannerFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('campaign-banners')
          .getPublicUrl(data.path);

        bannerUrl = publicUrl;
      }

      const campaignData = {
        partner_id: user.id,
        name: values.name,
        type: values.type,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        products: values.products,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        featured: values.featured,
        banner_url: bannerUrl,
        terms: values.terms,
        status: 'scheduled', // Auto-activate via cron
        impressions: 0,
        orders: 0,
        revenue: 0,
      };

      if (campaign) {
        // Update existing
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', campaign.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('campaigns')
          .insert([campaignData]);

        if (error) throw error;
      }

      toast({
        title: campaign ? "Campaign updated" : "Campaign created",
        description: values.featured 
          ? `Campaign published! Featured placement will cost ~₹500 based on estimated performance.`
          : "Campaign published successfully!",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProductIds = form.watch('products');

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</SheetTitle>
          <SheetDescription>
            Set up a promotional campaign to boost sales
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              {/* Campaign Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Diwali Festival Sale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campaign Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="discount" id="discount" className="mt-1" />
                          <div>
                            <Label htmlFor="discount" className="font-medium">Discount</Label>
                            <p className="text-sm text-muted-foreground">Percentage or flat amount off</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="free_addon" id="free_addon" className="mt-1" />
                          <div>
                            <Label htmlFor="free_addon" className="font-medium">Free Add-on</Label>
                            <p className="text-sm text-muted-foreground">Free greeting card or gift wrap</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="bundle" id="bundle" className="mt-1" />
                          <div>
                            <Label htmlFor="bundle" className="font-medium">Bundle Deal</Label>
                            <p className="text-sm text-muted-foreground">Buy X get Y offer</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount Settings (conditional) */}
              {form.watch('type') === 'discount' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name="discount_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="discount_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Discount Value {form.watch('discount_type') === 'percentage' ? '(%)' : '(₹)'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max={form.watch('discount_type') === 'percentage' ? 100 : undefined}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Product Selection */}
              <FormField
                control={form.control}
                name="products"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Select Products</FormLabel>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          const allIds = products.map(p => p.id);
                          form.setValue('products', 
                            selectedProductIds.length === products.length ? [] : allIds
                          );
                        }}
                      >
                        {selectedProductIds.length === products.length ? 'Clear All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                      {products.map((product) => (
                        <FormField
                          key={product.id}
                          control={form.control}
                          name="products"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={product.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(product.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, product.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== product.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <div className="flex items-center gap-3 flex-1">
                                  <img
                                    src={product.images?.[0] || '/placeholder.svg'}
                                    alt={product.name}
                                    className="h-12 w-12 rounded object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <FormLabel className="font-normal cursor-pointer">
                                      {product.name}
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                      ₹{(product.price / 100).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormDescription>
                      {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration - Simplified (no date picker component for now) */}
              <div className="grid grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={form.watch('start_date').toISOString().split('T')[0]}
                    onChange={(e) => form.setValue('start_date', new Date(e.target.value))}
                  />
                </FormItem>
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    value={form.watch('end_date').toISOString().split('T')[0]}
                    onChange={(e) => form.setValue('end_date', new Date(e.target.value))}
                  />
                </FormItem>
              </div>

              {/* Featured Placement */}
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Featured Placement</FormLabel>
                      <FormDescription>
                        Boost visibility with featured placement (+5% commission fee)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Banner Upload (Optional) */}
              <FormItem>
                <FormLabel>Campaign Banner (Optional)</FormLabel>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                  />
                  <FormDescription>
                    Recommended: 1200×400px, under 2MB
                  </FormDescription>
                  {bannerPreview && (
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}
                </div>
              </FormItem>

              {/* Terms & Conditions */}
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Valid for orders above ₹1,000"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 sticky bottom-0 bg-background pt-4 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (campaign ? 'Update Campaign' : 'Publish Campaign')}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

