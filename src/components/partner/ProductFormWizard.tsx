/**
 * Partner ProductForm Wizard - 6-Step Listing Creation
 * Swiggy/Zomato-style product listing with B2C-friendly language
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Upload, Eye, Trash2, Save, ArrowRight, ArrowLeft } from 'lucide-react';
import { ListingType, PricingTier, AddOn } from '@/types/product';
import { createDefaultPricingTiers } from '@/lib/pricing/tieredPricing';

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
  standardAddOns: AddOn[];
  bulkAddOns: AddOn[];
  
  // Step 5: Inventory & Fulfillment
  stockTracking: boolean;
  stockAvailable: number;
  deliveryTimeTiers: Array<{
    minQty: number;
    maxQty: number | null;
    deliveryDays: string;
  }>;
  
  // Step 6: Customization
  isCustomizable: boolean;
  previewRequired: boolean;
  corporateBrandingMOQ: number;
}

const initialFormData: ProductFormData = {
  listingType: 'individual',
  name: '',
  description: '',
  category: '',
  images: [],
  whatsIncluded: [],
  tieredPricing: createDefaultPricingTiers(5000),
  standardAddOns: [],
  bulkAddOns: [],
  stockTracking: true,
  stockAvailable: 0,
  deliveryTimeTiers: [
    { minQty: 1, maxQty: 9, deliveryDays: 'Same day / Next day' },
    { minQty: 10, maxQty: 49, deliveryDays: '2-3 days' },
    { minQty: 50, maxQty: null, deliveryDays: '5-7 days' }
  ],
  isCustomizable: false,
  previewRequired: false,
  corporateBrandingMOQ: 50
};

export const ProductFormWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: 'Listing Type', description: 'Choose how you want to list your product' },
    { number: 2, title: 'Basic Details', description: 'Product information and photos' },
    { number: 3, title: 'Pricing', description: 'Set quantity-based pricing tiers' },
    { number: 4, title: 'Add-ons', description: 'Configure optional extras' },
    { number: 5, title: 'Delivery', description: 'Inventory and fulfillment settings' },
    { number: 6, title: 'Customization', description: 'Personalization options' }
  ];

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Submit to backend
      console.log('Submitting product:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Product created successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1ListingType formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2BasicDetails formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Pricing formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4AddOns formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <Step5Inventory formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <Step6Customization formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Create New Product Listing</h1>
          <Badge variant="outline">Step {currentStep} of 6</Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between mt-4">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-medium ${
                step.number <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.number}
              </div>
              <div className="text-xs">
                <div className="font-medium">{step.title}</div>
                <div className="text-gray-500">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        
        {currentStep < 6 ? (
          <Button
            onClick={nextStep}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        )}
      </div>
    </div>
  );
};

// Step 1: Listing Type Selection
const Step1ListingType: React.FC<{
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}> = ({ formData, updateFormData }) => {
  const listingTypes = [
    {
      value: 'individual',
      title: 'Individual Product',
      description: 'Single item with gifting service (wrapping, card, packaging)',
      example: 'Boat Airdopes 131 - Premium Gift Packed'
    },
    {
      value: 'hamper',
      title: 'Hamper/Combo',
      description: 'Multiple items bundled together as a gift package',
      example: 'Premium Tech Hamper with speaker, power bank, and accessories'
    },
    {
      value: 'service',
      title: 'Service Only',
      description: 'Pure service like gift wrapping, customization, or consultation',
      example: 'Gift Wrapping Service - you provide the item, we wrap it'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">How do you want to list your product?</h3>
        <p className="text-gray-600">Choose the type that best describes what you're offering</p>
      </div>

      <RadioGroup
        value={formData.listingType}
        onValueChange={(value: ListingType) => updateFormData({ listingType: value })}
        className="space-y-4"
      >
        {listingTypes.map((type) => (
          <div key={type.value} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={type.value} className="text-lg font-medium cursor-pointer">
                  {type.title}
                </Label>
                <p className="text-gray-600 mt-1">{type.description}</p>
                <p className="text-sm text-blue-600 mt-2 font-medium">Example: {type.example}</p>
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

// Step 2: Basic Details
const Step2BasicDetails: React.FC<{
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}> = ({ formData, updateFormData }) => {
  const [newWhatsIncluded, setNewWhatsIncluded] = useState('');

  const addWhatsIncluded = () => {
    if (newWhatsIncluded.trim()) {
      updateFormData({
        whatsIncluded: [...formData.whatsIncluded, newWhatsIncluded.trim()]
      });
      setNewWhatsIncluded('');
    }
  };

  const removeWhatsIncluded = (index: number) => {
    updateFormData({
      whatsIncluded: formData.whatsIncluded.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., Premium Tech Hamper"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => updateFormData({ category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="gourmet">Gourmet</SelectItem>
              <SelectItem value="wellness">Wellness</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe your product, what makes it special, and why customers should choose it..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>What's Included</Label>
        <p className="text-sm text-gray-600">List all items that come with this product</p>
        
        <div className="space-y-2">
          {formData.whatsIncluded.map((item, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <span className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                {item}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeWhatsIncluded(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newWhatsIncluded}
            onChange={(e) => setNewWhatsIncluded(e.target.value)}
            placeholder="Add an item (e.g., Premium gift box)"
            onKeyPress={(e) => e.key === 'Enter' && addWhatsIncluded()}
          />
          <Button onClick={addWhatsIncluded} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Product Photos</Label>
        <p className="text-sm text-gray-600">Upload high-quality images (5+ recommended)</p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">Click to upload photos or drag and drop</p>
          <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
        </div>
      </div>
    </div>
  );
};

// Step 3: Tiered Pricing
const Step3Pricing: React.FC<{
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}> = ({ formData, updateFormData }) => {
  const updatePricingTier = (index: number, updates: Partial<PricingTier>) => {
    const newTiers = [...formData.tieredPricing];
    newTiers[index] = { ...newTiers[index], ...updates };
    updateFormData({ tieredPricing: newTiers });
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Set Your Pricing Tiers</h3>
        <p className="text-gray-600">Offer better prices for larger quantities - just like Swiggy and Zomato!</p>
      </div>

      <div className="space-y-4">
        {formData.tieredPricing.map((tier, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Minimum Quantity</Label>
                <Input
                  type="number"
                  value={tier.minQty}
                  onChange={(e) => updatePricingTier(index, { minQty: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Maximum Quantity</Label>
                <Input
                  type="number"
                  value={tier.maxQty || ''}
                  onChange={(e) => updatePricingTier(index, { 
                    maxQty: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Price per Item (₹)</Label>
                <Input
                  type="number"
                  value={tier.pricePerItem / 100}
                  onChange={(e) => updatePricingTier(index, { 
                    pricePerItem: Math.round((parseFloat(e.target.value) || 0) * 100) 
                  })}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={tier.discountPercent}
                    onChange={(e) => updatePricingTier(index, { 
                      discountPercent: parseInt(e.target.value) || 0 
                    })}
                    min="0"
                    max="100"
                  />
                </div>
                {formData.tieredPricing.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePricingTier(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Preview:</strong> {tier.minQty}
                {tier.maxQty ? `-${tier.maxQty}` : '+'} items: ₹{tier.pricePerItem / 100} per item
                {tier.discountPercent > 0 && ` (${tier.discountPercent}% off)`}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Button onClick={addPricingTier} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Another Pricing Tier
      </Button>
    </div>
  );
};

// Step 4: Add-ons Configuration
const Step4AddOns: React.FC<{
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}> = ({ formData, updateFormData }) => {
  const addStandardAddOn = () => {
    const newAddOn: AddOn = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      type: 'standard'
    };
    updateFormData({
      standardAddOns: [...formData.standardAddOns, newAddOn]
    });
  };

  const addBulkAddOn = () => {
    const newAddOn: AddOn = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      type: 'bulk',
      minimumOrder: 50,
      requiresPreview: false
    };
    updateFormData({
      bulkAddOns: [...formData.bulkAddOns, newAddOn]
    });
  };

  const updateStandardAddOn = (index: number, updates: Partial<AddOn>) => {
    const newAddOns = [...formData.standardAddOns];
    newAddOns[index] = { ...newAddOns[index], ...updates };
    updateFormData({ standardAddOns: newAddOns });
  };

  const updateBulkAddOn = (index: number, updates: Partial<AddOn>) => {
    const newAddOns = [...formData.bulkAddOns];
    newAddOns[index] = { ...newAddOns[index], ...updates };
    updateFormData({ bulkAddOns: newAddOns });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Configure Add-ons</h3>
        <p className="text-gray-600">Let customers customize their orders with optional extras</p>
      </div>

      {/* Standard Add-ons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">Standard Add-ons</h4>
          <Badge variant="secondary">Available for all orders</Badge>
        </div>
        
        <div className="space-y-4">
          {formData.standardAddOns.map((addOn, index) => (
            <Card key={addOn.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Add-on Name</Label>
                  <Input
                    value={addOn.name}
                    onChange={(e) => updateStandardAddOn(index, { name: e.target.value })}
                    placeholder="e.g., Premium Gift Wrapping"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={addOn.price / 100}
                    onChange={(e) => updateStandardAddOn(index, { 
                      price: Math.round((parseFloat(e.target.value) || 0) * 100) 
                    })}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newAddOns = formData.standardAddOns.filter((_, i) => i !== index);
                      updateFormData({ standardAddOns: newAddOns });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-3">
                <Label>Description (Optional)</Label>
                <Input
                  value={addOn.description || ''}
                  onChange={(e) => updateStandardAddOn(index, { description: e.target.value })}
                  placeholder="Describe what this add-on includes..."
                />
              </div>
            </Card>
          ))}
        </div>

        <Button onClick={addStandardAddOn} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Standard Add-on
        </Button>
      </div>

      <Separator />

      {/* Bulk Add-ons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium">Bulk Add-ons</h4>
          <Badge variant="secondary">Available for larger orders</Badge>
        </div>
        
        <div className="space-y-4">
          {formData.bulkAddOns.map((addOn, index) => (
            <Card key={addOn.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Add-on Name</Label>
                  <Input
                    value={addOn.name}
                    onChange={(e) => updateBulkAddOn(index, { name: e.target.value })}
                    placeholder="e.g., Company Branding"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={addOn.price / 100}
                    onChange={(e) => updateBulkAddOn(index, { 
                      price: Math.round((parseFloat(e.target.value) || 0) * 100) 
                    })}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Minimum Order</Label>
                  <Input
                    type="number"
                    value={addOn.minimumOrder || 50}
                    onChange={(e) => updateBulkAddOn(index, { 
                      minimumOrder: parseInt(e.target.value) || 50 
                    })}
                    min="1"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newAddOns = formData.bulkAddOns.filter((_, i) => i !== index);
                      updateFormData({ bulkAddOns: newAddOns });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 space-y-3">
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={addOn.description || ''}
                    onChange={(e) => updateBulkAddOn(index, { description: e.target.value })}
                    placeholder="Describe what this add-on includes..."
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`preview-${index}`}
                      checked={addOn.requiresPreview || false}
                      onCheckedChange={(checked) => updateBulkAddOn(index, { 
                        requiresPreview: checked as boolean 
                      })}
                    />
                    <Label htmlFor={`preview-${index}`} className="text-sm">
                      Requires preview before production
                    </Label>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button onClick={addBulkAddOn} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Bulk Add-on
        </Button>
      </div>
    </div>
  );
};

// Step 5: Inventory & Fulfillment
const Step5Inventory: React.FC<{
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}> = ({ formData, updateFormData }) => {
  const updateDeliveryTimeTier = (index: number, updates: Partial<{
    minQty: number;
    maxQty: number | null;
    deliveryDays: string;
  }>) => {
    const newTiers = [...formData.deliveryTimeTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    updateFormData({ deliveryTimeTiers: newTiers });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Inventory & Delivery Settings</h3>
        <p className="text-gray-600">Configure how you manage stock and delivery times</p>
      </div>

      {/* Stock Management */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Stock Management</h4>
              <p className="text-sm text-gray-600">How do you want to handle inventory?</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stock-tracking"
                checked={formData.stockTracking}
                onCheckedChange={(checked) => updateFormData({ 
                  stockTracking: checked as boolean 
                })}
              />
              <Label htmlFor="stock-tracking">Track stock levels</Label>
            </div>
          </div>

          {formData.stockTracking && (
            <div className="space-y-2">
              <Label htmlFor="stock-available">Available Stock</Label>
              <Input
                id="stock-available"
                type="number"
                value={formData.stockAvailable}
                onChange={(e) => updateFormData({ 
                  stockAvailable: parseInt(e.target.value) || 0 
                })}
                min="0"
                placeholder="Enter available quantity"
              />
            </div>
          )}

          {!formData.stockTracking && (
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                <strong>Made-to-order:</strong> You'll create products when orders come in. 
                No need to track stock levels.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Delivery Time Tiers */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Delivery Time by Quantity</h4>
            <p className="text-sm text-gray-600">Set different delivery times for different order sizes</p>
          </div>

          <div className="space-y-4">
            {formData.deliveryTimeTiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border rounded">
                <div className="space-y-2">
                  <Label>Minimum Quantity</Label>
                  <Input
                    type="number"
                    value={tier.minQty}
                    onChange={(e) => updateDeliveryTimeTier(index, { 
                      minQty: parseInt(e.target.value) || 1 
                    })}
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Maximum Quantity</Label>
                  <Input
                    type="number"
                    value={tier.maxQty || ''}
                    onChange={(e) => updateDeliveryTimeTier(index, { 
                      maxQty: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                
                <div className="space-y-2">
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
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

// Step 6: Customization Settings
const Step6Customization: React.FC<{
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
}> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Customization Options</h3>
        <p className="text-gray-600">Configure personalization and corporate branding options</p>
      </div>

      {/* Personalization */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Personalization</h4>
              <p className="text-sm text-gray-600">Allow customers to add personal touches</p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-customizable"
                checked={formData.isCustomizable}
                onCheckedChange={(checked) => updateFormData({ 
                  isCustomizable: checked as boolean 
                })}
              />
              <Label htmlFor="is-customizable">Enable personalization</Label>
            </div>
          </div>

          {formData.isCustomizable && (
            <div className="p-3 bg-green-50 rounded">
              <p className="text-sm text-green-800">
                <strong>Personalization enabled:</strong> Customers can add custom messages, 
                names, or other personal touches to their orders.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Corporate Branding */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Corporate Branding</h4>
            <p className="text-sm text-gray-600">Allow companies to add their branding to bulk orders</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="corporate-moq">Minimum Order for Branding</Label>
                <Input
                  id="corporate-moq"
                  type="number"
                  value={formData.corporateBrandingMOQ}
                  onChange={(e) => updateFormData({ 
                    corporateBrandingMOQ: parseInt(e.target.value) || 50 
                  })}
                  min="1"
                />
                <p className="text-xs text-gray-500">
                  Corporate branding will only be available for orders of this size or larger
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preview-required"
                    checked={formData.previewRequired}
                    onCheckedChange={(checked) => updateFormData({ 
                      previewRequired: checked as boolean 
                    })}
                  />
                  <Label htmlFor="preview-required">Require preview approval</Label>
                </div>
                <p className="text-xs text-gray-500">
                  Customer must approve the design before production starts
                </p>
              </div>
            </div>

            {formData.previewRequired && (
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Preview workflow:</strong> When customers order with branding, 
                  you'll create a preview for their approval. Once approved, the order 
                  cannot be cancelled or refunded.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Listing Type:</span>
            <span className="font-medium capitalize">{formData.listingType}</span>
          </div>
          <div className="flex justify-between">
            <span>Product Name:</span>
            <span className="font-medium">{formData.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span>Pricing Tiers:</span>
            <span className="font-medium">{formData.tieredPricing.length} tiers</span>
          </div>
          <div className="flex justify-between">
            <span>Standard Add-ons:</span>
            <span className="font-medium">{formData.standardAddOns.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Bulk Add-ons:</span>
            <span className="font-medium">{formData.bulkAddOns.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Stock Tracking:</span>
            <span className="font-medium">{formData.stockTracking ? 'Yes' : 'Made-to-order'}</span>
          </div>
          <div className="flex justify-between">
            <span>Customization:</span>
            <span className="font-medium">{formData.isCustomizable ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
