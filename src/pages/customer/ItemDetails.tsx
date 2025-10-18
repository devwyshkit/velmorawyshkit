import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, Gift, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Stepper } from "@/components/customer/shared/Stepper";
import { LoginPromptSheet } from "@/components/customer/shared/LoginPromptSheet";
import { CartReplacementModal } from "@/components/customer/shared/CartReplacementModal";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useCart } from "@/contexts/CartContext";
import { useBulkPricing } from "@/hooks/use-bulk-pricing";
import { isAuthenticated, getGuestCart, setGuestCart } from "@/lib/integrations/supabase-client";
import { fetchItemById, addToCartSupabase, fetchPartnerById, type Item as ItemType } from "@/lib/integrations/supabase-data";

interface AddOn {
  id: string;
  name: string;
  price: number;
}

export const ItemDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCartCount, currentPartnerId, clearCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCartReplacementModal, setShowCartReplacementModal] = useState(false);
  const [currentPartnerName, setCurrentPartnerName] = useState("");
  const [newPartnerName, setNewPartnerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemType | null>(null);

  useEffect(() => {
    const loadItemData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const itemData = await fetchItemById(id);
        setItem(itemData);
      } catch (error) {
        console.error('Failed to load item:', error);
        toast({
          title: "Loading error",
          description: "Failed to load item details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadItemData();
  }, [id, toast]);

  const addOns: AddOn[] = [
    { id: '1', name: 'Greeting Card (+₹99)', price: 99 },
    { id: '2', name: 'Gift Wrapping (+₹149)', price: 149 },
    { id: '3', name: 'Express Delivery (+₹199)', price: 199 },
  ];

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  // Bulk Pricing Auto-Update (NEW)
  const { appliedPrice, totalPrice, tierApplied, discount } = useBulkPricing(
    item?.price || 0,
    quantity,
    item?.bulk_pricing_tiers || []
  );

  const calculateTotal = () => {
    // Use bulk pricing if applicable
    const basePrice = tierApplied ? totalPrice : (item.price * quantity);
    const addOnsPrice = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return sum + (addOn?.price || 0);
    }, 0);
    return basePrice + addOnsPrice;
  };

  const handleAddToCart = async () => {
    // Check if adding item from different partner
    if (currentPartnerId && currentPartnerId !== item.partner_id) {
      // Fetch partner names for modal
      const currentPartner = await fetchPartnerById(currentPartnerId);
      const newPartner = await fetchPartnerById(item.partner_id);
      
      setCurrentPartnerName(currentPartner?.name || "Current Partner");
      setNewPartnerName(newPartner?.name || "New Partner");
      setShowCartReplacementModal(true);
      return;
    }

    // Same partner or empty cart - proceed normally
    await proceedWithAddToCart();
  };

  const proceedWithAddToCart = async () => {
    const authenticated = await isAuthenticated();

    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      image: item.images[0],
      partner_id: item.partner_id,
      addOns: selectedAddOns.map(id => addOns.find(a => a.id === id)).filter(Boolean),
      total: calculateTotal(),
    };

    if (!authenticated) {
      // Guest mode: save to localStorage
      const guestCart = getGuestCart();
      guestCart.push(cartItem);
      setGuestCart(guestCart);
      refreshCartCount();

      toast({
        title: "Added to cart",
        description: "Sign in to checkout",
        action: (
          <ToastAction 
            altText="Sign in"
            onClick={() => setShowLoginPrompt(true)}
          >
            Sign In
          </ToastAction>
        ),
      });

      // Show login prompt overlay
      setTimeout(() => {
        setShowLoginPrompt(true);
      }, 500);
    } else {
      // Authenticated: save to Supabase
      const success = await addToCartSupabase(cartItem);
      
      if (success) {
        refreshCartCount();
        toast({
          title: "Added to cart",
          description: `${quantity}x ${item.name}`,
          action: (
            <ToastAction 
              altText="View cart"
              onClick={() => navigate('/customer/cart')}
            >
              View Cart
            </ToastAction>
          ),
        });
        // Auto-navigate to cart after 2 seconds (or user can click toast)
        setTimeout(() => navigate("/customer/cart"), 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to cart",
          variant: "destructive",
        });
      }
    }
  };

  const handleReplaceCart = async () => {
    // Clear existing cart
    clearCart();
    setShowCartReplacementModal(false);
    
    // Proceed with adding new item
    await proceedWithAddToCart();
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="Item Details" />
        
        <main className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="aspect-square rounded-xl" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </main>

        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader showBackButton title="Item Details" />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Image Carousel */}
          <Carousel className="w-full">
            <CarouselContent>
              {(item?.images || [item?.image]).map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={`${item.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Fallback icon */}
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                      <Gift className="w-16 h-16" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>

          {/* Title and Rating */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{item.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-yellow-600">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{item.rating}</span>
              </div>
              <span className="text-muted-foreground">• {item.ratingCount || 156} ratings</span>
            </div>
          </div>

          {/* Price with Bulk Discount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-3xl font-bold text-primary">
                ₹{(appliedPrice / 100).toLocaleString('en-IN')}
              </span>
              {tierApplied && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {discount}% Bulk Discount
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">(incl. GST)</span>
            </div>
            {tierApplied && item.price !== appliedPrice && (
              <p className="text-sm text-muted-foreground">
                <span className="line-through">₹{(item.price / 100).toLocaleString('en-IN')}</span>
                <span className="ml-2 text-green-600 font-medium">
                  Save ₹{((item.price - appliedPrice) * quantity / 100).toLocaleString('en-IN')} on {quantity} items!
                </span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">About this item</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Quantity Stepper */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Quantity</Label>
            <Stepper value={quantity} onChange={setQuantity} min={1} max={99} />
          </div>

          {/* Add-ons */}
          {addOns.length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Customize Your Gift</Label>
              <div className="space-y-3">
                {addOns.map((addOn) => (
                  <div key={addOn.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={addOn.id}
                      checked={selectedAddOns.includes(addOn.id)}
                      onCheckedChange={() => handleAddOnToggle(addOn.id)}
                    />
                    <Label
                      htmlFor={addOn.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {addOn.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Pricing Tiers (if available) */}
          {item.bulk_pricing_tiers && item.bulk_pricing_tiers.length > 0 && (
            <Accordion type="single" collapsible className="w-full" defaultOpen>
              <AccordionItem value="bulk-pricing">
                <AccordionTrigger className="text-base font-semibold">
                  💰 Bulk Pricing Tiers
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Order more, save more! Get special pricing on bulk orders.
                  </p>
                  <div className="space-y-2">
                    {item.bulk_pricing_tiers.map((tier, index) => {
                      const isActiveTier = tierApplied?.min_qty === tier.min_qty;
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            isActiveTier 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">
                              {tier.min_qty} - {tier.max_qty || '∞'} units
                            </span>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                ₹{(tier.price_per_unit / 100).toLocaleString('en-IN')}/unit
                              </p>
                              {tier.price_per_unit < item.price && (
                                <p className="text-xs text-green-600">
                                  {Math.round(((item.price - tier.price_per_unit) / item.price) * 100)}% off
                                </p>
                              )}
                            </div>
                          </div>
                          {isActiveTier && (
                            <Badge className="mt-2" variant="secondary">
                              Currently Applied
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {item.min_order_qty > 1 && (
                    <p className="text-xs text-muted-foreground mt-3">
                      * Minimum order quantity: {item.min_order_qty} units
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* What's Included (for hampers) */}
          {item.hamper_components && item.hamper_components.length > 0 && (
            <Accordion type="single" collapsible className="w-full" defaultOpen>
              <AccordionItem value="components">
                <AccordionTrigger className="text-base font-semibold">
                  🎁 What's Included
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    This hamper includes {item.hamper_components.length} carefully curated items:
                  </p>
                  
                  <div className="space-y-2">
                    {item.hamper_components.map((component: any, index: number) => (
                      <div key={index} className="flex gap-3 items-center p-3 bg-muted/50 rounded-lg">
                        {component.image_url && (
                          <img 
                            src={component.image_url} 
                            alt={component.name}
                            className="w-14 h-14 rounded object-cover" 
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{component.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Quantity: {component.quantity}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Included
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      All components assembled with care and ready for gifting
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Specifications & Compliance */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="specs">
              <AccordionTrigger className="text-base font-semibold">
                Product Specifications
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {item?.specs?.weight && (
                    <div>
                      <span className="font-medium text-foreground">Weight</span>
                      <p>{item.specs.weight}</p>
                    </div>
                  )}
                  {item?.specs?.dimensions && (
                    <div>
                      <span className="font-medium text-foreground">Dimensions</span>
                      <p>{item.specs.dimensions}</p>
                    </div>
                  )}
                  {item?.specs?.materials && (
                    <div className="col-span-2">
                      <span className="font-medium text-foreground">Materials</span>
                      <p>{item.specs.materials}</p>
                    </div>
                  )}
                  {!item?.specs && (
                    <p className="col-span-2">Specifications will be provided upon request</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Important Notice */}
          <p className="text-xs text-muted-foreground">
            Note: Custom items are non-refundable after proof approval
          </p>

          {/* Add to Cart Section */}
          <div className="sticky bottom-20 md:bottom-4 bg-white border border-border rounded-lg p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                ₹{calculateTotal().toLocaleString('en-IN')}
              </span>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full h-12 text-base"
              size="lg"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />

      {/* Login Prompt Overlay */}
      <LoginPromptSheet
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      {/* Cart Replacement Modal - Swiggy Pattern */}
      <CartReplacementModal
        isOpen={showCartReplacementModal}
        currentPartner={currentPartnerName}
        newPartner={newPartnerName}
        onConfirm={handleReplaceCart}
        onCancel={() => setShowCartReplacementModal(false)}
      />
    </div>
  );
};

