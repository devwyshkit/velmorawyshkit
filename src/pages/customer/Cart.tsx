import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Stepper } from "@/components/customer/shared/Stepper";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import {
  supabase,
  isAuthenticated,
  getGuestCart,
  setGuestCart,
} from "@/lib/integrations/supabase-client";
import {
  fetchCartItems,
  updateCartItemSupabase,
  removeCartItemSupabase,
  fetchPartnerById,
} from "@/lib/integrations/supabase-data";
import { calculateGST, calculateTotalWithGST, generateEstimate } from "@/lib/integrations/razorpay";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addOns?: any[];
  partner_id?: string;
}

export const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCartCount } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [gstin, setGstin] = useState("");
  const [loading, setLoading] = useState(false);
  const [partnerName, setPartnerName] = useState<string>("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        // Load from localStorage
        const guestCart = getGuestCart();
        setItems(guestCart);
        
        // Load partner name if items exist
        if (guestCart.length > 0 && guestCart[0].partner_id) {
          const partner = await fetchPartnerById(guestCart[0].partner_id);
          setPartnerName(partner?.name || "");
        }
      } else {
        // Load from Supabase
        const cartData = await fetchCartItems();
        setItems(cartData);
        
        // Load partner name
        if (cartData.length > 0 && cartData[0].partner_id) {
          const partner = await fetchPartnerById(cartData[0].partner_id);
          setPartnerName(partner?.name || "");
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast({
        title: "Loading error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setItems(updatedItems);

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      setGuestCart(updatedItems);
      refreshCartCount();
    } else {
      // Update in Supabase
      const success = await updateCartItemSupabase(itemId, newQuantity);
      if (!success) {
        // Revert on failure
        await loadCart();
        toast({
          title: "Update failed",
          description: "Failed to update quantity",
          variant: "destructive",
        });
      }
      refreshCartCount();
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // Optimistic update
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      setGuestCart(updatedItems);
      refreshCartCount();
    } else {
      // Remove from Supabase
      const success = await removeCartItemSupabase(itemId);
      if (!success) {
        // Revert on failure
        await loadCart();
        toast({
          title: "Remove failed",
          description: "Failed to remove item",
          variant: "destructive",
        });
        return;
      }
      refreshCartCount();
    }

    toast({
      title: "Item removed",
      description: "Item removed from cart",
    });
  };

  const handleDownloadEstimate = () => {
    const estimate = generateEstimate(items, gstin);
    
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

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      toast({
        title: "Login required",
        description: "Please sign in to checkout",
      });
      navigate("/customer/login");
      return;
    }

    // Navigate to checkout page
    navigate("/customer/checkout");
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = calculateGST(subtotal);
  const total = calculateTotalWithGST(subtotal);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="My Cart" />
        
        <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 bg-card rounded-lg p-3 border border-border">
              <Skeleton className="w-20 h-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          ))}
        </main>

        <CustomerBottomNav />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="My Cart" />
        
        <div className="flex flex-col items-center justify-center h-[70vh] px-4">
          <ShoppingBag className="h-20 w-20 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Add items from our partners to get started
          </p>
          <Button onClick={() => navigate("/customer/home")} className="w-full max-w-sm">
            Browse Partners
          </Button>
        </div>

        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader showBackButton title="My Cart" />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {/* Partner Info */}
        {partnerName && (
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Store className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm">
              Items from <span className="font-semibold text-foreground">{partnerName}</span>
            </span>
          </div>
        )}

        {/* Items List */}
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

        {/* Total Summary */}
        <div className="bg-card rounded-lg p-4 border border-border space-y-3">
          <h3 className="font-semibold">Bill Summary</h3>
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
        </div>
        
        {/* Checkout Button */}
        <Button 
          onClick={handleProceedToCheckout}
          className="w-full h-12 text-base sticky bottom-20 md:bottom-4"
          size="lg"
        >
          Proceed to Checkout
        </Button>
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};

