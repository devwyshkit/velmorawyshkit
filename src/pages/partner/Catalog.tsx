/**
 * Partner Catalog Manager
 * Mobile-first product CRUD with image upload (reuses customer UI components)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Image as ImageIcon, Loader2, Package, Gift } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPartnerProducts,
  createPartnerProduct,
  updatePartnerProduct,
  deletePartnerProduct,
  fetchPartnerHampers,
  createPartnerHamper,
  updatePartnerHamper,
  deletePartnerHamper,
  type PartnerProduct,
  type PartnerHamper,
  type BulkPricingTier,
  type HamperComponent,
} from '@/lib/integrations/supabase-data';
import { supabase } from '@/lib/integrations/supabase-client';
import { BulkPricingForm } from '@/components/partner/BulkPricingForm';
import { HamperBuilder } from '@/components/partner/HamperBuilder';

export const Catalog = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [hampers, setHampers] = useState<PartnerHamper[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<string>('delhi');
  const [activeTab, setActiveTab] = useState<'products' | 'hampers'>('products');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PartnerProduct | null>(null);
  const [editingHamper, setEditingHamper] = useState<PartnerHamper | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_desc: '',
    category: '',
    price: '',
    original_price: '',
    stock: '',
    preparation_days: '3',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Bulk Pricing State (NEW)
  const [bulkPricingEnabled, setBulkPricingEnabled] = useState(false);
  const [bulkTiers, setBulkTiers] = useState<BulkPricingTier[]>([
    { min_qty: 1, max_qty: 49, price_per_unit: 0 },
    { min_qty: 50, max_qty: 99, price_per_unit: 0 },
    { min_qty: 100, max_qty: null, price_per_unit: 0 },
  ]);
  const [minOrderQty, setMinOrderQty] = useState(1);
  
  // Hamper State (NEW)
  const [hamperComponents, setHamperComponents] = useState<HamperComponent[]>([]);
  const [hamperFormData, setHamperFormData] = useState({
    name: '',
    description: '',
    short_desc: '',
    price: '',
    original_price: '',
    stock: '',
    preparation_days: '5', // Hampers take longer (assembly)
  });
  const [hamperImageFile, setHamperImageFile] = useState<File | null>(null);

  // Load products and hampers on mount
  useEffect(() => {
    loadProducts();
    loadHampers();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Not authenticated', variant: 'destructive' });
        return;
      }

      // Get partner profile to get partner_id
      const { data: profile } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setPartnerId(profile.id);
        setPartnerLocation(profile.city || 'delhi');
        const fetchedProducts = await fetchPartnerProducts(profile.id);
        setProducts(fetchedProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast({ title: 'Error loading products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadHampers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const fetchedHampers = await fetchPartnerHampers(profile.id);
        setHampers(fetchedHampers);
      }
    } catch (error) {
      console.error('Failed to load hampers:', error);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `partner-products/${partnerId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({ title: 'Image upload failed', variant: 'destructive' });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) return;

    setUploading(true);
    try {
      // Upload image if selected
      let imageUrl = editingProduct?.image_url || '';
      if (imageFile) {
        const uploaded = await handleImageUpload(imageFile);
        if (!uploaded) {
          setUploading(false);
          return;
        }
        imageUrl = uploaded;
      }

      // Validate required fields
      if (!formData.name || !formData.price || !imageUrl) {
        toast({ title: 'Please fill all required fields', variant: 'destructive' });
        setUploading(false);
        return;
      }

      const productData = {
        partner_id: partnerId,
        name: formData.name,
        description: formData.description,
        short_desc: formData.short_desc,
        category: formData.category,
        price: parseInt(formData.price) * 100, // Convert to paise
        original_price: formData.original_price ? parseInt(formData.original_price) * 100 : undefined,
        
        // Bulk Pricing (NEW)
        bulk_pricing_tiers: bulkPricingEnabled ? bulkTiers.filter(t => t.price_per_unit > 0) : [],
        min_order_qty: bulkPricingEnabled ? minOrderQty : 1,
        
        image_url: imageUrl,
        additional_images: [],
        stock_by_location: {},
        total_stock: parseInt(formData.stock) || 0,
        is_customizable: false,
        customization_options: [],
        preparation_days: parseInt(formData.preparation_days) || 3,
        estimated_delivery_days: '3-5 days',
        is_active: true,
      };

      if (editingProduct) {
        // Update existing product
        const success = await updatePartnerProduct(editingProduct.id, productData);
        if (success) {
          toast({ title: 'Product updated successfully!' });
          loadProducts();
          resetForm();
        }
      } else {
        // Create new product
        const productId = await createPartnerProduct(productData);
        if (productId) {
          toast({ title: 'Product added successfully!' });
          loadProducts();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error saving product', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const success = await deletePartnerProduct(productId);
    if (success) {
      toast({ title: 'Product deleted' });
      loadProducts();
    } else {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    // Reset product form
    setFormData({
      name: '',
      description: '',
      short_desc: '',
      category: '',
      price: '',
      original_price: '',
      stock: '',
      preparation_days: '3',
    });
    setImageFile(null);
    setEditingProduct(null);
    
    // Reset bulk pricing
    setBulkPricingEnabled(false);
    setBulkTiers([
      { min_qty: 1, max_qty: 49, price_per_unit: 0 },
      { min_qty: 50, max_qty: 99, price_per_unit: 0 },
      { min_qty: 100, max_qty: null, price_per_unit: 0 },
    ]);
    setMinOrderQty(1);
    
    // Reset hamper form
    setHamperFormData({
      name: '',
      description: '',
      short_desc: '',
      price: '',
      original_price: '',
      stock: '',
      preparation_days: '5',
    });
    setHamperImageFile(null);
    setHamperComponents([]);
    setEditingHamper(null);
    
    setIsAddSheetOpen(false);
  };

  const openEditSheet = (product: PartnerProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      short_desc: product.short_desc || '',
      category: product.category,
      price: (product.price / 100).toString(),
      original_price: product.original_price ? (product.original_price / 100).toString() : '',
      stock: product.total_stock.toString(),
      preparation_days: product.preparation_days.toString(),
    });
    
    // Load bulk pricing if exists
    if (product.bulk_pricing_tiers && product.bulk_pricing_tiers.length > 0) {
      setBulkPricingEnabled(true);
      setBulkTiers(product.bulk_pricing_tiers);
      setMinOrderQty(product.min_order_qty || 1);
    } else {
      setBulkPricingEnabled(false);
      setBulkTiers([
        { min_qty: 1, max_qty: 49, price_per_unit: 0 },
        { min_qty: 50, max_qty: 99, price_per_unit: 0 },
        { min_qty: 100, max_qty: null, price_per_unit: 0 },
      ]);
      setMinOrderQty(1);
    }
    
    setIsAddSheetOpen(true);
  };

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalog Manager</h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'products' ? `${products.length} products` : `${hampers.length} hampers`}
          </p>
        </div>
        
        <Sheet open={isAddSheetOpen} onOpenChange={(open) => {
          setIsAddSheetOpen(open);
          if (!open) resetForm();
        }}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'products' ? 'Add Product' : 'Create Hamper'}
            </Button>
          </SheetTrigger>
          
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {activeTab === 'products' 
                  ? (editingProduct ? 'Edit Product' : 'Add New Product')
                  : (editingHamper ? 'Edit Hamper' : 'Create New Hamper')
                }
              </SheetTitle>
              <SheetDescription>
                {activeTab === 'products'
                  ? `Fill in the details below to ${editingProduct ? 'update' : 'add'} a product`
                  : 'Create a curated gift bundle by combining products'
                }
              </SheetDescription>
            </SheetHeader>

            {activeTab === 'products' ? (
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              {/* Product Image */}
              <div>
                <Label htmlFor="image">Product Image *</Label>
                {editingProduct?.image_url && !imageFile && (
                  <div className="mt-2 mb-2">
                    <img 
                      src={editingProduct.image_url} 
                      alt="Current" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {editingProduct ? 'Upload new image to replace current' : 'Upload product image (required)'}
                </p>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Premium Gift Hamper"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tech Gifts">Tech Gifts</SelectItem>
                    <SelectItem value="Gourmet">Gourmet</SelectItem>
                    <SelectItem value="Chocolates">Chocolates</SelectItem>
                    <SelectItem value="Personalized">Personalized</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="2499"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="original_price">Original Price (₹)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="2999"
                  />
                </div>
              </div>

              {/* Stock & Prep Days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="prep_days">Prep Days</Label>
                  <Input
                    id="prep_days"
                    type="number"
                    value={formData.preparation_days}
                    onChange={(e) => setFormData({ ...formData, preparation_days: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <Label htmlFor="short_desc">Short Description</Label>
                <Input
                  id="short_desc"
                  value={formData.short_desc}
                  onChange={(e) => setFormData({ ...formData, short_desc: e.target.value })}
                  placeholder="Perfect for celebrations"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description..."
                  rows={4}
                  required
                />
              </div>

              {/* Bulk Pricing (NEW) */}
              <Accordion type="single" collapsible>
                <AccordionItem value="bulk-pricing">
                  <AccordionTrigger className="text-sm font-medium">
                    Bulk Pricing (Optional)
                  </AccordionTrigger>
                  <AccordionContent>
                    <BulkPricingForm
                      enabled={bulkPricingEnabled}
                      onEnabledChange={setBulkPricingEnabled}
                      tiers={bulkTiers}
                      onTiersChange={setBulkTiers}
                      minOrderQty={minOrderQty}
                      onMinOrderQtyChange={setMinOrderQty}
                      basePrice={parseInt(formData.price) * 100 || 0}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </form>
            ) : (
              /* Hamper Creation Form */
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!partnerId) return;
                
                setUploading(true);
                try {
                  // Upload hamper mockup image
                  let imageUrl = editingHamper?.mockup_image_url || '';
                  if (hamperImageFile) {
                    const uploaded = await handleImageUpload(hamperImageFile);
                    if (!uploaded) {
                      setUploading(false);
                      return;
                    }
                    imageUrl = uploaded;
                  }

                  // Validate
                  if (!hamperFormData.name || !hamperFormData.price || !imageUrl || hamperComponents.length < 2) {
                    toast({ 
                      title: 'Validation failed', 
                      description: 'Fill all fields and add at least 2 components',
                      variant: 'destructive' 
                    });
                    setUploading(false);
                    return;
                  }

                  const hamperData = {
                    partner_id: partnerId,
                    name: hamperFormData.name,
                    description: hamperFormData.description,
                    short_desc: hamperFormData.short_desc,
                    components: hamperComponents,
                    price: parseInt(hamperFormData.price) * 100,
                    original_price: hamperFormData.original_price ? parseInt(hamperFormData.original_price) * 100 : undefined,
                    mockup_image_url: imageUrl,
                    component_images: hamperComponents.map(c => c.image_url || '').filter(Boolean),
                    stock: parseInt(hamperFormData.stock) || 0,
                    preparation_days: parseInt(hamperFormData.preparation_days) || 5,
                    is_active: true,
                  };

                  const hamperId = await createPartnerHamper(hamperData);
                  if (hamperId) {
                    toast({ title: 'Hamper created successfully! 🎉' });
                    loadHampers();
                    resetForm();
                  }
                } catch (error) {
                  console.error('Error creating hamper:', error);
                  toast({ title: 'Error creating hamper', variant: 'destructive' });
                } finally {
                  setUploading(false);
                }
              }} className="space-y-4 mt-6">
                {/* Hamper Mockup Image */}
                <div>
                  <Label htmlFor="hamper-image">Hamper Mockup Image *</Label>
                  <Input
                    id="hamper-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setHamperImageFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload final assembled hamper image
                  </p>
                </div>

                {/* Hamper Name */}
                <div>
                  <Label htmlFor="hamper-name">Hamper Name *</Label>
                  <Input
                    id="hamper-name"
                    value={hamperFormData.name}
                    onChange={(e) => setHamperFormData({ ...hamperFormData, name: e.target.value })}
                    placeholder="Diwali Festival Hamper"
                    required
                  />
                </div>

                {/* Short Description */}
                <div>
                  <Label htmlFor="hamper-short-desc">Short Description</Label>
                  <Input
                    id="hamper-short-desc"
                    value={hamperFormData.short_desc}
                    onChange={(e) => setHamperFormData({ ...hamperFormData, short_desc: e.target.value })}
                    placeholder="Curated joy for festive celebrations"
                    maxLength={100}
                  />
                </div>

                {/* Full Description */}
                <div>
                  <Label htmlFor="hamper-description">Full Description *</Label>
                  <Textarea
                    id="hamper-description"
                    value={hamperFormData.description}
                    onChange={(e) => setHamperFormData({ ...hamperFormData, description: e.target.value })}
                    placeholder="Curated joy with candles, chocolates, and card for festive surprises..."
                    rows={3}
                    required
                  />
                </div>

                {/* Hamper Builder Component */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Build Your Hamper</Label>
                  <HamperBuilder
                    components={hamperComponents}
                    onChange={setHamperComponents}
                    curatorLocation={partnerLocation}
                    partnerId={partnerId || ''}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="hamper-price">Selling Price (₹) *</Label>
                    <Input
                      id="hamper-price"
                      type="number"
                      value={hamperFormData.price}
                      onChange={(e) => setHamperFormData({ ...hamperFormData, price: e.target.value })}
                      placeholder="2499"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="hamper-original">Original Price (₹)</Label>
                    <Input
                      id="hamper-original"
                      type="number"
                      value={hamperFormData.original_price}
                      onChange={(e) => setHamperFormData({ ...hamperFormData, original_price: e.target.value })}
                      placeholder="2999"
                    />
                  </div>
                </div>

                {/* Stock & Preparation Days */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="hamper-stock">Stock</Label>
                    <Input
                      id="hamper-stock"
                      type="number"
                      value={hamperFormData.stock}
                      onChange={(e) => setHamperFormData({ ...hamperFormData, stock: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hamper-prep-days">Assembly Days</Label>
                    <Input
                      id="hamper-prep-days"
                      type="number"
                      value={hamperFormData.preparation_days}
                      onChange={(e) => setHamperFormData({ ...hamperFormData, preparation_days: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={uploading || hamperComponents.length < 2}>
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Hamper
                </Button>
                
                {hamperComponents.length < 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Add at least 2 components to create a hamper
                  </p>
                )}
              </form>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Products | Hampers Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'hampers')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="hampers">
            <Gift className="h-4 w-4 mr-2" />
            Hampers ({hampers.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab Content */}
        <TabsContent value="products" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first product to get started</p>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {!product.is_active && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                    Inactive
                  </div>
                )}
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.short_desc || product.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">₹{(product.price / 100).toLocaleString()}</span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        ₹{(product.original_price / 100).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Stock: {product.total_stock}</span>
                </div>

                {/* Quick Stock Toggle (Swiggy "Mark Unavailable" pattern) */}
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-xs font-medium">Available</span>
                  <Switch
                    checked={product.is_active}
                    onCheckedChange={async (checked) => {
                      const success = await updatePartnerProduct(product.id, { is_active: checked });
                      if (success) {
                        toast({ title: checked ? 'Product marked available' : 'Product marked unavailable' });
                        loadProducts();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditSheet(product)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>

        {/* Hampers Tab Content */}
        <TabsContent value="hampers" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hampers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hampers yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first hamper/combo</p>
                <Button onClick={() => setIsAddSheetOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hamper
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hampers.map((hamper) => (
                <Card key={hamper.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={hamper.mockup_image_url}
                      alt={hamper.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-primary">
                      <Gift className="h-3 w-3 mr-1" />
                      Hamper
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{hamper.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {hamper.short_desc || hamper.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold">₹{(hamper.price / 100).toLocaleString()}</span>
                        {hamper.original_price && (
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            ₹{(hamper.original_price / 100).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">Stock: {hamper.stock}</span>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {hamper.components.length} components • {hamper.preparation_days} days
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          // TODO: Open edit hamper
                          toast({ title: 'Edit hamper coming soon!' });
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={async () => {
                          if (confirm('Delete this hamper?')) {
                            const success = await deletePartnerHamper(hamper.id);
                            if (success) {
                              toast({ title: 'Hamper deleted' });
                              loadHampers();
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

