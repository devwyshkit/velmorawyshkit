import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { addToCartSupabase } from "@/lib/integrations/supabase-data";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { cn } from "@/lib/utils";

interface QuickReorderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  item_image_url?: string;
  store_id: string;
}

export const QuickReorderSheet = ({
  isOpen,
  onClose,
  orderId,
}: QuickReorderSheetProps) => {
  const navigate = useNavigate();
  const { refreshCartCount } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load order items when sheet opens
  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderItems();
    }
  }, [isOpen, orderId]);

  const loadOrderItems = async () => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, item_id, item_name, quantity, price, item_image_url, store_id')
        .eq('order_id', orderId);

      if (items && !itemsError) {
        setOrderItems(items);
        setUnavailableItems([]);
        setAddedItems([]);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading order items:', err);
      setError('Failed to load order items');
    }
  };

  const handleReorder = async () => {
    if (orderItems.length === 0) return;

    setLoading(true);
    setError(null);
    setUnavailableItems([]);
    setAddedItems([]);

    const unavailable: string[] = [];
    const added: string[] = [];

    try {
      // Add each item to cart
      for (const item of orderItems) {
        try {
          // Check if item still exists and is available
          const { data: product, error: productError } = await supabase
            .from('store_items')
            .select('id, is_available')
            .eq('id', item.item_id)
            .single();

          if (productError || !product || !product.is_available) {
            unavailable.push(item.item_name);
            continue;
          }

          // Add to cart - need to fetch item details first
          const { data: itemDetails } = await supabase
            .from('store_items')
            .select('name, image')
            .eq('id', item.item_id)
            .single();

          const success = await addToCartSupabase({
            id: item.item_id,
            name: itemDetails?.name || item.item_name,
            price: item.price,
            quantity: item.quantity,
            image: itemDetails?.image || item.item_image_url || '',
            store_id: item.store_id,
          });

          if (success) {
            added.push(item.item_name);
          } else {
            unavailable.push(item.item_name);
          }
        } catch (err) {
          console.error(`Error adding ${item.item_name} to cart:`, err);
          unavailable.push(item.item_name);
        }
      }

      setUnavailableItems(unavailable);
      setAddedItems(added);
      refreshCartCount();

      // If all items were added, navigate to cart after a short delay
      if (unavailable.length === 0 && added.length > 0) {
        setTimeout(() => {
          onClose();
          navigate(RouteMap.home()); // Will open cart sheet from header
        }, 1000);
      }
    } catch (err) {
      console.error('Error during reorder:', err);
      setError('Failed to add items to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Quick Reorder</SheetTitle>
          <SheetDescription>
            Add all items from this order to your cart
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Order Items List */}
          {orderItems.length > 0 ? (
            <div className="space-y-3">
              {orderItems.map((item) => {
                const isUnavailable = unavailableItems.includes(item.item_name);
                const isAdded = addedItems.includes(item.item_name);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      isUnavailable && "bg-muted/50 border-destructive/20",
                      isAdded && "bg-green-50 border-green-200"
                    )}
                  >
                    {item.item_image_url && (
                      <img
                        src={item.item_image_url}
                        alt={item.item_name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isUnavailable && (
                        <Badge variant="destructive" className="text-xs">
                          Unavailable
                        </Badge>
                      )}
                      {isAdded && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items found in this order</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Unavailable Items Warning */}
          {unavailableItems.length > 0 && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm font-medium mb-1">Some items unavailable:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {unavailableItems.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {addedItems.length > 0 && unavailableItems.length === 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ {addedItems.length} item{addedItems.length > 1 ? 's' : ''} added to cart
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button
              onClick={handleReorder}
              disabled={loading || orderItems.length === 0}
              className="w-full"
              size="lg"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              {loading ? "Adding to Cart..." : "Reorder All Items"}
            </Button>

            {unavailableItems.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  navigate(RouteMap.home());
                }}
                className="w-full"
              >
                View Cart ({addedItems.length} items)
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

