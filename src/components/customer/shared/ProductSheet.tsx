import { useState, useEffect } from "react";
import {
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  MapPin,
  AlertCircle,
  CheckCircle,
  Undo,
  Gift,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Stepper } from "@/components/customer/shared/Stepper";
import { CartReplacementModal } from "@/components/customer/shared/CartReplacementModal";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/lib/integrations/supabase-client";
import {
  addToCartSupabase,
  fetchStoreById,
  fetchItemById,
  addToSavedItemsSupabase,
  removeFromSavedItemsSupabase,
  fetchSavedItems,
} from "@/lib/integrations/supabase-data";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { fetchReviews } from "@/lib/services/reviews";
import { formatDistanceToNow } from "date-fns";

interface ProductSheetProps {
  itemId: string;
  onClose: () => void;
}

export const ProductSheet = ({ itemId, onClose }: ProductSheetProps) => {
  const { toast } = useToast();
  const { refreshCartCount, currentStoreId, clearCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedPersonalizations, setSelectedPersonalizations] = useState<
    string[]
  >([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [item, setItem] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [showCartReplacementModal, setShowCartReplacementModal] =
    useState(false);
  const [currentStoreName, setCurrentStoreName] = useState<string>("");
  const [newStoreName, setNewStoreName] = useState<string>("");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  // Load item and partner data
  useEffect(() => {
    const loadItem = async () => {
      try {
        const itemData = await fetchItemById(itemId);
        if (itemData) {
          setItem({
            ...itemData,
            specs: itemData.specs || {
              weight: "2.5 kg",
              dimensions: "30cm x 20cm x 15cm",
              materials: "Premium packaging with satin finish",
            },
          });

          // Load store data
          if (itemData.store_id) {
            const storeData = await fetchStoreById(itemData.store_id);
            if (storeData) {
              setStore(storeData);
            }
          }
        } else {
          // Item not found - handle gracefully
          setItem(null);
        }

        // Check if item is favourited
        const savedItems = await fetchSavedItems();
        setIsFavourited(savedItems.some((w) => w.id === itemId));

        // Load reviews for this item
        try {
          const reviewsData = await fetchReviews('product', itemId);
          setReviews(reviewsData);
        } catch (reviewError) {
          console.error('Error loading reviews:', reviewError);
          // Reviews are non-critical, continue silently
        }
      } catch (error) {
        console.error('Error loading item:', error);
        setItem(null);
      }
    };
    loadItem();
  }, [itemId]);

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

  const handlePersonalizationToggle = (optionId: string) => {
    setSelectedPersonalizations((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  };

  const calculateTotal = () => {
    if (!item) return 0;

    // Base item price per unit
    const basePrice = item.price;

    // Add-ons price per unit
    const personalizationsPrice = selectedPersonalizations.reduce(
      (sum, optionId) => {
        const option = item.personalizations?.find(
          (p: any) => p.id === optionId,
        );
        return sum + (option?.price || 0);
      },
      0,
    );

    // Total = (Base + Add-ons) × Quantity (Swiggy pattern)
    return (basePrice + personalizationsPrice) * quantity;
  };

  const handleAddToCart = async () => {
    // Check if adding item from different store
    if (currentStoreId && currentStoreId !== item.store_id) {
      // Fetch store names for modal
      const currentStore = await fetchStoreById(currentStoreId);
      const newStore = await fetchStoreById(item.store_id);

      setCurrentStoreName(currentStore?.name || "Current Store");
      setNewStoreName(newStore?.name || "New Store");
      setShowCartReplacementModal(true);
      return;
    }

    // Same store or empty cart - proceed normally
    await proceedWithAddToCart();
  };

  const proceedWithAddToCart = async () => {
    const authenticated = await isAuthenticated();
    
    // Always allow add to cart (guest or authenticated)
    const personalizationsList = selectedPersonalizations
      .map((id) => item.personalizations?.find((p: any) => p.id === id))
      .filter(Boolean);
    const personalizationsTotal = personalizationsList.reduce(
      (sum: number, p: any) => sum + (p?.price || 0),
      0,
    );

    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price + personalizationsTotal, // Include personalizations in price
      quantity,
      store_id: item.store_id,
      addOns: personalizationsList,
      isCustomizable: item.isCustomizable || false,
      personalizations: personalizationsList,
    };

    if (authenticated) {
      // Authenticated: save to Supabase
      const success = await addToCartSupabase(cartItem);
      
      if (success) {
        refreshCartCount();
        // No toast - StickyCartBar provides feedback (Swiggy 2025 pattern)
      } else {
        // Show inline error instead of toast
        console.error('Failed to add item to cart');
      }
    } else {
      // Guest cart: Save to localStorage via addToCartSupabase (handles localStorage)
      const success = await addToCartSupabase(cartItem);
      
      if (success) {
        refreshCartCount();
        // No toast - StickyCartBar provides feedback (Swiggy 2025 pattern)
      } else {
        // Show inline error instead of toast
        console.error('Failed to add item to cart');
      }
    }

    onClose();
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
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Grabber - Swiggy 2025 pattern - OUTSIDE scroll container */}
      <div className="flex justify-center py-3">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Image Carousel */}
        <div className="space-y-3">
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
                        : "w-1.5 bg-muted-foreground/30",
                    )}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold flex-1">{item.name}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={async (e) => {
                e.stopPropagation();
                const success = isFavourited
                  ? await removeFromSavedItemsSupabase(item.id)
                  : await addToSavedItemsSupabase(item.id);

                if (success) {
                  setIsFavourited(!isFavourited);
                  // Swiggy 2025: Silent operation - heart icon state change provides visual feedback
                }
              }}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isFavourited
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground",
                )}
              />
            </Button>
          </div>

          {/* Partner, Rating, Distance */}
          {store && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <span className="font-medium text-foreground">{store.name}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{item.rating}</span>
                {item.ratingCount && <span>({item.ratingCount})</span>}
              </div>
              <span>•</span>
              <span>{store.delivery || "2-3 days"}</span>
            </div>
          )}

          {/* Price with discount */}
          <div className="flex items-baseline gap-2 mb-1">
            {item.mrp && item.mrp > item.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ₹{item.mrp.toLocaleString("en-IN")}
                </span>
                <Badge variant="destructive" className="text-xs">
                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                </Badge>
              </>
            )}
            <span className="text-2xl font-bold text-primary">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Quantity */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quantity</Label>
          <Stepper value={quantity} onChange={setQuantity} min={1} max={99} />
        </div>

        {/* Size (if exists) */}
        {item.variants?.sizes && (
          <>
            <div className="border-t border-border my-4" />
            <div>
              <Label className="text-sm font-medium mb-2">Size</Label>
              <div className="flex flex-wrap gap-2">
                {item.variants.sizes.map((size: any) => (
                  <Button
                    key={size.id}
                    variant={selectedSize === size.id ? "default" : "outline"}
                    size="sm"
                    className="h-10 min-w-[48px]"
                    onClick={() => setSelectedSize(size.id)}
                    disabled={!size.available}
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Color (if exists) */}
        {item.variants?.colors && (
          <>
            <div className="border-t border-border my-4" />
            <div>
              <Label className="text-sm font-medium mb-2">Color</Label>
              <div className="flex flex-wrap gap-3">
                {item.variants.colors.map((color: any) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    className={cn(
                      "relative w-8 h-8 rounded-full border-2 transition-all",
                      selectedColor === color.id
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border",
                    )}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  >
                    {selectedColor === color.id && (
                      <svg
                        className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Personalization (partner-defined) */}
        {item.personalizations && item.personalizations.length > 0 && (
          <>
            <div className="border-t border-border my-4" />
            <div>
              <Label className="text-sm font-medium mb-2 block">Add ons</Label>
              <div className="space-y-3">
                {item.personalizations.map((option: any) => (
                  <div key={option.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={selectedPersonalizations.includes(option.id)}
                      onCheckedChange={() =>
                        handlePersonalizationToggle(option.id)
                      }
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.id}
                        className="text-sm font-normal cursor-pointer flex items-center gap-2"
                      >
                        {option.label}
                        {option.price > 0 && (
                          <span className="text-primary font-medium">
                            +₹{option.price}
                          </span>
                        )}
                      </Label>
                      {option.instructions && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          💡 {option.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* File Upload Notice - Show if any selected personalization requires preview (Fiverr 2025) */}
        {selectedPersonalizations.some(id => {
          const option = item.personalizations?.find((p: any) => p.id === id);
          return option?.requiresPreview === true;
        }) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Upload className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">File upload required after payment</p>
                <p className="mt-1">You'll upload your design files after checkout. Our vendor will create a preview for your approval before production.</p>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Description */}
        <div>
          <Label className="text-sm font-medium mb-1.5">About</Label>
          <p
            className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              !isDescriptionExpanded && "line-clamp-3",
            )}
          >
            {item.description}
          </p>
          {item.description && item.description.length > 150 && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="text-sm text-primary font-medium mt-1.5 hover:underline inline-flex items-center gap-1"
            >
              {isDescriptionExpanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="border-t border-border my-4" />

        {/* Delivery */}
        <div>
          <Label className="text-sm font-medium mb-1.5">Delivery</Label>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {item.preparationTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Ready in: {item.preparationTime}</span>
              </div>
            )}
            {item.deliveryTime && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Delivery: {item.deliveryTime}</span>
              </div>
            )}
            {store?.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Ships from: {store.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* Product Details */}
        <div>
          <Label className="text-sm font-medium mb-1.5">Details</Label>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {item.specs?.materials && <li>• {item.specs.materials}</li>}
            {item.specs?.dimensions && <li>• {item.specs.dimensions}</li>}
            {item.specs?.weight && <li>• Weight: {item.specs.weight}</li>}
          </ul>
        </div>

        <div className="border-t border-border my-4" />

        {/* Return Policy */}
        <div>
          <Label className="text-sm font-medium mb-1.5">Returns</Label>
          {item.isCustomizable ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>No returns on personalized items</span>
              </div>
              <div className="flex items-start gap-2 text-green-600">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Defects covered within 48h of delivery</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-green-600">
                <Undo className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>7-day return available</span>
              </div>
              <p className="text-muted-foreground pl-6">
                Delivery charges apply as per marketplace policy
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="px-4 py-6 space-y-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Customer Reviews</h3>
            <Button variant="link" className="text-sm p-0 h-auto">
              View All ({reviews.length})
            </Button>
          </div>
          
          {/* Rating Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {reviews.length} rating{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = reviews.filter(r => r.rating === rating).length;
                const percentage = (count / reviews.length) * 100;
                return (
                  <div key={rating} className="flex items-center gap-2 text-xs">
                    <span className="w-8">{rating}★</span>
                    <div className="flex-1 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Recent Reviews */}
          <div className="space-y-3">
            {reviews.slice(0, 3).map((review: any) => (
              <div key={review.id} className="p-3 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    {review.is_verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </span>
                </div>
                {review.title && (
                  <h4 className="font-medium text-sm mb-1">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with Add Button */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
        {/* Price breakdown (if personalizations selected) */}
        {selectedPersonalizations.length > 0 && (
          <div className="mb-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Item ({quantity}×)</span>
              <span>₹{(item.price * quantity).toLocaleString("en-IN")}</span>
            </div>
            {selectedPersonalizations.map((id) => {
              const option = item.personalizations?.find(
                (p: any) => p.id === id,
              );
              return option ? (
                <div
                  key={id}
                  className="flex justify-between text-muted-foreground"
                >
                  <span>
                    {option.label} ({quantity}×)
                  </span>
                  <span>
                    +₹{(option.price * quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ) : null;
            })}
            <div className="border-t border-border pt-1" />
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">
            ₹{calculateTotal().toLocaleString("en-IN")}
          </span>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          Add to Cart • ₹{calculateTotal().toLocaleString("en-IN")}
        </Button>
      </div>

      {/* Cart Replacement Modal - Swiggy Pattern */}
      <CartReplacementModal
        isOpen={showCartReplacementModal}
        currentPartner={currentStoreName}
        newPartner={newStoreName}
        onConfirm={handleReplaceCart}
        onCancel={() => setShowCartReplacementModal(false)}
      />
    </div>
  );
};
