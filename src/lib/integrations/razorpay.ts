// Razorpay integration for payments
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
}

export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Import mock mode functions (top-level import for synchronous access)
let mockModeEnabled: (() => boolean) | null = null;

// Lazy load mock mode check to avoid circular dependencies
const checkMockMode = (): boolean => {
  if (!import.meta.env.DEV) {
    return false;
  }
  
  try {
    // Try to access localStorage directly (same logic as mock-mode.ts)
    const stored = localStorage.getItem('wyshkit_mock_mode');
    if (stored === 'true') {
      return true;
    }
    
    // Check environment variable
    if (import.meta.env.VITE_MOCK_MODE === 'true') {
      return true;
    }
  } catch {
    // localStorage not available
  }
  
  return false;
};

// Mock payment mode - for testing without actual Razorpay credentials
export const isMockPaymentMode = (): boolean => {
  // Check if general mock mode is enabled
  if (checkMockMode()) {
    return true;
  }
  
  // Check Razorpay-specific mock mode
  return !import.meta.env.VITE_RAZORPAY_KEY || import.meta.env.VITE_RAZORPAY_MOCK === 'true';
};

// Mock payment handler - simulates successful payment (2025 pattern for testing)
export const initiateMockPayment = async (options: RazorpayOptions): Promise<void> => {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful payment response
  const mockResponse = {
    razorpay_payment_id: `mock_pay_${Date.now()}`,
    razorpay_order_id: options.order_id,
    razorpay_signature: 'mock_signature_' + Date.now(),
  };
  
  // Call handler with mock response
  if (options.handler) {
    options.handler(mockResponse);
  }
};

export const initiatePayment = async (options: RazorpayOptions): Promise<void> => {
  // Use mock mode if Razorpay key is not configured (2025 pattern - seamless testing)
  if (isMockPaymentMode()) {
    // Wait for mock payment to complete (handler will be called)
    await initiateMockPayment(options);
    return;
  }
  
  const res = await loadRazorpay();
  
  if (!res) {
    throw new Error('Razorpay SDK failed to load');
  }

  const rzp = new window.Razorpay(options);
  rzp.open();
};

// Calculate GST (18%)
export const calculateGST = (amount: number): number => {
  return amount * 0.18;
};

// Calculate total with GST
export const calculateTotalWithGST = (amount: number): number => {
  return amount + calculateGST(amount);
};

// Format amount for Razorpay (paise)
export const formatAmountForRazorpay = (amount: number): number => {
  return Math.round(amount * 100);
};

// Generate invoice/estimate
export const generateEstimate = (items: any[], gstin?: string) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = calculateGST(subtotal);
  const total = subtotal + gst;

  return {
    subtotal,
    gst,
    total,
    gstin: gstin || '',
    hsn: '9985', // HSN code for services
    items: items.map(item => ({
      ...item,
      hsn: '9985',
    })),
  };
};

