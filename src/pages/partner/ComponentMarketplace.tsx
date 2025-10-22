/**
 * Component Marketplace
 * Partners can browse and source components from other vendors
 * Wholesale pricing visible only to partners (not customers)
 * Used for building hampers/combos
 */

import { useState, useEffect } from "react";
import { Search, Filter, Package, TrendingUp, Clock, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";

interface ComponentProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_description: string;
  product_images: string[];
  wholesale_price: number; // in paise
  wholesale_moq: number;
  retail_price: number; // for comparison
  current_stock: number;
  lead_time_days: number;
  supplier_name: string;
  supplier_location?: string;
  supplier_rating: number;
  category?: string;
  add_ons?: Array<{ name: string; price: number; moq: number }>;
}

export const ComponentMarketplace = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState<ComponentProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("price-low");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  useEffect(() => {
    loadComponents();
  }, [categoryFilter, sortBy]);

  const loadComponents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('component_products')
        .select(`
          *,
          partner_products!inner(
            id,
            name,
            description,
            images,
            price,
            category,
            add_ons
          ),
          partner_profiles!inner(
            business_name,
            location,
            rating
          )
        `)
        .eq('available_for_sourcing', true)
        .gt('current_stock', 0);

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('partner_products.category', categoryFilter);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('wholesale_price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('wholesale_price', { ascending: false });
          break;
        case 'lead-time':
          query = query.order('lead_time_days', { ascending: true });
          break;
        case 'rating':
          query = query.order('supplier_rating', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Components fetch failed, using mock:', error);
        // Mock data for development
        setComponents([
          {
            id: '1',
            product_id: 'p1',
            product_name: 'Boat Rockerz 450 Bluetooth Headphones',
            product_description: 'Premium wireless headphones with 15h battery',
            product_images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1505740420928-5e560c06d30e'],
            wholesale_price: 120000, // ₹1,200 wholesale (retail ₹1,999)
            wholesale_moq: 20,
            retail_price: 199900,
            current_stock: 450,
            lead_time_days: 2,
            supplier_name: 'Boat Audio India',
            supplier_location: 'Mumbai, Maharashtra',
            supplier_rating: 4.8,
            category: 'electronics',
            add_ons: [
              { name: 'Gift Wrapping', price: 5000, moq: 1 },
              { name: 'Company Logo Engraving', price: 20000, moq: 50 },
            ],
          },
          {
            id: '2',
            product_id: 'p2',
            product_name: 'Premium Chocolate Box (12 pieces)',
            product_description: 'Handmade Belgian chocolates in premium packaging',
            product_images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1511381939415-e44015466834'],
            wholesale_price: 50000, // ₹500 wholesale (retail ₹799)
            wholesale_moq: 10,
            retail_price: 79900,
            current_stock: 200,
            lead_time_days: 1,
            supplier_name: 'ChocoCraft Delights',
            supplier_location: 'Bangalore, Karnataka',
            supplier_rating: 4.7,
            category: 'chocolates',
          },
          {
            id: '3',
            product_id: 'p3',
            product_name: 'Scented Candle Set (3 pieces)',
            product_description: 'Aromatic candles in decorative jars',
            product_images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1602874801006-5e0402131da0'],
            wholesale_price: 35000, // ₹350 wholesale (retail ₹599)
            wholesale_moq: 15,
            retail_price: 59900,
            current_stock: 180,
            lead_time_days: 3,
            supplier_name: 'Aroma Essence',
            supplier_location: 'Delhi, NCR',
            supplier_rating: 4.6,
            category: 'home_decor',
          },
        ]);
      } else {
        const formattedData = (data || []).map((c: any) => ({
          id: c.id,
          product_id: c.product_id,
          product_name: c.partner_products.name,
          product_description: c.partner_products.description,
          product_images: c.partner_products.images,
          wholesale_price: c.wholesale_price,
          wholesale_moq: c.wholesale_moq,
          retail_price: c.partner_products.price,
          current_stock: c.current_stock,
          lead_time_days: c.lead_time_days,
          supplier_name: c.partner_profiles.business_name,
          supplier_location: c.partner_profiles.location,
          supplier_rating: c.supplier_rating || c.partner_profiles.rating,
          category: c.partner_products.category,
          add_ons: c.partner_products.add_ons,
        }));
        setComponents(formattedData);
      }
    } catch (error) {
      console.error('Load components error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredComponents = components.filter(c =>
    c.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToHamper = (componentId: string) => {
    setSelectedComponents(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
    
    toast({
      title: "Component selected",
      description: "Add more components or build your hamper",
    });
  };

  const calculateSavings = (wholesale: number, retail: number) => {
    const savings = retail - wholesale;
    const percentage = Math.round((savings / retail) * 100);
    return { savings, percentage };
  };

  if (loading) {
    return <div className="p-8 text-center">Loading component marketplace...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Component Marketplace</h1>
        <p className="text-muted-foreground">
          Source components from verified suppliers for your hampers
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components or suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="chocolates">Chocolates</SelectItem>
              <SelectItem value="home_decor">Home Decor</SelectItem>
              <SelectItem value="premium">Premium Gifts</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="lead-time">Lead Time</SelectItem>
              <SelectItem value="rating">Supplier Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Components Bar */}
      {selectedComponents.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedComponents.length} component(s) selected
              </span>
              <Button size="sm" onClick={() => {/* Navigate to hamper builder */}}>
                Build Hamper →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComponents.map((component) => {
          const savings = calculateSavings(component.wholesale_price, component.retail_price);
          const isSelected = selectedComponents.includes(component.id);

          return (
            <Card
              key={component.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleAddToHamper(component.id)}
            >
              <CardContent className="p-4">
                {/* Product Image */}
                <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={component.product_images[0] || '/placeholder.svg'}
                    alt={component.product_name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-white rounded-full p-2">
                        <Package className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {component.product_name}
                  </h3>

                  {/* Supplier */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{component.supplier_name}</span>
                    {component.supplier_rating > 0 && (
                      <span>⭐ {component.supplier_rating.toFixed(1)}</span>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-primary">
                        ₹{(component.wholesale_price / 100).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{(component.retail_price / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Save {savings.percentage}% • Wholesale Price
                    </Badge>
                  </div>

                  {/* MOQ & Stock */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      MOQ: {component.wholesale_moq} units
                    </span>
                    <span className={component.current_stock > 50 ? 'text-green-600' : 'text-amber-600'}>
                      {component.current_stock} in stock
                    </span>
                  </div>

                  {/* Lead Time & Location */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {component.lead_time_days}d delivery
                    </span>
                    {component.supplier_location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {component.supplier_location.split(',')[0]}
                      </span>
                    )}
                  </div>

                  {/* Add-ons */}
                  {component.add_ons && component.add_ons.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Available Add-ons:</p>
                      <div className="space-y-1">
                        {component.add_ons.slice(0, 2).map((addon, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span>{addon.name}</span>
                            <span className="font-medium">
                              +₹{(addon.price / 100).toFixed(0)} (MOQ: {addon.moq})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToHamper(component.id);
                    }}
                  >
                    {isSelected ? 'Selected ✓' : 'Add to Hamper'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredComponents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No components found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fixed Bottom Bar (if components selected) */}
      {selectedComponents.length > 0 && (
        <div className="fixed bottom-20 md:bottom-4 left-0 right-0 p-4 bg-background border-t shadow-lg">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-semibold">{selectedComponents.length} components selected</p>
              <p className="text-xs text-muted-foreground">
                Ready to build hamper
              </p>
            </div>
            <Button size="lg">
              Build Hamper →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

