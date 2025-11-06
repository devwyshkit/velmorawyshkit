// Minimal stub for business component compatibility
export interface MOQValidation {
  isValid: boolean;
  errors: Array<{ message: string; code: string }>;
  recommendedQuantity?: number;
}

export interface FileValidation {
  isValid: boolean;
  errors: Array<{ message: string; code: string }>;
  warnings?: Array<{ message: string; code: string }>;
}

export interface PricingCalculation {
  basePrice: number;
  customizationCost: number;
  addOnCost: number;
  total: number;
  breakdown: Array<{ item: string; cost: number }>;
}

export interface PaymentFlow {
  hasCustomItems: boolean;
  requiresCapture: boolean;
  captureDelay?: number;
}

export const useBusinessLogic = () => {
  // MOQ validation removed - no MOQ requirement (Swiggy 2025 pattern)
  const validateMOQ = (productName: string, quantity: number, hasCustomization: boolean): MOQValidation => {
    // Always valid - no MOQ requirement
    return { isValid: true, errors: [] };
  };

  const validateDesignFile = (file: File): FileValidation => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
    
    const errors: Array<{ message: string; code: string }> = [];
    
    if (file.size > maxSize) {
      errors.push({ message: 'File size exceeds 10MB limit', code: 'FILE_TOO_LARGE' });
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push({ message: 'File type not supported', code: 'INVALID_FILE_TYPE' });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const calculatePricing = (basePrice: number, quantity: number, customization: any, addOns: Record<string, boolean>): PricingCalculation => {
    const customizationCost = customization?.designCost || 0;
    const addOnCosts = [25, 15, 100]; // Example costs for different add-ons
    const addOnCost = Object.values(addOns).reduce((sum: number, enabled: boolean, index: number) => {
      return sum + (enabled ? (addOnCosts[index] || 0) : 0);
    }, 0);
    
    const total = (basePrice * quantity) + (customizationCost * quantity) + addOnCost;
    
    return {
      basePrice: basePrice * quantity,
      customizationCost: customizationCost * quantity,
      addOnCost,
      total,
      breakdown: [
        { item: 'Base cost', cost: basePrice * quantity },
        { item: 'Customization', cost: customizationCost * quantity },
        { item: 'Add-ons', cost: addOnCost }
      ]
    };
  };

  const analyzePaymentFlow = (items: any[]): PaymentFlow => {
    // Simplified rule: If personalizations exist, preview required
    const hasCustomItems = items.some(item => item.personalizations?.length > 0);
    
    return {
      hasCustomItems,
      requiresCapture: !hasCustomItems, // Standard items capture immediately
      captureDelay: hasCustomItems ? 24 * 60 * 60 * 1000 : 0 // 24 hours for custom items
    };
  };

  return {
    validateMOQ,
    validateDesignFile,
    calculatePricing,
    analyzePaymentFlow
  };
};