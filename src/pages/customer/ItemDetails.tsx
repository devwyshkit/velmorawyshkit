import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RouteMap } from "@/routes";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useCart } from "@/contexts/CartContext";
import { isAuthenticated } from "@/lib/integrations/supabase-client";
import { fetchItemById, addToCartSupabase, fetchPartnerById, type Item as ItemType } from "@/lib/integrations/supabase-data";
import { ProductDetail } from "@/features/customer/product/components/ProductDetail";
import { ProductCard } from "@/features/customer/product/components/ProductCard";
import { CustomerProductDisplay } from "@/types/tiered-pricing";

export const ItemDetailsNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCartCount, currentPartnerId, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ItemType | null>(null);
  const [product, setProduct] = useState<CustomerProductDisplay | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const loadItemData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const itemData = await fetchItemById(id);
        setItem(itemData);
        
        // Convert to CustomerProductDisplay format
        if (itemData) {
          const customerProduct: CustomerProductDisplay = {
            id: itemData.id,
            name: itemData.name,
            description: itemData.description,
            category: itemData.category || 'General',
            images: itemData.images || ['/placeholder.svg'],
            listingType: itemData.listing_type || 'individual',
            whatsIncluded: itemData.whats_included || [],
            currentPrice: itemData.price / 100, // Convert from paise to rupees
            originalPrice: itemData.original_price ? itemData.original_price / 100 : undefined,
            discount: itemData.discount,
            pricingTiers: itemData.tiered_pricing?.map((tier: any) => ({
              quantity: tier.maxQty ? `${tier.minQty}-${tier.maxQty}` : `${tier.minQty}+`,
              price: tier.pricePerItem / 100, // Convert from paise to rupees
              discountPercent: tier.discountPercent || 0
            })) || [{
              quantity: '1+',
              price: itemData.price / 100,
              discountPercent: 0
            }],
            deliveryTime: itemData.delivery_time || '2-3 days',
            isInStock: itemData.stock > 0,
            stockCount: itemData.stock,
            isCustomizable: itemData.is_customizable || false,
            addOns: itemData.add_ons?.map((addon: any) => ({
              id: addon.id,
              name: addon.name,
              price: addon.price_paise / 100, // Convert from paise to rupees
              minimumOrderQuantity: addon.minimum_order_quantity || 1,
              requiresProof: addon.requires_proof || false,
              description: addon.description
            })) || [],
            vendor: {
              id: itemData.partner_id,
              name: itemData.partner_name || 'Vendor',
              rating: itemData.partner_rating || 4.5,
              reviewCount: itemData.partner_review_count || 100
            },
            rating: itemData.rating || 4.5,
            reviewCount: itemData.review_count || 100,
            isWishlisted: false
          };
          
          setProduct(customerProduct);
        }
      } catch (error) {
        // Handle error silently in production
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

  const handleAddToCart = async (quantity: number, selectedAddOns: string[], customizationData?: any) => {
    if (!item) return;

    try {
      if (!isAuthenticated()) {
        navigate(RouteMap.login());
      } else {
        // Handle authenticated cart
        const cartItem = {
          id: item.id,
          name: item.name,
          price: item.price / 100,
          quantity,
          partner_id: item.partner_id,
          addOns: selectedAddOns.map(id => product?.addOns.find(a => a.id === id)).filter(Boolean),
          customization: customizationData
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
                onClick={() => navigate(RouteMap.cart())}
              >
                View Cart
              </ToastAction>
            ),
          });
        } else {
          throw new Error('Failed to add to cart');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleWishlist = async () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: item?.name,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerMobileHeader />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  if (!item || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerMobileHeader />
        <div className="p-4 text-center">
          <h1 className="text-xl font-semibold mb-2">Product not found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(RouteMap.home())}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back to home
          </button>
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerMobileHeader />
      
      {/* Desktop/Tablet View */}
      <div className="hidden md:block max-w-6xl mx-auto p-6">
        <ProductDetail
          product={product}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
        />
      </div>

      {/* Mobile View */}
      <div className="md:hidden p-4">
        <ProductDetail
          product={product}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
        />
      </div>

      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};
