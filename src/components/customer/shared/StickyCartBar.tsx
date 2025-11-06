import { useState, useEffect } from "react";
import { ShoppingBag, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/customer/shared/CartSheet";
import { supabase } from "@/lib/integrations/supabase-client";
import { cn } from "@/lib/utils";
import { useScrollVisibility } from "@/contexts/ScrollContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Offer {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number;
  description?: string;
}

/**
 * StickyCartBar - Swiggy 2025 Pattern
 * 
 * Behavior:
 * - Hides/shows in sync with bottom nav on scroll
 * - Positioned directly above bottom nav (no gap)
 * - Height: ~48-56px (varies by content)
 * - Z-index: 45 (above content, below nav)
 * - Shows cart summary when items exist
 * - Shows promotional offers when cart is empty
 * 
 * Positioning:
 * - Bottom nav: bottom-0, height 56px (h-14)
 * - Banner: bottom-[56px] (directly above nav, no gap)
 * - Banner height: ~48-56px
 * - Content padding: pb-[112px] (56px nav + 56px banner)
 */
export const StickyCartBar = () => {
  const { cartCount, cartTotal } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const isMobile = useIsMobile();
  
  // Swiggy 2025: Banner syncs with bottom nav scroll behavior
  const { isHidden } = useScrollVisibility();

  // Load promotional offers when cart is empty (Swiggy 2025 pattern)
  useEffect(() => {
    if (cartCount === 0) {
      setLoadingOffers(true);
      supabase
        .from('promotional_offers')
        .select('id, title, discount_type, discount_value, description, end_date')
        .eq('status', 'active')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3)
        .then(({ data, error }) => {
          // Handle table not existing or any error gracefully (Swiggy 2025 pattern)
          if (error) {
            setOffers([]); // Return empty array on any error
          } else {
            setOffers(data || []);
          }
        })
        .catch(() => {
          // Silent error handling (Swiggy 2025 pattern)
          setOffers([]);
        })
        .finally(() => {
          setLoadingOffers(false);
        });
    } else {
      setOffers([]);
    }
  }, [cartCount]);

  return (
    <>
      {/* Persistent bar - syncs with bottom nav scroll (Swiggy 2025 pattern) */}
      {/* Swiggy 2025: Entire banner is clickable - opens cart whether empty or not */}
      <div 
        className={cn(
          "fixed left-0 right-0 z-[45]",
          // Mobile: Above bottom nav | Desktop: At bottom (no nav)
          isMobile ? "bottom-[56px]" : "bottom-0",
          "pwa-safe-bottom",
          "bg-background border-t border-border",
          "transition-transform duration-200",
          cartCount > 0 && "bg-primary text-primary-foreground shadow-lg",
          // Desktop: Always visible | Mobile: Sync with scroll
          isMobile && isHidden ? "translate-y-full" : "translate-y-0",
          // Swiggy 2025: Entire banner is clickable
          "cursor-pointer"
        )}
        onClick={() => setIsCartOpen(true)}
      >
        {cartCount > 0 ? (
          // Cart summary when items exist (Swiggy 2025 pattern)
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between min-h-[48px]">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
                <span className={cn("text-muted-foreground/70", cartCount > 0 && "text-primary-foreground/70")}>|</span>
                <span className="font-semibold">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="font-semibold text-sm flex-shrink-0">
              VIEW CART →
            </div>
          </div>
        ) : (
          // Promotional offers when cart is empty (Swiggy 2025 pattern)
          <div className="max-w-7xl mx-auto px-4 py-2.5 min-h-[48px] flex items-center">
            {loadingOffers ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground w-full">
                <span>Loading offers...</span>
              </div>
            ) : offers.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full">
                <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex gap-3 items-center">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md flex-shrink-0"
                    >
                      <span className="font-medium">{offer.title}</span>
                      {offer.discount_type === 'percentage' && (
                        <span className="font-semibold">
                          {offer.discount_value}% OFF
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Empty state - subtle placeholder (Swiggy 2025 pattern)
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground w-full">
                <ShoppingBag className="h-4 w-4" />
                <span>Your cart is empty</span>
              </div>
            )}
          </div>
        )}
      </div>
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
