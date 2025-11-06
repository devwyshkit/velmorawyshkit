// Delhivery Logistics Integration
// Functions to interact with Delhivery API (should be called via Edge Functions)

export interface DelhiveryShipmentRequest {
  orderId: string;
  pickupAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  packageDetails: {
    weight: number; // in kg
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    description?: string;
  };
  scheduledPickupTime?: string; // ISO datetime
}

export interface DelhiveryShipmentResponse {
  success: boolean;
  trackingNumber: string;
  waybillNumber?: string;
  shipmentId?: string;
  estimatedDelivery?: string;
  error?: string;
}

export interface DelhiveryTrackingResponse {
  success: boolean;
  status: string;
  location?: string;
  estimatedDelivery?: string;
  events?: Array<{
    timestamp: string;
    status: string;
    location?: string;
  }>;
  error?: string;
}

/**
 * Create shipment with Delhivery
 * This should be called via Supabase Edge Function to keep API keys secure
 */
export async function createDelhiveryShipment(
  request: DelhiveryShipmentRequest
): Promise<DelhiveryShipmentResponse> {
  try {
    // In production, this would call: /api/logistics/delhivery/create-shipment
    const response = await fetch('/api/logistics/delhivery/create-shipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Delhivery API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      trackingNumber: '',
      error: error.message || 'Failed to create Delhivery shipment',
    };
  }
}

/**
 * Get tracking status from Delhivery
 */
export async function getDelhiveryTrackingStatus(
  trackingNumber: string
): Promise<DelhiveryTrackingResponse> {
  try {
    // In production, this would call: /api/logistics/delhivery/track
    const response = await fetch(`/api/logistics/delhivery/track/${trackingNumber}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Delhivery API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      status: 'unknown',
      error: error.message || 'Failed to get Delhivery tracking status',
    };
  }
}

/**
 * Schedule pickup with Delhivery
 */
export async function scheduleDelhiveryPickup(
  orderId: string,
  pickupAddress: DelhiveryShipmentRequest['pickupAddress'],
  scheduledTime: string
): Promise<{ success: boolean; pickupId?: string; error?: string }> {
  try {
    const response = await fetch('/api/logistics/delhivery/schedule-pickup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        pickupAddress,
        scheduledTime,
      }),
    });

    if (!response.ok) {
      throw new Error(`Delhivery API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to schedule Delhivery pickup',
    };
  }
}

/**
 * Cancel Delhivery shipment
 */
export async function cancelDelhiveryShipment(
  trackingNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/logistics/delhivery/cancel/${trackingNumber}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Delhivery API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to cancel Delhivery shipment',
    };
  }
}
