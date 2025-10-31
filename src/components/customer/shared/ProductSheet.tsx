import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Star, Heart, Gift, Clock, Package, MapPin, AlertCircle, CheckCircle, Undo, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  type CarouselApi,
} from "@/components/ui/carousel";
import { Stepper } from "@/components/customer/shared/Stepper";
import { CartReplacementModal } from "@/components/customer/shared/CartReplacementModal";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { supabase, isAuthenticated } from "@/lib/integrations/supabase-client";
import { addToCartSupabase, getMockItems, fetchPartnerById, fetchItemById } from "@/lib/integrations/supabase-data";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface ProductSheetProps {
  itemId: string;
  onClose: () => void;
}

export const ProductSheet = ({ itemId, onClose }: ProductSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCartCount, currentPartnerId, clearCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedPersonalizations, setSelectedPersonalizations] = useState<string[]>([]);
  const [item, setItem] = useState<any>(null);
  const [showCartReplacementModal, setShowCartReplacementModal] = useState(false);
  const [currentPartnerName, setCurrentPartnerName] = useState<string>("");
  const [newPartnerName, setNewPartnerName] = useState<string>("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [partnerData, setPartnerData] = useState<any>(null);

  // Load item data from Supabase (fallback to mock)
  useEffect(() => {
    const loadItem = async () => {
      try {
        const itemData = await fetchItemById(itemId);
        if (itemData) {
          setItem({
            ...itemData,
            specs: itemData.specs || {
              material: '100% cotton',
              quality: 'Premium print',
              dimensions: '30×20×15 cm',
              weight: '250g',
            },
            personalizations: itemData.add_ons || [],
          });
        } else {
          // Fallback to mock if not found
          const items = getMockItems();
          const foundItem = items.find(i => i.id === itemId) || items[0];
          setItem({
            ...foundItem,
            specs: {
              material: '100% cotton',
              quality: 'Premium print',
              dimensions: '30×20×15 cm',
              weight: '250g',
            },
            personalizations: foundItem.add_ons || [],
          });
        }
      } catch (error) {
        console.error('Failed to load item:', error);
        // Fallback to mock on error
        const items = getMockItems();
        const foundItem = items.find(i => i.id === itemId) || items[0];
        setItem(foundItem);
      }
    };
    loadItem();
  }, [itemId]);

  // Load partner data
  useEffect(() => {
    const loadPartner = async () => {
      if (item?.partner_id) {
        try {
          const partner = await fetchPartnerById(item.partner_id);
          setPartnerData(partner);
        } catch (error) {
          console.error('Failed to load partner:', error);
        }
      }
    };
    loadPartner();
  }, [item?.partner_id]);

  // Track carousel state for dots
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  const handlePersonalizationToggle = (personalizationId: string) => {
    setSelectedPersonalizations(prev =>
      prev.includes(personalizationId)
        ? prev.filter(id => id !== personalizationId)
        : [...prev, personalizationId]
    );
  };

  const calculateTotal = () => {
    const basePrice = item?.price || 0;
    const baseTotal = basePrice * quantity;
    const personalizationsTotal = selectedPersonalizations.reduce((sum, id) => {
      const personalization = item?.personalizations?.find((p: any) => p.id === id);
      return sum + (personalization?.price || 0);
    }, 0);
    return baseTotal + personalizationsTotal;
  };

  const handleAddToCart = async () => {
    if (!item) return;

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
    if (!item) return;

    const authenticated = await isAuthenticated();

    if (!authenticated) {
      onClose();
      navigate(RouteMap.login());
      return;
    } else {
      // Authenticated: save to Supabase
      const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        partner_id: item.partner_id,
        personalizations: selectedPersonalizations.map(id => 
          item.personalizations?.find((p: any) => p.id === id)
        ).filter(Boolean),
      };
      
      const success = await addToCartSupabase(cartItem);
      
      if (success) {
        refreshCartCount();
        toast({
          title: "Added to cart",
          description: `${quantity}x ${item.name}`,
          action: (
            <ToastAction 
              altText="View cart"
              onClick={() => {
                onClose();
                navigate(RouteMap.cart());
              }}
            >
              View Cart
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to cart",
          variant: "destructive",
        });
      }

      onClose();
    }
  };

  const handleReplaceCart = async () => {
    // Clear existing cart
    clearCart();
    setShowCartReplacementModal(false);
    
    // Proceed with adding new item
    await proceedWithAddToCart();
  };

  if (!item) {
    return (
      <div className="flex flex-col h-full">
        {/* Grabber */}
        <div className="flex justify-center pt-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Skeleton Loader */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="aspect-square rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  const descriptionLong = item.description && item.description.length > 150;
  const hasSelectedPersonalizations = selectedPersonalizations.length > 0;
  const isCustomizable = item.isCustomizable || false;

  return (
    <div className="flex flex-col h-full">
      {/* Grabber - Swiggy 2025 pattern */}
      <div className="flex justify-center pt-2">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-0">
        {/* Image Carousel */}
        <div className="space-y-3 mb-4">
          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent>
              {item.images?.map((image: string, index: number) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={`${item.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {/* Fallback gift icon */}
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                      <Gift className="w-12 h-12" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          
          {/* Dot Indicators */}
          {item.images && item.images.length > 1 && (
            <div className="flex justify-center">
              <div className="flex gap-1">
                {item.images.map((_: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => carouselApi?.scrollTo(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      idx === currentSlide 
                        ? "w-6 bg-primary" 
                        : "w-1.5 bg-muted-foreground/30"
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold flex-1 pr-2">{item.name}</h3>
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="p-1 hover:bg-muted rounded-md transition-colors"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart 
                className={cn(
                  "h-5 w-5 transition-colors",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )} 
              />
            </button>
          </div>
          
          {/* Partner info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className="font-medium text-foreground">{partnerData?.name || 'Partner Name'}</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{item.rating}</span>
            </div>
            <span>•</span>
            <span>{item.ratingCount || 156} ratings</span>
            <span>•</span>
            <span>{partnerData?.delivery || '2-3 days'}</span>
          </div>
          
          {/* Price */}
          <div className="text-2xl font-bold text-primary">
            ₹{item.price.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-4" />

        {/* CUSTOMIZATION SECTION */}
        
        {/* Quantity */}
        <div className="mb-4">
          <Stepper value={quantity} onChange={setQuantity} min={1} max={99} />
        </div>

        {/* Personalizations */}
        {item.personalizations && item.personalizations.length > 0 && (
          <>
            <div className="border-t my-4" />
            <div className="mb-4">
              <Label className="text-sm font-medium mb-3 block">Personalization</Label>
              <div className="space-y-3">
                {item.personalizations.map((personalization: any) => (
                  <div key={personalization.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={personalization.id}
                      checked={selectedPersonalizations.includes(personalization.id)}
                      onCheckedChange={() => handlePersonalizationToggle(personalization.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={personalization.id}
                        className="text-sm font-normal cursor-pointer flex items-center justify-between"
                      >
                        <span>{personalization.name || personalization.label}</span>
                        <span className={cn(
                          "text-sm font-medium",
                          personalization.price > 0 ? "text-foreground" : "text-green-600"
                        )}>
                          {personalization.price > 0 
                            ? `+₹${personalization.price.toLocaleString('en-IN')}` 
                            : 'FREE'
                          }
                        </span>
                      </Label>
                      {personalization.instruction && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {personalization.instruction}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="border-t my-4" />

        {/* INFORMATION SECTION */}
        
        {/* Description */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">About</Label>
          <div className="space-y-2">
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              !isDescriptionExpanded && "line-clamp-3"
            )}>
              {item.description || "This beautifully crafted item is perfect for any occasion. Made with premium materials and attention to detail."}
            </p>
            {descriptionLong && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-sm text-primary font-medium hover:underline"
              >
                {isDescriptionExpanded ? 'Show less ↑' : 'Read more ↓'}
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-4" />

        {/* Delivery */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Delivery</Label>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Ready in: 24 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Delivery: 2-3 days</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Ships from: Koramangala</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t my-4" />

        {/* Details */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Details</Label>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• {item.specs?.material || '100% cotton'}</li>
            <li>• {item.specs?.quality || 'Premium print quality'}</li>
            <li>• {item.specs?.dimensions || '30×20×15 cm'}</li>
            <li>• Weight: {item.specs?.weight || '250g'}</li>
          </ul>
        </div>

        {/* Divider */}
        <div className="border-t my-4" />

        {/* Return Policy */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Returns</Label>
          {isCustomizable ? (
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                No returns on personalized items
              </p>
              <p className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Defects covered within 48h
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-green-600">
                <Undo className="h-4 w-4" />
                7-day return available
              </p>
              <p className="text-muted-foreground">
                📦 Delivery charges apply
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Footer with Add Button */}
      <div className="sticky bottom-0 bg-white border-t border-border p-4">
        {hasSelectedPersonalizations ? (
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item ({quantity}×)</span>
                <span className="text-foreground">₹{(item.price * quantity).toLocaleString('en-IN')}</span>
              </div>
              {selectedPersonalizations.map((id) => {
                const personalization = item.personalizations?.find((p: any) => p.id === id);
                if (!personalization) return null;
                return (
                  <div key={id} className="flex justify-between">
                    <span className="text-muted-foreground">{personalization.name || personalization.label}</span>
                    <span className="text-foreground">
                      {personalization.price > 0 
                        ? `+₹${personalization.price.toLocaleString('en-IN')}` 
                        : 'FREE'
                      }
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{calculateTotal().toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full h-12 text-base"
              size="lg"
            >
              Add to Cart
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total</span>
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
        )}
      </div>

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
