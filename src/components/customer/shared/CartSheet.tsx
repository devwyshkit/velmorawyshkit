import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Trash2, Store, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Stepper } from "@/components/customer/shared/Stepper";
import { CheckoutCoordinator } from "@/components/customer/shared/CheckoutCoordinator";
// Phase 1 Cleanup: Removed Supabase imports - pure mock mode
import { calculateGST, calculateTotalWithGST, generateEstimate } from "@/lib/integrations/razorpay";
import { getCartItems } from "@/lib/mock-cart";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Personalization } from "@/lib/types/cart";

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addOns?: Personalization[];
  store_id?: string;
}

// Helper to load cart items synchronously (Swiggy 2025 pattern)
const loadCartItemsSync = (): CartItem[] => {
  try {
    const fetchedItems = getCartItems();
    return fetchedItems.map(item => ({
      ...item,
      personalizations: item.addOns || [],
    }));
  } catch (error) {
    return [];
  }
};

export const CartSheet = ({ isOpen, onClose }: CartSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCartCount, cartCount, updateCartQuantity, removeCartItem } = useCart();
  // Swiggy 2025: Initialize items synchronously to prevent empty cart flash
  const [items, setItems] = useState<CartItem[]>(() => loadCartItemsSync());
  const [storeName, setStoreName] = useState<string>(() => {
    const initialItems = loadCartItemsSync();
    return initialItems.length > 0 && initialItems[0].store_id ? "Partner Store" : "";
  });
  const [showCheckout, setShowCheckout] = useState(false);

  // Calculate current items count with useMemo (Swiggy 2025 pattern - prevent flickering)
  const currentItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [items]);

  // Swiggy 2025: Load cart synchronously (localStorage is synchronous)
  const loadCart = useCallback(() => {
    try {
      // Get cart items synchronously (no artificial delay)
      const fetchedItems = getCartItems();
      // Map addOns to personalizations for consistency with checkout
      const cartItems = fetchedItems.map(item => ({
        ...item,
        personalizations: item.addOns || [],
      }));
      setItems(cartItems);
      
      // Load store name (mock - extract from first item's store_id if available)
      if (cartItems.length > 0 && cartItems[0].store_id) {
        // Phase 1 Cleanup: Mock store name - no Supabase fetch
        setStoreName("Partner Store");
      } else {
        setStoreName("");
      }
    } catch (error) {
      // Silent error handling - show empty state (Swiggy 2025 pattern)
      setItems([]);
      setStoreName("");
    }
  }, []); // Empty dependency array as it's memoized

  // Swiggy 2025: Load cart when sheet opens or cart count changes (synchronous)
  useEffect(() => {
    if (isOpen) {
      // Load cart synchronously - no delay needed
      loadCart();
    }
  }, [isOpen, cartCount, loadCart]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    // Handle quantity 0 (remove item)
    if (newQuantity === 0) {
      await handleRemoveItem(itemId);
      return;
    }

    // Optimistic update (Swiggy 2025 pattern)
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setItems(updatedItems);

    // Phase 1 Cleanup: Always use CartContext handler (now mock-based)
    const success = await updateCartQuantity(itemId, newQuantity);
    if (!success) {
      // Revert on failure - optimistic update already reverted (Swiggy 2025 pattern)
      loadCart();
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // Optimistic update (Swiggy 2025 pattern)
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);

    // Phase 1 Cleanup: Always use CartContext handler (now mock-based)
    const success = await removeCartItem(itemId);
    if (!success) {
      // Revert on failure - optimistic update already reverted (Swiggy 2025 pattern)
      loadCart();
    }
  };

  const handleProceedToCheckout = async () => {
    if (items.length === 0) {
      // No toast - empty state already visible (Swiggy 2025 pattern)
      return;
    }

    // Phase 1 Cleanup: Always allow checkout - mock mode doesn't require auth
    // Swiggy 2025: Guest mode allows browsing, checkout can proceed
    onClose();
    setShowCheckout(true);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = calculateGST(subtotal);
  const total = calculateTotalWithGST(subtotal);

  // Swiggy 2025: Show empty cart only when cart is actually empty (no loading state needed - synchronous)
  if (items.length === 0 && isOpen) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
        <SheetContent
          side="bottom"
          className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetDescription>View and manage items in your cart</SheetDescription>
          </SheetHeader>
          {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
          <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-6">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">Your cart is empty</p>
              <Button onClick={onClose}>Continue Shopping</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent
        side="bottom"
        className="max-h-[75vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>View and manage items in your cart</SheetDescription>
        </SheetHeader>
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        {/* Header - Sticky (Swiggy 2025 pattern) */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex-shrink-0">
          <h2 className="text-lg font-semibold">My Cart ({items.length})</h2>
          {storeName && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span>Items from <span className="font-medium text-foreground">{storeName}</span></span>
            </div>
          )}
        </div>

        {/* Items List - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory p-4 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 bg-card rounded-lg p-3 border border-border">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold mb-1 line-clamp-2">{item.name}</h3>
                <p className="text-sm font-bold text-primary mb-2">
                  ₹{item.price.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-between">
                  <Stepper
                    value={item.quantity}
                    onChange={(newQuantity) => handleUpdateQuantity(item.id, newQuantity)}
                    min={1}
                    max={99}
                    className="scale-90 origin-left"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Separator className="my-4" />

          {/* File Upload Notice - Show if any cart item has personalizations (simplified rule) */}
          {items.some((item: CartItem) => 
            item.personalizations?.length > 0
          ) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Upload className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-blue-900">
                    File Upload After Payment
                  </p>
                  <p className="text-blue-700 mt-1">
                    Your order includes custom items. You'll upload design files after checkout, and we'll create a preview for your approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Promo Code Section */}
          <div className="space-y-2">
            <Label htmlFor="promo" className="text-sm">🏷️ Promo Code</Label>
            <div className="flex gap-2">
              <Input
                id="promo"
                placeholder="Enter code"
                className="text-sm"
              />
              <Button variant="outline">Apply</Button>
            </div>
          </div>
        </div>

        {/* Footer with Total and Checkout - Sticky (Swiggy 2025 pattern) */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 space-y-3 flex-shrink-0">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>GST (18%)</span>
              <span>₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <Button
            onClick={handleProceedToCheckout}
            className="w-full h-12 text-base"
            size="lg"
          >
            Proceed to Checkout
          </Button>
        </div>
      </SheetContent>
      <CheckoutCoordinator isOpen={showCheckout} onClose={() => setShowCheckout(false)} />
    </Sheet>
  );
};

