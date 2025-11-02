import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/integrations/supabase-client";
import { calculateGST, calculateTotalWithGST, generateEstimate } from "@/lib/integrations/razorpay";
import { fetchStoreById, fetchCartItems, updateCartItemSupabase, removeFromCartSupabase } from "@/lib/integrations/supabase-data";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

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
  addOns?: any[];
  store_id?: string;
}

export const CartSheet = ({ isOpen, onClose }: CartSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState<string>("");
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  const loadCart = async () => {
    try {
      // fetchCartItems handles both guest (localStorage) and authenticated (Supabase)
      const cartItems = await fetchCartItems();
      setItems(cartItems);
      
      // Load store name
      if (cartItems.length > 0 && cartItems[0].store_id) {
        const store = await fetchStoreById(cartItems[0].store_id);
        setStoreName(store?.name || "");
      } else {
        setStoreName("");
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setItems([]);
      setStoreName("");
      // No toast - empty state shows error (Swiggy 2025 pattern)
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    // Optimistic update
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setItems(updatedItems);

    if (!user) {
      // Just show optimistic update for mock users
      refreshCartCount();
      return;
    }

    // Update in Supabase
    const success = await updateCartItemSupabase(itemId, newQuantity);
    if (success) {
      refreshCartCount();
    } else {
      // Revert on failure
      loadCart();
      console.error('Failed to update cart item');
      // No toast - optimistic update already reverted (Swiggy 2025 pattern)
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // Optimistic update
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);

    if (!user) {
      // Just show optimistic update for mock users
      refreshCartCount();
      return;
    }

    // Remove from Supabase
    const success = await removeFromCartSupabase(itemId);
    if (success) {
      refreshCartCount();
      // No toast - cart UI shows updated state (Swiggy 2025 pattern)
    } else {
      // Revert on failure
      loadCart();
      console.error('Failed to remove cart item');
      // No toast - optimistic update already reverted (Swiggy 2025 pattern)
    }
  };

  const handleProceedToCheckout = async () => {
    if (items.length === 0) {
      // No toast - empty state already visible (Swiggy 2025 pattern)
      return;
    }

    if (!user) {
      // Silent navigation to login (user knows they need to login)
      navigate(RouteMap.login());
      return;
    }

    onClose();
    setShowCheckout(true);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = calculateGST(subtotal);
  const total = calculateTotalWithGST(subtotal);

  if (items.length === 0 && isOpen) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetDescription>View and manage items in your cart</SheetDescription>
          </SheetHeader>
          {/* Grabber */}
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          <div className="flex flex-col items-center justify-center h-full">
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
        className="h-[85vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>View and manage items in your cart</SheetDescription>
        </SheetHeader>
        {/* Grabber */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">My Cart ({items.length})</h2>
          {storeName && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span>Items from <span className="font-medium text-foreground">{storeName}</span></span>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

          {/* File Upload Notice - Show if any cart item requires preview (Fiverr 2025) */}
          {items.some((item: any) => 
            item.personalizations?.some((p: any) => p.requiresPreview === true)
          ) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Upload className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    File Upload After Payment
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
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

        {/* Footer with Total and Checkout */}
        <div className="sticky bottom-0 bg-white border-t border-border p-4 space-y-3">
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

