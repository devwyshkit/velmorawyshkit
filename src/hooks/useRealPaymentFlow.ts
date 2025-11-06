import { useState, useCallback, useRef, useEffect } from 'react';
import { useBusinessLogic } from '@/hooks/useBusinessLogic';

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
export type OrderType = 'standard' | 'custom';

export interface PaymentOrder {
  id: string;
  orderId: string;
  amount: number;
  currency: 'INR';
  status: PaymentStatus;
  type: OrderType;
  createdAt: Date;
  capturedAt?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

export interface RazorpayCreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface PaymentAuthorizationResult {
  success: boolean;
  paymentOrder: PaymentOrder;
  razorpayOrder: RazorpayCreateOrderResponse;
  requiresUserAction: boolean;
  errorMessage?: string;
}

export interface PaymentCaptureResult {
  success: boolean;
  paymentId: string;
  amount: number;
  capturedAmount: number;
  errorMessage?: string;
}

export const useRealPaymentFlow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { analyzePaymentFlow } = useBusinessLogic();
  // Swiggy 2025: AbortController for fetch cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Swiggy 2025: Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Create Razorpay order - authorize payment without capture
  const authorizePayment = useCallback(async (
    orderData: {
      items: any[];
      amount: number;
      orderId: string;
      customerInfo: any;
    }
  ): Promise<PaymentAuthorizationResult> => {
    setIsProcessing(true);
    
    // Swiggy 2025: Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const paymentFlow = analyzePaymentFlow(orderData.items);
      
      // Call Supabase Edge Function for payment order creation
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: orderData.amount * 100, // Razorpay expects paise
          currency: 'INR',
          receipt: orderData.orderId,
          notes: {
            order_id: orderData.orderId,
            customer_id: orderData.customerInfo.id,
            has_custom_items: paymentFlow.hasCustomItems.toString(),
            auto_capture: paymentFlow.requiresCapture.toString()
          }
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const razorpayOrder: RazorpayCreateOrderResponse = await response.json();
      
      const paymentOrder: PaymentOrder = {
        id: generatePaymentId(),
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: 'INR',
        status: 'authorized',
        type: paymentFlow.hasCustomItems ? 'custom' : 'standard',
        createdAt: new Date(),
        razorpayOrderId: razorpayOrder.id
      };

      return {
        success: true,
        paymentOrder,
        razorpayOrder,
        requiresUserAction: true
      };

    } catch (error) {
      // Swiggy 2025: Handle abort gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          paymentOrder: {} as PaymentOrder,
          razorpayOrder: {} as RazorpayCreateOrderResponse,
          requiresUserAction: false,
          errorMessage: 'Request cancelled'
        };
      }
      return {
        success: false,
        paymentOrder: {} as PaymentOrder,
        razorpayOrder: {} as RazorpayCreateOrderResponse,
        requiresUserAction: false,
        errorMessage: error instanceof Error ? error.message : 'Payment authorization failed'
      };
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [analyzePaymentFlow]);

  // Capture authorized payment (for approved custom orders or immediate standard orders)
  const capturePayment = useCallback(async (
    paymentId: string,
    amount: number
  ): Promise<PaymentCaptureResult> => {
    setIsProcessing(true);

    // Swiggy 2025: Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // TODO: Replace with actual Supabase Edge Function call
      // This should call /api/payments/capture
      const response = await fetch('/api/payments/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          amount: amount * 100 // Razorpay expects paise
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to capture payment');
      }

      const result = await response.json();

      return {
        success: true,
        paymentId: result.id,
        amount: amount,
        capturedAmount: result.amount / 100 // Convert back from paise
      };

    } catch (error) {
      // Swiggy 2025: Handle abort gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          paymentId: '',
          amount: 0,
          capturedAmount: 0,
          errorMessage: 'Request cancelled'
        };
      }
      return {
        success: false,
        paymentId: '',
        amount: 0,
        capturedAmount: 0,
        errorMessage: error instanceof Error ? error.message : 'Payment capture failed'
      };
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Refund payment (for cancelled custom orders or returns)
  const refundPayment = useCallback(async (
    paymentId: string,
    amount?: number,
    reason: string = 'Customer cancellation'
  ): Promise<PaymentCaptureResult> => {
    setIsProcessing(true);

    // Swiggy 2025: Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // TODO: Replace with actual Supabase Edge Function call
      // This should call /api/payments/refund
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          amount: amount ? amount * 100 : undefined, // Full refund if amount not specified
          notes: {
            reason: reason,
            processed_at: new Date().toISOString()
          }
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      const result = await response.json();

      return {
        success: true,
        paymentId: result.payment_id,
        amount: amount || result.amount / 100,
        capturedAmount: result.amount / 100
      };

    } catch (error) {
      // Swiggy 2025: Handle abort gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          paymentId: '',
          amount: 0,
          capturedAmount: 0,
          errorMessage: 'Request cancelled'
        };
      }
      return {
        success: false,
        paymentId: '',
        amount: 0,
        capturedAmount: 0,
        errorMessage: error instanceof Error ? error.message : 'Refund processing failed'
      };
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Handle complete payment workflow based on order type
  const processPaymentWorkflow = useCallback(async (orderData: any) => {
    const paymentFlow = analyzePaymentFlow(orderData.items);
    
    // Step 1: Always authorize payment first
    const authResult = await authorizePayment(orderData);
    
    if (!authResult.success) {
      return {
        success: false,
        stage: 'authorization',
        error: authResult.errorMessage
      };
    }

    // Step 2: For standard orders, capture immediately
    if (!paymentFlow.hasCustomItems) {
      const captureResult = await capturePayment(
        authResult.razorpayOrder.id,
        orderData.amount
      );
      
      return {
        success: captureResult.success,
        stage: 'capture',
        paymentOrder: authResult.paymentOrder,
        error: captureResult.errorMessage
      };
    }

    // Step 3: For custom orders, return authorization (capture happens after preview approval)
    return {
      success: true,
      stage: 'authorized',
      paymentOrder: authResult.paymentOrder,
      message: 'Payment authorized. Will be captured after design approval.'
    };

  }, [authorizePayment, capturePayment, analyzePaymentFlow]);

  return {
    authorizePayment,
    capturePayment,
    refundPayment,
    processPaymentWorkflow,
    isProcessing
  };
};