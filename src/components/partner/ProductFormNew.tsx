import React, { useState } from 'react';
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
  Settings
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
    description: 'Pure service like gift wrapping, customization, etc.',
    example: 'Gift Wrapping Service - Premium Package',
    icon: Settings
  }
];

interface ProductFormProps {
  product?: Partial<ProductFormData>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductFormNew({ product, onSuccess, onCancel }: ProductFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>({
    ...initialFormData,
    ...product
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 6;

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
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
    const newAddOn: ProductAddOn = {
      id: `addon-${Date.now()}`,
      productId: '',
      name: '',
      pricePaise: 0,
      minimumOrderQuantity: 1,
      requiresProof: false,
      description: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateFormData({
      addOns: [...formData.addOns, newAddOn]
    });
  };

  const updateAddOn = (index: number, updates: Partial<ProductAddOn>) => {
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

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        // Here you would save to Supabase
        console.log('Saving product:', formData);
        onSuccess();
      } catch (error) {
        console.error('Error saving product:', error);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose Listing Type</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select the type of listing that best describes your product or service.
        </p>
      </div>

      <div className="grid gap-4">
        {listingTypeOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card 
              key={option.value}
              className={`cursor-pointer transition-all ${
                formData.listingType === option.value 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => updateFormData({ listingType: option.value })}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    formData.listingType === option.value 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{option.title}</h4>
                    <p className="text-gray-600 mb-3">{option.description}</p>
                    <p className="text-sm text-gray-500 italic">Example: {option.example}</p>
                  </div>
                  {formData.listingType === option.value && (
                    <Check className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {errors.listingType && (
        <p className="text-red-500 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors.listingType}
        </p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Details</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide essential information about your {formData.listingType} listing.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Product/Service Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Enter product or service name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => updateFormData({ category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
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
            <p className="text-red-500 text-sm">{errors.category}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe your product or service in detail"
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>What's Included</Label>
          <div className="space-y-2">
            {formData.whatsIncluded.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateWhatsIncluded(index, e.target.value)}
                  placeholder="Item included in this listing"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWhatsIncluded(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addWhatsIncluded}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          {errors.whatsIncluded && (
            <p className="text-red-500 text-sm">{errors.whatsIncluded}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tiered Pricing</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set up quantity-based pricing tiers. Customers will automatically get the best price for their order size.
        </p>
      </div>

      <div className="space-y-4">
        {formData.tieredPricing.map((tier, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label>Min Quantity</Label>
                <Input
                  type="number"
                  value={tier.minQty}
                  onChange={(e) => updatePricingTier(index, { minQty: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Max Quantity</Label>
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
              
              <div className="grid gap-2">
                <Label>Price per Item (₹)</Label>
                <Input
                  type="number"
                  value={Math.round(tier.pricePerItem / 100)}
                  onChange={(e) => updatePricingTier(index, { 
                    pricePerItem: rupeesToPaise(parseFloat(e.target.value) || 0) 
                  })}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Discount %</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={tier.discountPercent}
                    readOnly
                    className="bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePricingTier(index)}
                    disabled={formData.tieredPricing.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
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
          <p className="text-red-500 text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.tieredPricing}
          </p>
        )}
      </div>

      {/* Pricing Preview */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-semibold mb-3">Pricing Preview</h4>
        <div className="space-y-2 text-sm">
          {formData.tieredPricing.map((tier, index) => (
            <div key={index} className="flex justify-between">
              <span>
                {tier.minQty}-{tier.maxQty || '∞'} items:
              </span>
              <span className="font-medium">
                ₹{Math.round(tier.pricePerItem / 100)}
                {tier.discountPercent > 0 && (
                  <span className="text-green-600 ml-1">
                    ({tier.discountPercent}% off)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add-ons & Customization</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure optional add-ons with minimum order quantity requirements.
        </p>
      </div>

      <div className="space-y-4">
        {formData.addOns.map((addOn, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Add-on Name</Label>
                <Input
                  value={addOn.name}
                  onChange={(e) => updateAddOn(index, { name: e.target.value })}
                  placeholder="e.g., Gift Wrapping, Personal Message"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={Math.round(addOn.pricePaise / 100)}
                  onChange={(e) => updateAddOn(index, { 
                    pricePaise: rupeesToPaise(parseFloat(e.target.value) || 0) 
                  })}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Minimum Order Quantity</Label>
                <Input
                  type="number"
                  value={addOn.minimumOrderQuantity}
                  onChange={(e) => updateAddOn(index, { 
                    minimumOrderQuantity: parseInt(e.target.value) || 1 
                  })}
                  min="1"
                  placeholder="e.g., 1 for all orders, 50 for bulk"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAddOn(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid gap-2 mt-4">
              <Label>Description (Optional)</Label>
              <Textarea
                value={addOn.description || ''}
                onChange={(e) => updateAddOn(index, { description: e.target.value })}
                placeholder="Describe what this add-on includes"
                rows={2}
              />
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={addOn.requiresProof}
                  onCheckedChange={(checked) => updateAddOn(index, { requiresProof: checked })}
                />
                <Label className="text-sm">Customer needs to upload files (e.g., logo for branding)</Label>
              </div>
            </div>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addAddOn}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Add-on
        </Button>
      </div>

        <Card className="p-4 bg-blue-50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Add-on Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• Set minimum order quantity to control when add-ons become available</li>
              <li>• Use "Upload files" for customization that needs customer input</li>
              <li>• Standard add-ons (gift wrapping, cards) can have minimum order of 1</li>
              <li>• Corporate branding add-ons typically have minimum order of 50+</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Inventory & Fulfillment</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure stock management and delivery timeframes.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.isMadeToOrder}
              onCheckedChange={(checked) => updateFormData({ isMadeToOrder: checked })}
            />
            <div>
              <Label className="text-base">Made-to-Order</Label>
              <p className="text-sm text-gray-600">
                Enable this if you create products after receiving orders
              </p>
            </div>
          </div>
        </Card>

        {!formData.isMadeToOrder && (
          <div className="grid gap-2">
            <Label htmlFor="stock">Stock Available</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stockAvailable}
              onChange={(e) => updateFormData({ stockAvailable: parseInt(e.target.value) || 0 })}
              min="0"
              placeholder="Enter stock quantity"
            />
            {errors.stockAvailable && (
              <p className="text-red-500 text-sm">{errors.stockAvailable}</p>
            )}
          </div>
        )}

        <div className="grid gap-2">
          <Label>Delivery Time by Order Size</Label>
          <div className="space-y-2">
            {formData.deliveryTimeTiers.map((tier, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="number"
                  value={tier.minQty}
                  onChange={(e) => updateDeliveryTimeTier(index, { 
                    minQty: parseInt(e.target.value) || 0 
                  })}
                  placeholder="Min items"
                  className="w-24"
                />
                <Input
                  type="number"
                  value={tier.maxQty || ''}
                  onChange={(e) => updateDeliveryTimeTier(index, { 
                    maxQty: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Max items"
                  className="w-24"
                />
                <Input
                  value={tier.deliveryDays}
                  onChange={(e) => updateDeliveryTimeTier(index, { 
                    deliveryDays: e.target.value 
                  })}
                  placeholder="e.g., 2-3 days"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeDeliveryTimeTier(index)}
                  disabled={formData.deliveryTimeTiers.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDeliveryTimeTier}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Delivery Time for Different Order Sizes
            </Button>
          </div>
          {errors.deliveryTimeTiers && (
            <p className="text-red-500 text-sm">{errors.deliveryTimeTiers}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Customization Settings</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure customization options and preview requirements.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.isCustomizable}
              onCheckedChange={(checked) => updateFormData({ isCustomizable: checked })}
            />
            <div>
              <Label className="text-base">Allow Customization</Label>
              <p className="text-sm text-gray-600">
                Enable customers to customize this product (branding, personalization, etc.)
              </p>
            </div>
          </div>
        </Card>

        {formData.isCustomizable && (
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Switch
                checked={formData.previewRequired}
                onCheckedChange={(checked) => updateFormData({ previewRequired: checked })}
              />
              <div>
                <Label className="text-base">Require Preview Approval</Label>
                <p className="text-sm text-gray-600">
                  Customer must approve a preview before production begins
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="space-y-1 text-xs">
                <li>• Customized orders cannot be cancelled once preview is approved</li>
                <li>• Non-customized items can be returned within 7 days</li>
                <li>• Preview approval workflow helps prevent disputes</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        <p className="text-gray-600">
          Step {currentStep} of {totalSteps}: Create your {formData.listingType} listing
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i + 1}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-8">
        <CardContent className="p-8">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : prevStep}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        <Button
          onClick={currentStep === totalSteps ? handleSubmit : nextStep}
          disabled={currentStep === totalSteps && !validateStep(currentStep)}
        >
          {currentStep === totalSteps ? 'Save Product' : 'Next'}
          {currentStep < totalSteps && <ChevronRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
