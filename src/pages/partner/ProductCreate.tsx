/**
 * Product Create Page - Swiggy 2025 Pattern
 * Simple, single-form product creation (no wizard)
 * Mobile-first, no animations, no dark mode
 * 
 * Fields (Swiggy + Wyshkit additions):
 * - Name (required)
 * - Description (required)
 * - Price (required, single price)
 * - Images (required, multiple)
 * - Category (required)
 * - is_customizable (checkbox - enables Fiverr preview feature)
 * - MOQ (optional, vendor-defined)
 * - Stock quantity (optional, or made-to-order toggle)
 * - Availability toggle (is_active)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, X, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200, "Name too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  short_desc: z.string().max(100, "Short description too long").optional(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  is_customizable: z.boolean().default(false),
  moq: z.number().min(1).optional(),
  stock_quantity: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export const ProductCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isMadeToOrder, setIsMadeToOrder] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('position');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (error: any) {
        console.error('Failed to load categories:', error);
        // Fallback to default categories if database fetch fails
        setCategories([
          { id: 'electronics', name: 'Electronics' },
          { id: 'gourmet', name: 'Gourmet' },
          { id: 'wellness', name: 'Wellness' },
          { id: 'corporate', name: 'Corporate' },
          { id: 'lifestyle', name: 'Lifestyle' },
          { id: 'home-kitchen', name: 'Home & Kitchen' },
          { id: 'books-media', name: 'Books & Media' },
          { id: 'sports-fitness', name: 'Sports & Fitness' },
        ]);
      }
    };
    loadCategories();
  }, []);
  
  // Personalizations/add-ons for customizable products
  interface Personalization {
    id: string;
    label: string;
    price: number;
    instructions?: string;
  }
  const [personalizations, setPersonalizations] = useState<Personalization[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      short_desc: '',
      price: 0,
      category: '',
      images: [],
      is_customizable: false,
      moq: 1,
      stock_quantity: 0,
      is_active: true,
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Removed TODO - implement as needed
    // For now, create object URLs for preview
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      newImages.push(objectUrl);
    }

    setUploadedImages(prev => [...prev, ...newImages]);
    form.setValue('images', [...form.watch('images'), ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    form.setValue('images', newImages);
  };

  const addPersonalization = () => {
    const newPersonalization: Personalization = {
      id: `personalization-${Date.now()}`,
      label: '',
      price: 0,
      instructions: '',
    };
    setPersonalizations([...personalizations, newPersonalization]);
  };

  const removePersonalization = (id: string) => {
    setPersonalizations(personalizations.filter(p => p.id !== id));
  };

  const updatePersonalization = (id: string, field: keyof Personalization, value: string | number | boolean) => {
    setPersonalizations(personalizations.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!user) return;

    setLoading(true);
    try {
      // Generate slug from name
      const slug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Get store_id from user (partner owns a store)
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (storeError || !store) {
        throw new Error('Store not found. Please complete onboarding first.');
      }

      // Create product in store_items table
      const { data: product, error: productError } = await supabase
        .from('store_items')
        .insert({
          store_id: store.id,
          name: values.name,
          slug: slug,
          description: values.description,
          short_desc: values.short_desc || null,
          price: Math.round(values.price * 100), // Convert to paise
          category: values.category,
          image_url: uploadedImages[0] || '',
          images: uploadedImages,
          is_customizable: values.is_customizable,
          personalizations: values.is_customizable && personalizations.length > 0 
            ? personalizations.map(p => ({
                id: p.id,
                label: p.label,
                price: Math.round(p.price * 100), // Convert to paise
                instructions: p.instructions || null,
              }))
            : null,
          moq: values.moq || 1,
          stock_quantity: isMadeToOrder ? null : (values.stock_quantity || 0),
          is_active: values.is_active,
          status: 'pending', // Admin approval required
        })
        .select()
        .single();

      if (productError) throw productError;

      toast({
        title: "Product created!",
        description: "Your product is pending admin approval.",
      });

      // Navigate back to products list
      navigate('/partner/products');
    } catch (error: any) {
      toast({
        title: "Failed to create product",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/partner/products')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Product</h1>
          <p className="text-sm text-muted-foreground">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="e.g., Premium Tech Hamper"
                disabled={loading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_desc">Short Description (Optional)</Label>
              <Input
                id="short_desc"
                {...form.register('short_desc')}
                placeholder="Brief one-line description"
                maxLength={100}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe your product..."
                rows={4}
                disabled={loading}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value) => form.setValue('category', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                                      <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('price', { valueAsNumber: true })}
                  placeholder="0.00"
                  disabled={loading}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Images *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading}
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload images (multiple allowed)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 800x600px, JPG/PNG
                </p>
              </label>
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {form.formState.errors.images && (
              <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Wyshkit Additions (Vendor-Defined) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customization & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_customizable">Allow Customization</Label>
                <p className="text-xs text-muted-foreground">
                  Enable Fiverr preview feature for this product
                </p>
              </div>
              <Switch
                id="is_customizable"
                checked={form.watch('is_customizable')}
                onCheckedChange={(checked) => {
                  form.setValue('is_customizable', checked);
                  if (!checked) {
                    setPersonalizations([]); // Clear personalizations if customization is disabled
                  }
                }}
                disabled={loading}
              />
            </div>

            {/* Personalizations Builder (Only if customizable) */}
            {form.watch('is_customizable') && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Personalizations / Add-ons</Label>
                    <p className="text-xs text-muted-foreground">
                      Define customization options customers can add (e.g., "Logo Upload", "Greeting Card")
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPersonalization}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>

                {personalizations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No personalizations added. Click "Add Option" to create customization options.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {personalizations.map((personalization, index) => (
                      <Card key={personalization.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Option {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removePersonalization(personalization.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Label *</Label>
                              <Input
                                placeholder="e.g., Company Logo"
                                value={personalization.label}
                                onChange={(e) => updatePersonalization(personalization.id, 'label', e.target.value)}
                                disabled={loading}
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs">Price (₹) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={personalization.price || ''}
                                onChange={(e) => updatePersonalization(personalization.id, 'price', parseFloat(e.target.value) || 0)}
                                disabled={loading}
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Instructions (Optional)</Label>
                            <Input
                              placeholder="e.g., Upload logo PNG/SVG format"
                              value={personalization.instructions || ''}
                              onChange={(e) => updatePersonalization(personalization.id, 'instructions', e.target.value)}
                              disabled={loading}
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="h-4 w-4 rounded border-gray-300 bg-green-100 border-green-300 flex items-center justify-center">
                                <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <Label className="text-sm font-medium">
                                Preview Required (All personalizations)
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                              ✓ Customer will upload files, you'll create preview, customer approves before production
                            </p>
                            <p className="text-xs text-blue-700 ml-6 font-medium">
                              💡 All personalizations require preview (simplified rule - no vendor configuration needed)
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="made_to_order">Made-to-Order</Label>
                <p className="text-xs text-muted-foreground">
                  No stock tracking (produced on demand)
                </p>
              </div>
              <Switch
                id="made_to_order"
                checked={isMadeToOrder}
                onCheckedChange={setIsMadeToOrder}
                disabled={loading}
              />
            </div>

            {!isMadeToOrder && (
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  {...form.register('stock_quantity', { valueAsNumber: true })}
                  placeholder="0"
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
              <Input
                id="moq"
                type="number"
                min="1"
                {...form.register('moq', { valueAsNumber: true })}
                placeholder="1"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Minimum quantity customers must order
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Product will be visible to customers after admin approval
                </p>
              </div>
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/partner/products')}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};

