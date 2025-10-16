import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Star, Plus, Minus } from "lucide-react";
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
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Stepper } from "@/components/customer/shared/Stepper";
import { LoginPromptSheet } from "@/components/customer/shared/LoginPromptSheet";
import { useToast } from "@/hooks/use-toast";
import { supabase, isAuthenticated, getGuestCart, setGuestCart } from "@/lib/integrations/supabase-client";
import { addToCartSupabase } from "@/lib/integrations/supabase-data";
import { useCart } from "@/contexts/CartContext";

interface ItemSheetContentProps {
  itemId: string;
  onClose: () => void;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
}

export const ItemSheetContent = ({ itemId, onClose }: ItemSheetContentProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCartCount } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Mock data - replace with actual Supabase query
  const item = {
    id: itemId,
    name: 'Premium Gift Hamper',
    description: 'Curated selection of premium items including gourmet treats, artisan chocolates, and luxury accessories. Perfect for any special occasion.',
    price: 2499,
    rating: 4.6,
    images: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
    ],
    specs: {
      weight: '2.5 kg',
      dimensions: '30cm x 20cm x 15cm',
      materials: 'Premium packaging with satin finish',
    },
  };

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

  const calculateTotal = () => {
    const basePrice = item.price * quantity;
    const addOnsPrice = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return sum + (addOn?.price || 0);
    }, 0);
    return basePrice + addOnsPrice;
  };

  const handleAddToCart = async () => {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      // Guest mode: save to localStorage
      const guestCart = getGuestCart();
      const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        addOns: selectedAddOns.map(id => addOns.find(a => a.id === id)).filter(Boolean),
        total: calculateTotal(),
      };
      guestCart.push(cartItem);
      setGuestCart(guestCart);
      refreshCartCount();

      toast({
        title: "Added to cart",
        description: "Sign in to checkout",
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

  return (
    <div className="flex flex-col h-full">
      {/* Grabber */}
      <div className="flex justify-center pt-2">
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
      </div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Item Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Image Carousel - Reduced height for less scrolling */}
        <Carousel className="w-full">
          <CarouselContent>
            {item.images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="h-56 rounded-xl overflow-hidden bg-muted">
                  <img
                    src={image}
                    alt={`${item.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>

        {/* Title and Rating */}
        <div>
          <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{item.rating}</span>
            </div>
            <span className="text-muted-foreground">• 156 ratings</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {item.description}
        </p>

        {/* Quantity Stepper */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quantity</Label>
          <Stepper value={quantity} onChange={setQuantity} min={1} max={99} />
        </div>

        {/* Add-ons */}
        {addOns.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Customize Your Gift</Label>
            <div className="space-y-3">
              {addOns.map((addOn) => (
                <div key={addOn.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={addOn.id}
                    checked={selectedAddOns.includes(addOn.id)}
                    onCheckedChange={() => handleAddOnToggle(addOn.id)}
                  />
                  <Label
                    htmlFor={addOn.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {addOn.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications & Compliance */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="specs">
            <AccordionTrigger className="text-sm font-medium">
              Product Specifications
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">Weight:</span>
                <span>{item.specs.weight}</span>
                <span className="font-medium">Dimensions:</span>
                <span>{item.specs.dimensions}</span>
                <span className="font-medium">Materials:</span>
                <span>{item.specs.materials}</span>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="compliance">
            <AccordionTrigger className="text-sm font-medium">
              Tax & Compliance
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <div className="space-y-1">
                <p><strong>HSN Code:</strong> 9985 (Business Support Services)</p>
                <p><strong>GST Rate:</strong> 18% (included in final price)</p>
                <p className="text-xs text-destructive mt-2">
                  Note: Custom items are non-refundable after proof approval
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Footer with Add Button */}
      <div className="sticky bottom-0 bg-white border-t border-border p-4">
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

      {/* Login Prompt Overlay */}
      <LoginPromptSheet
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </div>
  );
};

