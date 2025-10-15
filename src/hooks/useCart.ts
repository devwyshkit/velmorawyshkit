// Minimal stub for UI component compatibility
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendorId: string;
  image: string;
  customization?: any;
}

export const useCart = () => {
  const addItem = async (item: CartItem) => {
    // Stub implementation
    // Add item to cart functionality
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    // Update cart quantity functionality
  };

  const removeItem = async (itemId: string) => {
    // Remove item from cart functionality
  };

  return {
    itemCount: 0,
    items: [],
    addItem,
    updateQuantity,
    removeItem,
    isLoading: false
  };
};