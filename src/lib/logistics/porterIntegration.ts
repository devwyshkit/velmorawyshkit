// Porter Logistics Integration
// Functions to interact with Porter API (should be called via Edge Functions)

export interface PorterShipmentRequest {
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

export interface PorterShipmentResponse {
  success: boolean;
  trackingNumber: string;
  shipmentId?: string;
  estimatedDelivery?: string;
  error?: string;
}

export interface PorterTrackingResponse {
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
 * Create shipment with Porter
 * This should be called via Supabase Edge Function to keep API keys secure
 */
export async function createPorterShipment(
  request: PorterShipmentRequest
): Promise<PorterShipmentResponse> {
  try {
    // In production, this would call: /api/logistics/porter/create-shipment
    const response = await fetch('/api/logistics/porter/create-shipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Porter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      trackingNumber: '',
      error: error.message || 'Failed to create Porter shipment',
    };
  }
}

/**
 * Get tracking status from Porter
 */
export async function getPorterTrackingStatus(
  trackingNumber: string
): Promise<PorterTrackingResponse> {
  try {
    // In production, this would call: /api/logistics/porter/track
    const response = await fetch(`/api/logistics/porter/track/${trackingNumber}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Porter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      status: 'unknown',
      error: error.message || 'Failed to get Porter tracking status',
    };
  }
}

/**
 * Schedule pickup with Porter
 */
export async function schedulePorterPickup(
  orderId: string,
  pickupAddress: PorterShipmentRequest['pickupAddress'],
  scheduledTime: string
): Promise<{ success: boolean; pickupId?: string; error?: string }> {
  try {
    const response = await fetch('/api/logistics/porter/schedule-pickup', {
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
      throw new Error(`Porter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to schedule Porter pickup',
    };
  }
}

/**
 * Cancel Porter shipment
 */
export async function cancelPorterShipment(
  trackingNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/logistics/porter/cancel/${trackingNumber}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Porter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to cancel Porter shipment',
    };
  }
}
