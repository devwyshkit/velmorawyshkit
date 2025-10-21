import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Upload, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { Product, AddOn } from "@/pages/partner/Products";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { BulkPricingTiers } from "@/components/products/BulkPricingTiers";
import { SponsoredToggle } from "@/components/products/SponsoredToggle";
import { SourcingLimits } from "@/components/products/SourcingLimits";
import { BulkTier } from "@/types/products";

// Form validation schema
const productFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  short_desc: z.string().max(150, "Short description must be under 150 characters").optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  stock: z.number().min(0, "Stock cannot be negative"),
  is_customizable: z.boolean(),
  category: z.string().optional(),
  estimated_delivery_days: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Product Form with Add-ons Builder
 * Swiggy/Zomato add-ons configuration pattern
 * Partners can set add-ons with MOQ and proof requirements
 */
export const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [addOns, setAddOns] = useState<AddOn[]>(product?.add_ons || []);
  const [isCustomizable, setIsCustomizable] = useState(product?.is_customizable || false);
  const [bulkTiers, setBulkTiers] = useState<BulkTier[]>(product?.bulk_pricing || []);
  const [sponsoredData, setSponsoredData] = useState<{
    isSponsored: boolean;
    startDate?: Date;
    endDate?: Date;
  }>({
    isSponsored: product?.sponsored || false,
    startDate: product?.sponsored_start_date ? new Date(product.sponsored_start_date) : undefined,
    endDate: product?.sponsored_end_date ? new Date(product.sponsored_end_date) : undefined,
  });
  const [sourcingData, setSourcingData] = useState<{
    available: boolean;
    monthlyLimit?: number;
  }>({
    available: product?.sourcing_available || false,
    monthlyLimit: product?.sourcing_limit_monthly,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      short_desc: product?.short_desc || "",
      price: product?.price ? product.price / 100 : 0,  // Convert from paise
      stock: product?.stock || 0,
      is_customizable: product?.is_customizable || false,
      category: product?.category || "",
      estimated_delivery_days: product?.estimated_delivery_days || "3-5 days",
    },
  });

  // Add new add-on (max 5)
  const handleAddNewAddOn = () => {
    if (addOns.length >= 5) {
      toast({
        title: "Maximum add-ons reached",
        description: "You can add up to 5 add-ons per product",
        variant: "destructive",
      });
      return;
    }

    setAddOns([
      ...addOns,
      {
        id: `addon-${Date.now()}`,
        name: "",
        price: 0,
        moq: 1,
        requiresProof: false,
        description: "",
      },
    ]);
  };

  // Remove add-on
  const handleRemoveAddOn = (index: number) => {
    setAddOns(addOns.filter((_, i) => i !== index));
  };

  // Update add-on field
  const updateAddOn = (index: number, field: keyof AddOn, value: any) => {
    const updated = [...addOns];
    updated[index] = { ...updated[index], [field]: value };
    setAddOns(updated);
  };

  // Handle form submission
  const onSubmit = async (values: ProductFormValues) => {
    if (!user) return;

    // Validate add-ons if customizable
    if (isCustomizable && addOns.length > 0) {
      const invalidAddOns = addOns.filter(a => !a.name || a.price <= 0 || a.moq < 1);
      if (invalidAddOns.length > 0) {
        toast({
          title: "Invalid add-ons",
          description: "All add-ons must have name, price, and valid MOQ",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const productData = {
        partner_id: user.id,
        name: values.name,
        description: values.description,
        short_desc: values.short_desc,
        price: Math.round(values.price * 100),  // Convert to paise
        stock: values.stock,
        images,
        is_customizable: isCustomizable,
        add_ons: isCustomizable ? addOns : [],
        bulk_pricing: bulkTiers.length > 0 ? bulkTiers : null,  // Bulk pricing tiers
        sponsored: sponsoredData.isSponsored,
        sponsored_start_date: sponsoredData.isSponsored && sponsoredData.startDate ? sponsoredData.startDate.toISOString() : null,
        sponsored_end_date: sponsoredData.isSponsored && sponsoredData.endDate ? sponsoredData.endDate.toISOString() : null,
        sourcing_available: sourcingData.available,
        sourcing_limit_monthly: sourcingData.available && sourcingData.monthlyLimit ? sourcingData.monthlyLimit : null,
        sourcing_limit_enabled: sourcingData.available && !!sourcingData.monthlyLimit,
        category: values.category,
        estimated_delivery_days: values.estimated_delivery_days,
        is_active: true,
      };

      if (product?.id) {
        // Update existing product
        const { error } = await supabase
          .from('partner_products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;
        
        toast({
          title: "Product updated",
          description: "Your product has been updated successfully",
        });
      } else {
        // Create new product
        const { error } = await supabase
          .from('partner_products')
          .insert(productData);
        
        if (error) throw error;
        
        toast({
          title: "Product created",
          description: "Your product has been added to the catalog",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Product save error:', error);
      toast({
        title: "Save failed",
        description: error.message || "Could not save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Approval Status Info */}
        {product?.approval_status && product.approval_status !== 'approved' && (
          <Alert variant={product.approval_status === 'rejected' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {product.approval_status === 'pending_review' && 'Pending Review'}
              {product.approval_status === 'rejected' && 'Product Rejected'}
              {product.approval_status === 'changes_requested' && 'Changes Requested'}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {product.approval_status === 'pending_review' && 
                'This product is under review by our team. It will be live within 24 hours if approved.'}
              {product.approval_status === 'rejected' && product.rejection_reason && 
                `Reason: ${product.rejection_reason}. Please make corrections and resubmit.`}
              {product.approval_status === 'changes_requested' && 
                'Admin has requested changes. Update the product to resubmit for review.'}
            </AlertDescription>
          </Alert>
        )}

        {!product && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              New products are reviewed by our team within 24 hours before going live.
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="Premium Gift Hamper" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Curated selection of premium items perfect for any occasion..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Detailed product description (shown in item details)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="short_desc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Perfect for corporate gifting"
                    maxLength={150}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Brief description shown on product cards (max 150 chars)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4">
          <h3 className="font-semibold">Pricing & Inventory</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retail Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2499"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Images */}
        {/* Product Images - Shared Component (DRY) */}
        <div className="space-y-4">
          <h3 className="font-semibold">Product Images</h3>
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            maxImages={5}
            maxSizeMB={5}
            disabled={loading}
          />
        </div>

        {/* Bulk Pricing Tiers - PROMPT 1 Feature */}
        <BulkPricingTiers
          basePrice={Math.round((form.watch('price') || 0) * 100)}
          initialTiers={bulkTiers}
          onTiersChange={setBulkTiers}
          disabled={loading}
        />

        {/* Sponsored Listing Toggle - PROMPT 5 Feature */}
        <SponsoredToggle
          productId={product?.id}
          initialSponsored={sponsoredData.isSponsored}
          initialStartDate={sponsoredData.startDate?.toISOString()}
          initialEndDate={sponsoredData.endDate?.toISOString()}
          onSponsoredChange={(isSponsored, startDate, endDate) => {
            setSponsoredData({
              isSponsored,
              startDate,
              endDate,
            });
          }}
          disabled={loading}
        />

        {/* Sourcing Limits - PROMPT 11 Feature */}
        <SourcingLimits
          productId={product?.id}
          initialAvailable={sourcingData.available}
          initialMonthlyLimit={sourcingData.monthlyLimit}
          onSourcingChange={(available, monthlyLimit) => {
            setSourcingData({
              available,
              monthlyLimit,
            });
          }}
          disabled={loading}
        />

        {/* CUSTOMIZATION & ADD-ONS (Swiggy/Zomato Pattern) */}
        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="customization" className="border-0">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-semibold">🎨 Customization & Add-ons</span>
                {isCustomizable && addOns.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {addOns.length} add-on{addOns.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {/* Customization Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="customizable">Supports Customization</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow customers to add greeting cards, logos, gift wrapping, etc.
                  </p>
                </div>
                <Switch
                  id="customizable"
                  checked={isCustomizable}
                  onCheckedChange={setIsCustomizable}
                />
              </div>

              {/* Add-ons Builder (only if customizable) */}
              {isCustomizable && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Add-on Options</p>
                      <p className="text-xs text-muted-foreground">
                        Like Swiggy's "Extra Cheese", add-ons let customers personalize orders.
                        Set MOQ for bulk customization (e.g., 50 units for logo engraving).
                      </p>
                    </div>
                  </div>

                  {/* Add-ons List */}
                  {addOns.map((addOn, index) => (
                    <Card key={addOn.id} className="bg-muted/50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Add-on {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAddOn(index)}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Add-on Name */}
                        <div className="space-y-1.5">
                          <Label htmlFor={`addon-name-${index}`} className="text-xs">
                            Add-on Name
                          </Label>
                          <Input
                            id={`addon-name-${index}`}
                            placeholder="e.g., Company Logo Engraving"
                            value={addOn.name}
                            onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                          />
                        </div>

                        {/* Price and MOQ */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`addon-price-${index}`} className="text-xs">
                              Price (+₹)
                            </Label>
                            <Input
                              id={`addon-price-${index}`}
                              type="number"
                              placeholder="200"
                              value={addOn.price / 100 || ""}  // Display in rupees
                              onChange={(e) => updateAddOn(index, 'price', Number(e.target.value) * 100)}  // Store in paise
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`addon-moq-${index}`} className="text-xs">
                              Min Quantity
                            </Label>
                            <Input
                              id={`addon-moq-${index}`}
                              type="number"
                              placeholder="50"
                              value={addOn.moq || ""}
                              onChange={(e) => updateAddOn(index, 'moq', Number(e.target.value))}
                            />
                          </div>
                        </div>

                        {/* Proof Required Checkbox */}
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`addon-proof-${index}`}
                            checked={addOn.requiresProof}
                            onCheckedChange={(checked) => updateAddOn(index, 'requiresProof', checked)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`addon-proof-${index}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              Requires customer to upload design/logo
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Customer must upload files before order confirmation
                            </p>
                          </div>
                        </div>

                        {/* Description (help text for customers) */}
                        {addOn.requiresProof && (
                          <div className="space-y-1.5">
                            <Label htmlFor={`addon-desc-${index}`} className="text-xs">
                              Instructions for Customer
                            </Label>
                            <Input
                              id={`addon-desc-${index}`}
                              placeholder="Upload your logo (PNG/SVG, max 5MB)"
                              value={addOn.description || ""}
                              onChange={(e) => updateAddOn(index, 'description', e.target.value)}
                            />
                          </div>
                        )}

                        {/* Example Preview */}
                        <div className="pt-2 border-t text-xs text-muted-foreground">
                          Preview: <span className="font-medium">"{addOn.name || 'Add-on name'}"</span>
                          {' '}(+₹{addOn.price / 100 || 0})
                          {addOn.moq > 1 && <span className="text-orange-600"> • Min {addOn.moq} units</span>}
                          {addOn.requiresProof && <span className="text-primary"> • Upload required</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Add Another Button */}
                  {addOns.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddNewAddOn}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Another Add-on ({addOns.length}/5)
                    </Button>
                  )}

                  {/* Examples (Swiggy/Zomato pattern) */}
                  {addOns.length === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Common Add-on Examples</AlertTitle>
                      <AlertDescription className="text-xs space-y-1 mt-2">
                        <p>• <strong>Greeting Card</strong> (+₹99, MOQ: 1, No proof)</p>
                        <p>• <strong>Gift Wrapping</strong> (+₹149, MOQ: 1, No proof)</p>
                        <p>• <strong>Company Logo</strong> (+₹200, MOQ: 50, Proof required)</p>
                        <p>• <strong>Custom Message</strong> (+₹50, MOQ: 1, No proof)</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              product ? 'Update Product' : 'Create Product'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

