/**
 * Partner Inventory Tracking Page
 * Location-based stock management with alerts and sourcing status (Swiggy/Zomato pattern)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, MapPin, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/integrations/supabase-client';
import { fetchPartnerProducts, type PartnerProduct } from '@/lib/integrations/supabase-data';

export const Inventory = () => {
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setPartnerId(profile.id);
        const fetchedProducts = await fetchPartnerProducts(profile.id);
        setProducts(fetchedProducts);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate low stock items
  const lowStockItems = products.filter(p => p.total_stock < 10);

  // Filter products by location
  const filteredProducts = locationFilter === 'all' 
    ? products 
    : products.filter(p => {
        const stockByLocation = p.stock_by_location || {};
        return stockByLocation[locationFilter] > 0;
      });

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <Package className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">
          Track stock levels across all locations
        </p>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{lowStockItems.length} items</strong> are running low on stock (less than 10 units)
          </AlertDescription>
        </Alert>
      )}

      {/* Location Tabs */}
      <Tabs value={locationFilter} onValueChange={setLocationFilter}>
        <TabsList>
          <TabsTrigger value="all">
            All Locations
          </TabsTrigger>
          <TabsTrigger value="delhi">
            <MapPin className="h-4 w-4 mr-2" />
            Delhi
          </TabsTrigger>
          <TabsTrigger value="bangalore">
            <MapPin className="h-4 w-4 mr-2" />
            Bangalore
          </TabsTrigger>
          <TabsTrigger value="mumbai">
            <MapPin className="h-4 w-4 mr-2" />
            Mumbai
          </TabsTrigger>
        </TabsList>

        <TabsContent value={locationFilter} className="mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredProducts.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredProducts.reduce((sum, p) => sum + p.total_stock, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive flex items-center gap-2">
                  {lowStockItems.length}
                  {lowStockItems.length > 0 && <TrendingDown className="h-5 w-5" />}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category}
                        </p>
                      </div>

                      {locationFilter === 'all' ? (
                        <>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Delhi</p>
                            <p className="font-medium">
                              {product.stock_by_location?.delhi || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Bangalore</p>
                            <p className="font-medium">
                              {product.stock_by_location?.bangalore || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Mumbai</p>
                            <p className="font-medium">
                              {product.stock_by_location?.mumbai || 0}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{locationFilter}</p>
                          <p className="font-medium">
                            {product.stock_by_location?.[locationFilter] || 0}
                          </p>
                        </div>
                      )}

                      <div className="text-right min-w-[100px]">
                        <p className="text-sm text-muted-foreground">Total Stock</p>
                        <p className="text-xl font-bold">{product.total_stock}</p>
                      </div>

                      <div>
                        {product.total_stock < 10 ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : product.total_stock < 50 ? (
                          <Badge variant="secondary">Medium</Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;

