import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Upload, 
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { ListingType, PricingTier, AddOn } from '@/types/product';
import { calculateTieredPrice, validatePricingTiers } from '@/lib/pricing/tieredPricing';

interface ProductFormData {
  // Step 1: Listing Type
  listingType: ListingType;
  
  // Step 2: Basic Details
  name: string;
  description: string;
  category: string;
  images: string[];
  whatsIncluded: string[];
  
  // Step 3: Tiered Pricing
  tieredPricing: PricingTier[];
  
  // Step 4: Add-ons
  addOns: AddOn[];
  
  // Step 5: Inventory & Fulfillment
  isMadeToOrder: boolean;
  stockAvailable: number;
  deliveryTimeTiers: Array<{
    minQty: number;
    maxQty: number | null;
    deliveryDays: string;
  }>;
  
  // Step 6: Customization
  isCustomizable: boolean;
  previewRequired: boolean;
}

const initialFormData: ProductFormData = {
  listingType: 'individual',
  name: '',
  description: '',
  category: '',
  images: [],
  whatsIncluded: [],
  tieredPricing: [
    { minQty: 1, maxQty: 9, pricePerItem: 500000, discountPercent: 0 }
  ],
  addOns: [],
  isMadeToOrder: false,
  stockAvailable: 0,
  deliveryTimeTiers: [
    { minQty: 1, maxQty: null, deliveryDays: '2-3 days' }
  ],
  isCustomizable: false,
  previewRequired: false
};

const categories = [
  'Electronics',
  'Gourmet',
  'Wellness',
  'Corporate',
  'Lifestyle',
  'Home & Kitchen',
  'Books & Media',
  'Sports & Fitness'
];

const listingTypeOptions = [
  {
    value: 'individual' as ListingType,
    title: 'Individual Product',
    description: 'Single item with gifting service (wrapping, card, etc.)',
    example: 'Boat Airdopes 131 - Premium Gift Packed'
  },
  {
    value: 'hamper' as ListingType,
    title: 'Hamper/Combo',
    description: 'Multiple items bundled together as a gift set',
    example: 'Premium Tech Hamper with speaker, power bank, and accessories'
  },
  {
    value: 'service' as ListingType,
    title: 'Service Only',
    description: 'Pure service like gift wrapping, customization, etc.',
    example: 'Gift Wrapping Service - Premium Package'
  }
];

