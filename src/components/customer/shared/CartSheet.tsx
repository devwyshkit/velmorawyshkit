import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Trash2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Stepper } from "@/components/customer/shared/Stepper";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshCartCount } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [gstin, setGstin] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  const loadCart = async () => {
    // Use AuthContext instead of isAuthenticated for mock auth support
    if (!user) {
      onClose();
      navigate(RouteMap.login());
      return;
    }
    
    try {
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
      // For mock auth, show empty cart instead of error
      if (!user) {
        setItems([]);
        setStoreName("");
        return;
      }
      toast({
        title: "Error loading cart",
        description: "Please try again",
        variant: "destructive",
      });
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
      toast({
        title: "Update failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // Optimistic update
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);

    if (!user) {
      // Just show optimistic update for mock users
      refreshCartCount();
      toast({
        title: "Item removed",
        description: "Item removed from cart",
      });
      return;
    }

    // Remove from Supabase
    const success = await removeFromCartSupabase(itemId);
    if (success) {
      refreshCartCount();
      toast({
        title: "Item removed",
        description: "Item removed from cart",
      });
    } else {
      // Revert on failure
      loadCart();
      toast({
        title: "Remove failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDownloadEstimate = () => {
    const estimate = generateEstimate(items, gstin);
    
    // Create a simple text estimate
    const estimateText = `
WYSHKIT - Tax Estimate
${gstin ? `GSTIN: ${gstin}` : ''}
${'-'.repeat(40)}
Items:
${items.map(item => `${item.name} x${item.quantity}: ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n')}
${'-'.repeat(40)}
Subtotal: ₹${estimate.subtotal.toLocaleString('en-IN')}
GST (18%): ₹${estimate.gst.toLocaleString('en-IN')}
${'-'.repeat(40)}
Total: ₹${estimate.total.toLocaleString('en-IN')}

HSN Code: 9985
    `;

    const blob = new Blob([estimateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wyshkit-estimate.txt';
    a.click();

    toast({
      title: "Estimate downloaded",
      description: "Your tax estimate has been downloaded",
    });
  };

  const handleProceedToCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to proceed",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login required",
        description: "Please sign in to checkout",
      });
      navigate(RouteMap.login());
      return;
    }

    onClose();
    // Open checkout sheet
    navigate(RouteMap.checkout());
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = calculateGST(subtotal);
  const total = calculateTotalWithGST(subtotal);

  if (items.length === 0 && isOpen) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
      >
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

          {/* MAKE IT SPECIAL Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">🎁 Make It Special</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">🎁 Gift Box</span>
                </div>
                <span className="text-sm font-medium">+₹80</span>
              </label>
              <label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">💌 Greeting Card</span>
                </div>
                <span className="text-sm font-medium">+₹50</span>
              </label>
              <label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">🎀 Gift Wrap</span>
                </div>
                <span className="text-sm font-medium">+₹30</span>
              </label>
            </div>
          </div>

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

          <Separator className="my-4" />

          {/* GSTIN Input */}
          <div className="space-y-2">
            <Label htmlFor="gstin" className="text-sm">
              GSTIN (Optional - for business purchases)
            </Label>
            <Input
              id="gstin"
              placeholder="Enter GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="text-sm"
            />
            {gstin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadEstimate}
                className="w-full"
              >
                Download Tax Estimate
              </Button>
            )}
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
    </Sheet>
  );
};

