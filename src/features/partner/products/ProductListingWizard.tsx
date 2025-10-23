/**
 * Product Listing Wizard - Swiggy/Zomato Pattern
 * Multi-step product creation with B2C friendly language
 * Mobile-first design with auto-saving drafts
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Upload, 
  Check,
  AlertCircle,
  Info,
  Package,
  Gift,
  Settings,
  Save,
  Eye
} from 'lucide-react';
import { ListingType, PricingTier, ProductAddOn } from '@/types/tiered-pricing';
import { calculateTieredPrice, validatePricingTiers, formatPrice, rupeesToPaise } from '@/lib/pricing/tieredPricing';

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
  addOns: ProductAddOn[];
  
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
    example: 'Boat Airdopes 131 - Premium Gift Packed',
    icon: Package
  },
  {
    value: 'hamper' as ListingType,
    title: 'Hamper/Combo',
    description: 'Multiple items bundled together as a gift set',
    example: 'Premium Tech Hamper with speaker, power bank, and accessories',
    icon: Gift
  },
  {
    value: 'service' as ListingType,
    title: 'Service Only',
    description: 'Gift wrapping, customization, or other services',
    example: 'Premium Gift Wrapping Service',
    icon: Settings
  }
];

interface ProductListingWizardProps {
  product?: ProductFormData;
  onSuccess: (product: ProductFormData) => void;
  onCancel: () => void;
}

export const ProductListingWizard: React.FC<ProductListingWizardProps> = ({
  product,
  onSuccess,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(product || initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  const totalSteps = 6;

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  const saveDraft = () => {
    try {
      localStorage.setItem('productDraft', JSON.stringify(formData));
      setIsDraftSaved(true);
      setTimeout(() => setIsDraftSaved(false), 2000);
    } catch (error) {
      // Handle error silently in production
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('productDraft');
      if (draft) {
        setFormData(JSON.parse(draft));
      }
    } catch (error) {
      // Handle error silently in production
    }
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
          newErrors.description = 'Description is required';
        }
        if (!formData.category) {
          newErrors.category = 'Category is required';
        }
        if (formData.images.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;
      case 3:
        if (formData.tieredPricing.length === 0) {
          newErrors.tieredPricing = 'At least one pricing tier is required';
        }
        const pricingErrors = validatePricingTiers(formData.tieredPricing);
        if (pricingErrors.length > 0) {
          newErrors.tieredPricing = pricingErrors.join(', ');
        }
        break;
      case 4:
        // Add-ons are optional, no validation needed
        break;
      case 5:
        if (!formData.isMadeToOrder && formData.stockAvailable < 0) {
          newErrors.stockAvailable = 'Stock must be 0 or greater';
        }
        break;
      case 6:
        // Customization settings are optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSuccess(formData);
      // Clear draft after successful submission
      localStorage.removeItem('productDraft');
    }
  };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addPricingTier = () => {
    const newTier: PricingTier = {
      minQty: 1,
      maxQty: null,
      pricePerItem: 0,
      discountPercent: 0
    };
    updateFormData({
      tieredPricing: [...formData.tieredPricing, newTier]
    });
  };

  const removePricingTier = (index: number) => {
    if (formData.tieredPricing.length > 1) {
      const newTiers = formData.tieredPricing.filter((_, i) => i !== index);
      updateFormData({ tieredPricing: newTiers });
    }
  };

  const updatePricingTier = (index: number, updates: Partial<PricingTier>) => {
    const newTiers = formData.tieredPricing.map((tier, i) => 
      i === index ? { ...tier, ...updates } : tier
    );
    updateFormData({ tieredPricing: newTiers });
  };

  const addAddOn = () => {
    const newAddOn: ProductAddOn = {
      id: Date.now().toString(),
      productId: '',
      name: '',
      description: '',
      pricePaise: 0,
      minimumOrderQuantity: 1,
      requiresProof: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    updateFormData({
      addOns: [...formData.addOns, newAddOn]
    });
  };

  const removeAddOn = (index: number) => {
    const newAddOns = formData.addOns.filter((_, i) => i !== index);
    updateFormData({ addOns: newAddOns });
  };

  const updateAddOn = (index: number, updates: Partial<ProductAddOn>) => {
    const newAddOns = formData.addOns.map((addOn, i) => 
      i === index ? { ...addOn, ...updates } : addOn
    );
    updateFormData({ addOns: newAddOns });
  };

  const addDeliveryTimeTier = () => {
    const newTier = {
      minQty: 1,
      maxQty: null,
      deliveryDays: '2-3 days'
    };
    updateFormData({
      deliveryTimeTiers: [...formData.deliveryTimeTiers, newTier]
    });
  };

  const removeDeliveryTimeTier = (index: number) => {
    if (formData.deliveryTimeTiers.length > 1) {
      const newTiers = formData.deliveryTimeTiers.filter((_, i) => i !== index);
      updateFormData({ deliveryTimeTiers: newTiers });
    }
  };

  const updateDeliveryTimeTier = (index: number, updates: Partial<typeof formData.deliveryTimeTiers[0]>) => {
    const newTiers = formData.deliveryTimeTiers.map((tier, i) => 
      i === index ? { ...tier, ...updates } : tier
    );
    updateFormData({ deliveryTimeTiers: newTiers });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Your Listing Type</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select how you want to list your product on Wyshkit
        </p>
      </div>

      <div className="grid gap-4">
        {listingTypeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card 
              key={option.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                formData.listingType === option.value 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => updateFormData({ listingType: option.value })}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{option.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {option.description}
                    </p>
                    <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                      Example: {option.example}
                    </div>
                  </div>
                  {formData.listingType === option.value && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {errors.listingType && (
        <p className="text-sm text-destructive">{errors.listingType}</p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Product Details</h3>
        <p className="text-sm text-muted-foreground mb-6">
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
            placeholder="Describe what's included and why customers will love it..."
            rows={4}
            className={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => updateFormData({ category: value })}
          >
            <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <Label>What's Included</Label>
          <div className="space-y-2">
            {formData.whatsIncluded.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newItems = [...formData.whatsIncluded];
                    newItems[index] = e.target.value;
                    updateFormData({ whatsIncluded: newItems });
                  }}
                  placeholder="e.g., Premium gift box, Greeting card"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newItems = formData.whatsIncluded.filter((_, i) => i !== index);
                    updateFormData({ whatsIncluded: newItems });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => updateFormData({ whatsIncluded: [...formData.whatsIncluded, ''] })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        <div>
          <Label>Product Images *</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Upload product images (drag & drop or click to browse)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: 800x600px, JPG/PNG format
            </p>
          </div>
          {errors.images && (
            <p className="text-sm text-destructive mt-1">{errors.images}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Pricing Tiers</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set different prices based on quantity ordered
        </p>
      </div>

      <div className="space-y-4">
        {formData.tieredPricing.map((tier, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Tier {index + 1}</h4>
                {formData.tieredPricing.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePricingTier(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Minimum Quantity</Label>
                  <Input
                    type="number"
                    value={tier.minQty}
                    onChange={(e) => updatePricingTier(index, { 
                      minQty: parseInt(e.target.value) || 1 
                    })}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Maximum Quantity</Label>
                  <Input
                    type="number"
                    value={tier.maxQty || ''}
                    onChange={(e) => updatePricingTier(index, { 
                      maxQty: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="No limit"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Price per Item (₹)</Label>
                  <Input
                    type="number"
                    value={tier.pricePerItem / 100}
                    onChange={(e) => updatePricingTier(index, { 
                      pricePerItem: (parseFloat(e.target.value) || 0) * 100 
                    })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={tier.discountPercent}
                    onChange={(e) => updatePricingTier(index, { 
                      discountPercent: parseFloat(e.target.value) || 0 
                    })}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addPricingTier}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pricing Tier
        </Button>

        {errors.tieredPricing && (
          <p className="text-sm text-destructive">{errors.tieredPricing}</p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add-ons & Customization</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Offer additional services like gift wrapping, personalization, or corporate branding
        </p>
      </div>

      <div className="space-y-4">
        {formData.addOns.map((addOn, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Add-on {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAddOn(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Add-on Name</Label>
                  <Input
                    value={addOn.name}
                    onChange={(e) => updateAddOn(index, { name: e.target.value })}
                    placeholder="e.g., Premium Gift Wrapping"
                  />
                </div>
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={addOn.pricePaise / 100}
                    onChange={(e) => updateAddOn(index, { 
                      pricePaise: (parseFloat(e.target.value) || 0) * 100 
                    })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label>Minimum Order Quantity</Label>
                  <Input
                    type="number"
                    value={addOn.minimumOrderQuantity}
                    onChange={(e) => updateAddOn(index, { 
                      minimumOrderQuantity: parseInt(e.target.value) || 1 
                    })}
                    min="1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={addOn.requiresProof}
                    onCheckedChange={(checked) => updateAddOn(index, { requiresProof: checked })}
                  />
                  <Label>Requires customer upload (logo, message, etc.)</Label>
                </div>
              </div>

              <div className="mt-4">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={addOn.description || ''}
                  onChange={(e) => updateAddOn(index, { description: e.target.value })}
                  placeholder="Describe what this add-on includes..."
                  rows={2}
                />
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
          <Plus className="h-4 w-4 mr-2" />
          Add Customization Option
        </Button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Inventory & Delivery</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set up stock tracking and delivery times
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isMadeToOrder}
            onCheckedChange={(checked) => updateFormData({ isMadeToOrder: checked })}
          />
          <Label>Made-to-order (no stock tracking)</Label>
        </div>

        {!formData.isMadeToOrder && (
          <div>
            <Label htmlFor="stock">Available Stock</Label>
            <Input
              id="stock"
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

        <div>
          <Label>Delivery Time by Quantity</Label>
          <div className="space-y-4">
            {formData.deliveryTimeTiers.map((tier, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Delivery Tier {index + 1}</h4>
                    {formData.deliveryTimeTiers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDeliveryTimeTier(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Min Quantity</Label>
                      <Input
                        type="number"
                        value={tier.minQty}
                        onChange={(e) => updateDeliveryTimeTier(index, { 
                          minQty: parseInt(e.target.value) || 1 
                        })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Max Quantity</Label>
                      <Input
                        type="number"
                        value={tier.maxQty || ''}
                        onChange={(e) => updateDeliveryTimeTier(index, { 
                          maxQty: e.target.value ? parseInt(e.target.value) : null 
                        })}
                        placeholder="No limit"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Delivery Time</Label>
                      <Input
                        value={tier.deliveryDays}
                        onChange={(e) => updateDeliveryTimeTier(index, { 
                          deliveryDays: e.target.value 
                        })}
                        placeholder="e.g., 2-3 days"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addDeliveryTimeTier}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Delivery Tier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Customization Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure how customers can customize their orders
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isCustomizable}
            onCheckedChange={(checked) => updateFormData({ isCustomizable: checked })}
          />
          <Label>Allow customization (personalization, branding, etc.)</Label>
        </div>

        {formData.isCustomizable && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.previewRequired}
              onCheckedChange={(checked) => updateFormData({ previewRequired: checked })}
            />
            <Label>Require preview approval for bulk orders (50+ items)</Label>
          </div>
        )}

        {formData.previewRequired && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Preview Workflow</p>
                <p className="text-sm text-blue-700">
                  For orders with 50+ items, customers will see a preview before you start production. 
                  This helps avoid costly mistakes with large orders.
                </p>
              </div>
            </div>
          </div>
        )}
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
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Create Product Listing</h2>
            <p className="text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDraftSaved && (
              <Badge variant="secondary" className="text-green-600">
                <Save className="h-3 w-3 mr-1" />
                Draft Saved
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={saveDraft}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleNext}
            disabled={Object.keys(errors).length > 0}
          >
            {currentStep === totalSteps ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Listing
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductListingWizard;