export default function ProductForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 6;

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors when form data changes
    setErrors({});
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.listingType) {
          newErrors.listingType = 'Please select a listing type';
        }
        break;

      case 2:
        if (!formData.name.trim()) {
          newErrors.name = 'Product name is required';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Product description is required';
        }
        if (!formData.category) {
          newErrors.category = 'Please select a category';
        }
        if (formData.whatsIncluded.length === 0) {
          newErrors.whatsIncluded = 'Please add at least one item to "What\'s Included"';
        }
        break;

      case 3:
        if (formData.tieredPricing.length === 0) {
          newErrors.tieredPricing = 'At least one pricing tier is required';
        } else {
          const validationErrors = validatePricingTiers(formData.tieredPricing);
          if (validationErrors.length > 0) {
            newErrors.tieredPricing = validationErrors[0];
          }
        }
        break;

      case 4:
        // Add-ons are optional, no validation needed
        break;

      case 5:
        if (!formData.isMadeToOrder && formData.stockAvailable <= 0) {
          newErrors.stockAvailable = 'Please enter stock quantity or enable made-to-order';
        }
        if (formData.deliveryTimeTiers.length === 0) {
          newErrors.deliveryTimeTiers = 'At least one delivery time tier is required';
        }
        break;

      case 6:
        // Customization settings are optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addPricingTier = () => {
    const newTier: PricingTier = {
      minQty: formData.tieredPricing.length > 0 
        ? (formData.tieredPricing[formData.tieredPricing.length - 1].maxQty || 0) + 1
        : 1,
      maxQty: null,
      pricePerItem: 0,
      discountPercent: 0
    };
    
    updateFormData({
      tieredPricing: [...formData.tieredPricing, newTier]
    });
  };

  const updatePricingTier = (index: number, updates: Partial<PricingTier>) => {
    const updatedTiers = [...formData.tieredPricing];
    updatedTiers[index] = { ...updatedTiers[index], ...updates };
    
    // Auto-calculate discount percentage
    if (updates.pricePerItem && formData.tieredPricing.length > 0) {
      const firstTierPrice = formData.tieredPricing[0].pricePerItem;
      const discountPercent = Math.round(((firstTierPrice - updates.pricePerItem) / firstTierPrice) * 100);
      updatedTiers[index].discountPercent = Math.max(0, discountPercent);
    }
    
    updateFormData({ tieredPricing: updatedTiers });
  };

  const removePricingTier = (index: number) => {
    if (formData.tieredPricing.length > 1) {
      const updatedTiers = formData.tieredPricing.filter((_, i) => i !== index);
      updateFormData({ tieredPricing: updatedTiers });
    }
  };

  const addWhatsIncluded = () => {
    updateFormData({
      whatsIncluded: [...formData.whatsIncluded, '']
    });
  };

  const updateWhatsIncluded = (index: number, value: string) => {
    const updated = [...formData.whatsIncluded];
    updated[index] = value;
    updateFormData({ whatsIncluded: updated });
  };

  const removeWhatsIncluded = (index: number) => {
    const updated = formData.whatsIncluded.filter((_, i) => i !== index);
    updateFormData({ whatsIncluded: updated });
  };

  const addAddOn = () => {
    const newAddOn: AddOn = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      type: 'standard',
      minimumOrder: undefined,
      requiresPreview: false,
      requiresProof: false
    };
    
    updateFormData({
      addOns: [...formData.addOns, newAddOn]
    });
  };

  const updateAddOn = (index: number, updates: Partial<AddOn>) => {
    const updated = [...formData.addOns];
    updated[index] = { ...updated[index], ...updates };
    updateFormData({ addOns: updated });
  };

  const removeAddOn = (index: number) => {
    const updated = formData.addOns.filter((_, i) => i !== index);
    updateFormData({ addOns: updated });
  };

  const addDeliveryTimeTier = () => {
    const newTier = {
      minQty: formData.deliveryTimeTiers.length > 0 
        ? (formData.deliveryTimeTiers[formData.deliveryTimeTiers.length - 1].maxQty || 0) + 1
        : 1,
      maxQty: null,
      deliveryDays: '2-3 days'
    };
    
    updateFormData({
      deliveryTimeTiers: [...formData.deliveryTimeTiers, newTier]
    });
  };

  const updateDeliveryTimeTier = (index: number, updates: Partial<typeof formData.deliveryTimeTiers[0]>) => {
    const updated = [...formData.deliveryTimeTiers];
    updated[index] = { ...updated[index], ...updates };
    updateFormData({ deliveryTimeTiers: updated });
  };

  const removeDeliveryTimeTier = (index: number) => {
    if (formData.deliveryTimeTiers.length > 1) {
      const updated = formData.deliveryTimeTiers.filter((_, i) => i !== index);
      updateFormData({ deliveryTimeTiers: updated });
    }
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      // Submit form data
      console.log('Submitting product:', formData);
      // TODO: Implement actual submission logic
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What type of product are you listing?</h2>
        <p className="text-muted-foreground mt-2">
          Choose the type that best describes your offering
        </p>
      </div>

      <div className="grid gap-4">
        {listingTypeOptions.map((option) => (
          <Card 
            key={option.value}
            className={`cursor-pointer transition-all ${
              formData.listingType === option.value 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => updateFormData({ listingType: option.value })}
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  formData.listingType === option.value 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {formData.listingType === option.value && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <strong>Example:</strong> {option.example}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {errors.listingType && (
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errors.listingType}</span>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Product Details</h2>
        <p className="text-muted-foreground mt-2">
          Tell customers about your product
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., Premium Tech Hamper"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe your product in detail..."
            rows={4}
            className={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => updateFormData({ category: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.category ? 'border-destructive' : 'border-input'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-destructive mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <Label>What's Included *</Label>
          <p className="text-sm text-muted-foreground mb-3">
            List all items that come with this product
          </p>
          <div className="space-y-2">
            {formData.whatsIncluded.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={item}
                  onChange={(e) => updateWhatsIncluded(index, e.target.value)}
                  placeholder="e.g., Boat Rockerz 450 Wireless Headphones"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeWhatsIncluded(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addWhatsIncluded}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          {errors.whatsIncluded && (
            <p className="text-sm text-destructive mt-1">{errors.whatsIncluded}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Pricing Tiers</h2>
        <p className="text-muted-foreground mt-2">
          Set quantity-based pricing (like Swiggy/Zomato)
        </p>
      </div>

      <div className="space-y-4">
        {formData.tieredPricing.map((tier, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tier {index + 1}</CardTitle>
                {formData.tieredPricing.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removePricingTier(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Quantity</Label>
                  <Input
                    type="number"
                    value={tier.minQty}
                    onChange={(e) => updatePricingTier(index, { 
                      minQty: parseInt(e.target.value) || 0 
                    })}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Max Quantity (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    value={tier.maxQty || ''}
                    onChange={(e) => updatePricingTier(index, { 
                      maxQty: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              
              <div>
                <Label>Price per Item (in paise)</Label>
                <Input
                  type="number"
                  value={tier.pricePerItem}
                  onChange={(e) => updatePricingTier(index, { 
                    pricePerItem: parseInt(e.target.value) || 0 
                  })}
                  min="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  ₹{(tier.pricePerItem / 100).toLocaleString('en-IN')} per item
                </p>
              </div>
              
              {tier.discountPercent > 0 && (
                <Badge variant="secondary">
                  {tier.discountPercent}% off
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addPricingTier}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Pricing Tier
        </Button>

        {errors.tieredPricing && (
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errors.tieredPricing}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Add-ons & Customization</h2>
        <p className="text-muted-foreground mt-2">
          Offer additional services to customers
        </p>
      </div>

      <div className="space-y-4">
        {formData.addOns.map((addOn, index) => (
          <Card key={addOn.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Add-on {index + 1}</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeAddOn(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Add-on Name</Label>
                <Input
                  value={addOn.name}
                  onChange={(e) => updateAddOn(index, { name: e.target.value })}
                  placeholder="e.g., Premium Gift Wrapping"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={addOn.description || ''}
                  onChange={(e) => updateAddOn(index, { description: e.target.value })}
                  placeholder="Describe what this add-on includes..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (in paise)</Label>
                  <Input
                    type="number"
                    value={addOn.price}
                    onChange={(e) => updateAddOn(index, { 
                      price: parseInt(e.target.value) || 0 
                    })}
                    min="0"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    ₹{(addOn.price / 100).toLocaleString('en-IN')}
                  </p>
                </div>
                
                <div>
                  <Label>Type</Label>
                  <select
                    value={addOn.type}
                    onChange={(e) => updateAddOn(index, { 
                      type: e.target.value as 'standard' | 'bulk' 
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="standard">Standard (all orders)</option>
                    <option value="bulk">Bulk (minimum order required)</option>
                  </select>
                </div>
              </div>
              
              {addOn.type === 'bulk' && (
                <div>
                  <Label>Minimum Order Quantity</Label>
                  <Input
                    type="number"
                    value={addOn.minimumOrder || ''}
                    onChange={(e) => updateAddOn(index, { 
                      minimumOrder: parseInt(e.target.value) || undefined 
                    })}
                    min="1"
                    placeholder="e.g., 50"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={addOn.requiresPreview}
                    onChange={(e) => updateAddOn(index, { 
                      requiresPreview: e.target.checked 
                    })}
                  />
                  <span className="text-sm">Requires preview for bulk orders</span>
                </label>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addAddOn}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customization Option
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Inventory & Delivery</h2>
        <p className="text-muted-foreground mt-2">
          Set up stock and delivery options
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Management</CardTitle>
            <CardDescription>
              Choose how you want to manage inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="stockType"
                  checked={!formData.isMadeToOrder}
                  onChange={() => updateFormData({ isMadeToOrder: false })}
                />
                <span>Track stock quantity</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="stockType"
                  checked={formData.isMadeToOrder}
                  onChange={() => updateFormData({ isMadeToOrder: true })}
                />
                <span>Made-to-order (no stock tracking)</span>
              </label>
            </div>
            
            {!formData.isMadeToOrder && (
              <div>
                <Label htmlFor="stockAvailable">Available Stock</Label>
                <Input
                  id="stockAvailable"
                  type="number"
                  value={formData.stockAvailable}
                  onChange={(e) => updateFormData({ 
                    stockAvailable: parseInt(e.target.value) || 0 
                  })}
                  min="0"
                  className={errors.stockAvailable ? 'border-destructive' : ''}
                />
                {errors.stockAvailable && (
                  <p className="text-sm text-destructive mt-1">{errors.stockAvailable}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Time Tiers</CardTitle>
            <CardDescription>
              Set delivery times based on quantity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.deliveryTimeTiers.map((tier, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Quantity</Label>
                    <Input
                      type="number"
                      value={tier.minQty}
                      onChange={(e) => updateDeliveryTimeTier(index, { 
                        minQty: parseInt(e.target.value) || 0 
                      })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Max Quantity (optional)</Label>
                    <Input
                      type="number"
                      value={tier.maxQty || ''}
                      onChange={(e) => updateDeliveryTimeTier(index, { 
                        maxQty: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      min="1"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label>Delivery Time</Label>
                  <Input
                    value={tier.deliveryDays}
                    onChange={(e) => updateDeliveryTimeTier(index, { 
                      deliveryDays: e.target.value 
                    })}
                    placeholder="e.g., 2-3 days"
                  />
                </div>
                {formData.deliveryTimeTiers.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeDeliveryTimeTier(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addDeliveryTimeTier}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery Time Tier
            </Button>
            
            {errors.deliveryTimeTiers && (
              <p className="text-sm text-destructive">{errors.deliveryTimeTiers}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Customization Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure personalization and preview options
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personalization Options</CardTitle>
            <CardDescription>
              Allow customers to customize their orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isCustomizable}
                  onChange={(e) => updateFormData({ isCustomizable: e.target.checked })}
                />
                <span>Allow personalization (custom messages, names, etc.)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.previewRequired}
                  onChange={(e) => updateFormData({ previewRequired: e.target.checked })}
                />
                <span>Require preview approval for customized orders</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview Workflow</CardTitle>
            <CardDescription>
              How customers will approve customized orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Preview Workflow:</strong>
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Customer places order with customization</li>
                    <li>2. You create a preview/mockup</li>
                    <li>3. Customer approves or requests changes</li>
                    <li>4. Once approved, order cannot be cancelled</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Create New Product</h1>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Listing Type</span>
          <span>Details</span>
          <span>Pricing</span>
          <span>Add-ons</span>
          <span>Inventory</span>
          <span>Customization</span>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex space-x-4">
          {currentStep < totalSteps ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}