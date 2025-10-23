/**
 * Wyshkit Supply Portal - B2B Procurement
 * Mobile-first wholesale product sourcing
 * Swiggy/Zomato pattern with B2C friendly language
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyStates } from '@/components/ui/empty-state';
import { SkeletonComponents, OptimizedImage } from '@/components/ui/skeleton-screen';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Package, 
  Truck, 
  Star, 
  Plus, 
  Minus,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  TrendingUp
} from 'lucide-react';
import { SupplyProduct, SupplyCartItem, SupplyOrder } from '@/types/tiered-pricing';

// Mock data for demonstration
const mockProducts: SupplyProduct[] = [
  {
    id: '1',
    name: 'Boat Airdopes 131 - Wireless Earbuds (Wholesale)',
    brand: 'Boat Lifestyle',
    category: 'Electronics',
    wholesalePricePaise: 85000, // ₹850 (true trade price)
    mrpPaise: 299900, // ₹2,999 (for reference only)
    minimumOrder: 50, // B2B minimum
    maximumOrder: 500,
    stockAvailable: 500,
    leadTimeDays: 3,
    marginOpportunityPaise: 0, // Not applicable for wholesale
    images: ['/api/placeholder/300/300'],
    description: 'Premium wireless earbuds with active noise cancellation - For authorized business resale only',
    specifications: ['Bluetooth 5.0', '20 hours playback', 'IPX4 water resistant'],
    warranty: '1 year manufacturer warranty',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Noise ColorFit Pro 4 Smartwatch (Wholesale)',
    brand: 'Noise',
    category: 'Electronics',
    wholesalePricePaise: 150000, // ₹1,500 (true trade price)
    mrpPaise: 399900, // ₹3,999 (for reference only)
    minimumOrder: 25, // B2B minimum
    maximumOrder: 300,
    stockAvailable: 200,
    leadTimeDays: 5,
    marginOpportunityPaise: 0, // Not applicable for wholesale
    images: ['/api/placeholder/300/300'],
    description: 'Advanced fitness tracking with AMOLED display - For authorized business resale only',
    specifications: ['1.78" AMOLED', 'SpO2 monitoring', '7-day battery'],
    warranty: '1 year manufacturer warranty',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Premium Wooden Gift Boxes (Wholesale)',
    brand: 'Elite Packaging',
    category: 'Packaging',
    wholesalePricePaise: 6000, // ₹60 (true trade price)
    mrpPaise: 20000, // ₹200 (for reference only)
    minimumOrder: 100, // B2B minimum
    maximumOrder: 1000,
    stockAvailable: 1000,
    leadTimeDays: 7,
    marginOpportunityPaise: 0, // Not applicable for wholesale
    images: ['/api/placeholder/300/300'],
    description: 'Luxury wooden gift boxes for premium hampers - For authorized business resale only',
    specifications: ['Natural wood finish', 'Velvet interior', 'Customizable'],
    warranty: 'No warranty',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const categories = [
  'All Categories',
  'Electronics',
  'Gourmet',
  'Wellness',
  'Packaging',
  'Lifestyle',
  'Home & Kitchen'
];

const brands = [
  'Boat',
  'Noise',
  'boAt',
  'Portronics',
  'Cadbury',
  'Ferrero',
  'Elite Packaging'
];

interface WyshkitSupplyPortalProps {
  className?: string;
}

export const WyshkitSupplyPortal: React.FC<WyshkitSupplyPortalProps> = ({
  className
}) => {
  const [products, setProducts] = useState<SupplyProduct[]>(mockProducts);
  const [cart, setCart] = useState<SupplyCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedBrand, setSelectedBrand] = useState('All Brands');
  const [sortBy, setSortBy] = useState('name');
  const [activeTab, setActiveTab] = useState('browse');

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
    const matchesBrand = selectedBrand === 'All Brands' || product.brand === selectedBrand;
    
    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return a.wholesalePricePaise - b.wholesalePricePaise;
      case 'margin':
        return b.marginOpportunityPaise - a.marginOpportunityPaise;
      case 'stock':
        return b.stockAvailable - a.stockAvailable;
      default:
        return 0;
    }
  });

  const addToCart = (product: SupplyProduct, quantity: number) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity, totalPricePaise: (item.quantity + quantity) * product.wholesalePricePaise }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity,
        totalPricePaise: quantity * product.wholesalePricePaise
      }]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity, totalPricePaise: quantity * item.product.wholesalePricePaise }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.totalPricePaise, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const formatPrice = (paise: number) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const renderProductCard = (product: SupplyProduct) => (
    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative">
          <OptimizedImage
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            width={300}
            height={192}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          {product.isVerified && (
            <Badge className="absolute top-2 left-2 bg-green-600 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              by {product.brand}
            </p>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trade Price</span>
              <span className="text-xl font-bold">{formatPrice(product.wholesalePricePaise)}/unit</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Platform Fee (2%)</span>
              <span className="text-sm text-muted-foreground">
                {formatPrice(product.wholesalePricePaise * 0.02)}/unit
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Cost</span>
              <span className="text-lg font-semibold text-blue-600">
                {formatPrice(product.wholesalePricePaise * 1.02)}/unit
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MRP (for reference)</span>
              <span className="text-sm line-through text-muted-foreground">
                {formatPrice(product.mrpPaise)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
              💡 Suggested retail: ₹2,200-2,500
            </div>
          </div>

          {/* Order Requirements */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minimum Order</span>
              <span className="font-medium">{product.minimumOrder} units</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Stock Available</span>
              <span className="font-medium">{product.stockAvailable} units</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Time</span>
              <span className="font-medium">{product.leadTimeDays} days</span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const qty = Math.max(product.minimumOrder, 1);
                  addToCart(product, qty);
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={product.minimumOrder}
                max={product.maximumOrder}
                defaultValue={product.minimumOrder}
                className="w-20 text-center"
                onChange={(e) => {
                  const qty = parseInt(e.target.value) || product.minimumOrder;
                  if (qty >= product.minimumOrder && qty <= product.maximumOrder) {
                    addToCart(product, qty);
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const qty = Math.min(product.maximumOrder, product.minimumOrder + 10);
                  addToCart(product, qty);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // View product details
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Details
            </Button>
            <Button
              size="sm"
              onClick={() => {
                addToCart(product, product.minimumOrder);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCartItem = (item: SupplyCartItem) => (
    <Card key={item.product.id}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <OptimizedImage
            src={item.product.images[0] || '/placeholder.svg'}
            alt={item.product.name}
            width={64}
            height={64}
            className="w-16 h-16 object-cover rounded"
            loading="lazy"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2">
              {item.product.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              by {item.product.brand}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-sm">{formatPrice(item.totalPricePaise)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(item.product.wholesalePricePaise)} each
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => removeFromCart(item.product.id)}
          >
            <Minus className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* B2B Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">⚠️ B2B Wholesale Marketplace</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Authorized business resale only. Not for retail customers. All prices are trade/distributor pricing.
              Minimum order quantities apply. Business verification required.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Wyshkit Supply</h1>
            <p className="text-muted-foreground">
              Source authentic products from verified brands at wholesale prices
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Brands">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="margin">Margin</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Browse Products
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Cart ({getCartItemCount()})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Featured Brands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Featured Brands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {brands.map((brand) => (
                  <Badge
                    key={brand}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground whitespace-nowrap"
                    onClick={() => setSelectedBrand(brand)}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProducts.map(renderProductCard)}
          </div>

          {sortedProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cart" className="space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Add some products to get started
              </p>
              <Button onClick={() => setActiveTab('browse')}>
                Browse Products
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {cart.map(renderCartItem)}
              </div>

              {/* Cart Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Items ({getCartItemCount()})</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Brand Commission (7%)</span>
                    <span>{formatPrice(getCartTotal() * 0.07)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Platform Fee (2%)</span>
                    <span>{formatPrice(getCartTotal() * 0.02)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>GST (18%)</span>
                    <span>{formatPrice(getCartTotal() * 1.09 * 0.18)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(getCartTotal() * 1.29)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Checkout Button */}
              <Button className="w-full h-12 text-lg font-semibold">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Request Business Quote
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WyshkitSupplyPortal;
