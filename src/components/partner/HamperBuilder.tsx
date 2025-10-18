/**
 * Hamper Builder Component
 * Partner can create curated gift bundles by mixing own + sourced products (Swiggy combo pattern)
 * Two-step shipping: Vendor → Curator → Customer
 */

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/integrations/supabase-client';
import type { HamperComponent } from '@/lib/integrations/supabase-data';

interface HamperBuilderProps {
  components: HamperComponent[];
  onChange: (components: HamperComponent[]) => void;
  curatorLocation: string; // Partner's location for nearest stock routing
  partnerId: string;
}

export const HamperBuilder = ({ 
  components, 
  onChange, 
  curatorLocation, 
  partnerId 
}: HamperBuilderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [ownProducts, setOwnProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load partner's own products
  useEffect(() => {
    loadOwnProducts();
  }, [partnerId]);

  const loadOwnProducts = async () => {
    try {
      const { data } = await supabase
        .from('partner_products')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('is_active', true);
      
      setOwnProducts(data || []);
    } catch (error) {
      console.error('Failed to load own products:', error);
    }
  };

  // Search partner products (for sourcing)
  const searchPartnerProducts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('partner_products')
        .select(`
          *,
          partner_profiles!inner(
            id,
            business_name,
            city,
            state
          )
        `)
        .neq('partner_id', partnerId) // Exclude own products
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(20);

      // Calculate wholesale price (15% discount) and add location info
      const productsWithWholesale = (data || []).map(p => ({
        ...p,
        wholesale_price: Math.floor(p.price * 0.85), // 15% discount
        partner_name: p.partner_profiles.business_name,
        partner_location: `${p.partner_profiles.city}, ${p.partner_profiles.state}`,
      }));

      setSearchResults(productsWithWholesale);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add component to hamper
  const addComponent = (product: any, source: 'own' | 'vendor') => {
    // Check if already added
    if (components.some(c => c.product_id === product.id)) {
      return; // Don't add duplicates
    }

    const component: HamperComponent = {
      product_id: product.id,
      partner_id: source === 'vendor' ? product.partner_id : partnerId,
      name: product.name,
      quantity: 1,
      wholesale_price: source === 'vendor' ? product.wholesale_price : product.price,
      location: curatorLocation, // Ship to curator location
      image_url: product.image_url,
    };

    onChange([...components, component]);
    setSearchQuery(''); // Clear search
    setSearchResults([]);
  };

  // Remove component
  const removeComponent = (index: number) => {
    onChange(components.filter((_, i) => i !== index));
  };

  // Update component quantity
  const updateQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...components];
    updated[index].quantity = qty;
    onChange(updated);
  };

  // Calculate totals
  const totalCost = components.reduce(
    (sum, c) => sum + (c.wholesale_price * c.quantity),
    0
  );

  const componentCount = components.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Add Components Tabs */}
      <Tabs defaultValue="own" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="own">
            <Package className="h-4 w-4 mr-2" />
            My Products
          </TabsTrigger>
          <TabsTrigger value="partner">
            <Search className="h-4 w-4 mr-2" />
            Partner Products (Sourcing)
          </TabsTrigger>
        </TabsList>

        {/* Own Inventory Tab */}
        <TabsContent value="own" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add products from your own catalog
          </p>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {ownProducts.map((product) => (
              <Card
                key={product.id}
                className="p-3 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => addComponent(product, 'own')}
              >
                <div className="flex gap-3 items-center">
                  <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {product.total_stock} • ₹{(product.price / 100).toFixed(0)}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Partner Product Sourcing Tab */}
        <TabsContent value="partner" className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Search and source products from other partners (wholesale pricing, auto-routing)
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products (e.g., Boat Airdopes, Chocolates)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchPartnerProducts(e.target.value);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Search Results */}
          {loading && <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>}
          
          {searchQuery && searchResults.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((product) => (
                <Card
                  key={product.id}
                  className="p-3 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => addComponent(product, 'vendor')}
                >
                  <div className="flex gap-3 items-center">
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded object-cover" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        by {product.partner_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        📍 {product.partner_location} • Stock: {product.total_stock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">₹{(product.wholesale_price / 100).toFixed(0)}</p>
                      <p className="text-xs text-green-600">Wholesale (15% off)</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Sourced
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {searchQuery && !loading && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products found. Try different keywords.
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected Components List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Hamper Components ({components.length} items)
          </Label>
          {components.length === 0 && (
            <span className="text-xs text-muted-foreground">
              Add at least 2 products
            </span>
          )}
        </div>

        {components.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No components added yet</p>
              <p className="text-xs mt-1">Use tabs above to add products to your hamper</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {components.map((component, index) => {
              const isSourced = component.partner_id !== partnerId;
              return (
                <Card key={index} className="p-3">
                  <div className="flex gap-3 items-center">
                    <img 
                      src={component.image_url} 
                      alt={component.name} 
                      className="w-14 h-14 rounded object-cover" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{component.name}</p>
                        {isSourced && (
                          <Badge variant="outline" className="text-xs">
                            Sourced
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ₹{(component.wholesale_price / 100).toFixed(0)} × {component.quantity} = 
                        ₹{(component.wholesale_price * component.quantity / 100).toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(index, component.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                          {component.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(index, component.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComponent(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-Calculations Summary */}
      {components.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Auto-Calculations</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Component Cost:</span>
                <span className="font-bold">₹{(totalCost / 100).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Components:</span>
                <span className="font-medium">{componentCount} items</span>
              </div>

              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Suggested Markup (40%):</span>
                  <span>₹{(totalCost * 0.4 / 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-primary">
                  <span>Suggested Selling Price:</span>
                  <span>₹{(totalCost * 1.4 / 100).toFixed(0)}</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground space-y-1">
                <p className="flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Platform commission (15%) will be deducted from final price</span>
                </p>
                <p className="flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Sourced items shipped to you first for assembly</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

