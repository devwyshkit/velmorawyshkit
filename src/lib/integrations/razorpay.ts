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

export const initiatePayment = async (options: RazorpayOptions) => {
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

