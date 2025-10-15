// Minimal stub for business component compatibility
export type OrderStatus = 'pending' | 'design_review' | 'approved' | 'production' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderEvent {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  timeline: OrderEvent[];
  items: any[];
  total: number;
  customerId: string;
}

export const useOrderWorkflow = () => {
  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    // Stub implementation
    // Update order status functionality
  };

  return {
    updateOrderStatus,
    isLoading: false
  };
};