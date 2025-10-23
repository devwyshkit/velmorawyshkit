/**
 * Wyshkit Supply - B2B Procurement Portal
 * Partners can source wholesale products from verified brands
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertCircle
} from 'lucide-react';

interface SupplyProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  wholesalePrice: number;
  mrp: number;
  minimumOrder: number;
  maximumOrder: number;
  stockAvailable: number;
  leadTimeDays: number;
  marginOpportunity: number;
  images: string[];
  description: string;
  specifications: string[];
  warranty: string;
  isVerified: boolean;
}

interface CartItem {
  product: SupplyProduct;
  quantity: number;
  totalPrice: number;
}

// Mock data for demonstration
const mockProducts: SupplyProduct[] = [
  {
    id: '1',
    name: 'Boat Airdopes 131 - Wireless Earbuds',
    brand: 'Boat Lifestyle',
    category: 'Electronics',
    wholesalePrice: 1000,
    mrp: 2999,
    minimumOrder: 10,
    maximumOrder: 500,
    stockAvailable: 500,
    leadTimeDays: 3,
    marginOpportunity: 1999,
    images: ['/api/placeholder/300/300'],
    description: 'Premium wireless earbuds with active noise cancellation',
    specifications: ['Bluetooth 5.0', '20 hours playback', 'IPX4 water resistant'],
    warranty: '1 year manufacturer warranty',
    isVerified: true
  },
  {
    id: '2',
    name: 'Noise ColorFit Pro 4 Smartwatch',
    brand: 'Noise',
    category: 'Electronics',
    wholesalePrice: 1800,
    mrp: 3999,
    minimumOrder: 20,
    maximumOrder: 300,
    stockAvailable: 200,
    leadTimeDays: 5,
    marginOpportunity: 2199,
    images: ['/api/placeholder/300/300'],
    description: 'Advanced fitness tracking with AMOLED display',
    specifications: ['1.78" AMOLED', 'SpO2 monitoring', '7-day battery'],
    warranty: '1 year manufacturer warranty',
    isVerified: true
  },
  {
    id: '3',
    name: 'Premium Wooden Gift Boxes',
    brand: 'Elite Packaging',
    category: 'Packaging',
    wholesalePrice: 80,
    mrp: 200,
    minimumOrder: 100,
    maximumOrder: 1000,
    stockAvailable: 1000,
    leadTimeDays: 7,
    marginOpportunity: 120,
    images: ['/api/placeholder/300/300'],
    description: 'Luxury wooden gift boxes for premium packaging',
    specifications: ['Solid wood construction', 'Velvet lining', 'Customizable'],
    warranty: 'Quality guarantee',
    isVerified: true
  }
];

export const WyshkitSupply: React.FC = () => {
  const [products, setProducts] = useState<SupplyProduct[]>(mockProducts);
  const [filteredProducts, setFilteredProducts] = useState<SupplyProduct[]>(mockProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<SupplyProduct | null>(null);

  const categories = ['all', 'Electronics', 'Packaging', 'Gourmet', 'Wellness'];

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: SupplyProduct, quantity: number) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity, totalPrice: (item.quantity + quantity) * product.wholesalePrice }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity,
        totalPrice: quantity * product.wholesalePrice
      }]);
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity, totalPrice: quantity * item.product.wholesalePrice }
          : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const platformFee = Math.round(subtotal * 0.07); // 7% platform fee
    const gst = Math.round((subtotal + platformFee) * 0.18); // 18% GST
    return {
      subtotal,
      platformFee,
      gst,
      total: subtotal + platformFee + gst
    };
  };

  const cartTotal = getCartTotal();

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">💼 Wyshkit Supply</h1>
            <p className="text-gray-600">Source authentic products from verified brands at wholesale prices</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <ShoppingCart className="w-4 h-4" />
              {cart.length} items
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              ₹{cartTotal.total.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products or brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="cart">My Cart ({cart.length})</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
        </TabsList>

        {/* Browse Products */}
        <TabsContent value="browse" className="space-y-6">
          {/* Featured Brands */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Brands</CardTitle>
              <CardDescription>Verified brand partners with competitive wholesale rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {['Boat', 'Noise', 'Portronics', 'Cadbury', 'Ferrero'].map(brand => (
                  <Badge key={brand} variant="outline" className="px-4 py-2">
                    {brand}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                onViewDetails={setSelectedProduct}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </Card>
          )}
        </TabsContent>

        {/* Cart */}
        <TabsContent value="cart" className="space-y-6">
          <CartView
            cart={cart}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            cartTotal={cartTotal}
          />
        </TabsContent>

        {/* Orders */}
        <TabsContent value="orders" className="space-y-6">
          <OrdersView />
        </TabsContent>
      </Tabs>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};

// Product Card Component
const ProductCard: React.FC<{
  product: SupplyProduct;
  onAddToCart: (product: SupplyProduct, quantity: number) => void;
  onViewDetails: (product: SupplyProduct) => void;
}> = ({ product, onAddToCart, onViewDetails }) => {
  const [quantity, setQuantity] = useState(product.minimumOrder);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-400" />
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-lg line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-600">by {product.brand}</p>
            {product.isVerified && (
              <Badge variant="secondary" className="mt-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified Brand
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Wholesale Price:</span>
              <span className="font-semibold">₹{product.wholesalePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">MRP:</span>
              <span className="text-sm line-through">₹{product.mrp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Your Margin:</span>
              <span className="text-green-600 font-semibold">₹{product.marginOpportunity.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Min Order:</span>
              <span>{product.minimumOrder} units</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Stock:</span>
              <span>{product.stockAvailable} available</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery:</span>
              <span>{product.leadTimeDays} days</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(product.minimumOrder, quantity - 1))}
                  disabled={quantity <= product.minimumOrder}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-12 text-center text-sm">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.maximumOrder, quantity + 1))}
                  disabled={quantity >= product.maximumOrder}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(product)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Cart View Component
const CartView: React.FC<{
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  cartTotal: {
    subtotal: number;
    platformFee: number;
    gst: number;
    total: number;
  };
}> = ({ cart, onUpdateQuantity, onRemoveItem, cartTotal }) => {
  if (cart.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
        <p className="text-gray-600">Add some products to get started</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {cart.map(item => (
          <Card key={item.product.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-sm text-gray-600">by {item.product.brand}</p>
                <p className="text-sm text-gray-600">₹{item.product.wholesalePrice} per unit</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-12 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <div className="text-right">
                <p className="font-semibold">₹{item.totalPrice.toLocaleString()}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Order Summary */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Products Total:</span>
              <span>₹{cartTotal.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee (7%):</span>
              <span>₹{cartTotal.platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%):</span>
              <span>₹{cartTotal.gst.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>₹{cartTotal.total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Estimated Delivery:</span>
                <span>5-7 business days</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Address:</span>
                <span className="text-right">Your registered warehouse</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg">
          Place Order - ₹{cartTotal.total.toLocaleString()}
        </Button>

        <div className="text-xs text-gray-600 space-y-1">
          <p>• 100% payment required before order processing</p>
          <p>• Orders ship directly from brand warehouses</p>
          <p>• Business invoice provided for resale</p>
        </div>
      </div>
    </div>
  );
};

// Orders View Component
const OrdersView: React.FC = () => {
  const mockOrders = [
    {
      id: 'WS-2024-00234',
      date: '2025-01-15',
      status: 'In Transit',
      items: ['Boat Airdopes 131 (50 units)'],
      amount: 73231,
      expectedDelivery: '2025-01-18'
    },
    {
      id: 'WS-2024-00189',
      date: '2025-01-08',
      status: 'Delivered',
      items: ['Premium Gift Boxes (100 units)'],
      amount: 11664,
      deliveredOn: '2025-01-12'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Wholesale Orders</h2>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mockOrders.map(order => (
        <Card key={order.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Order #{order.id}</h3>
                <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Placed on {order.date}</p>
              <p className="text-sm">{order.items.join(', ')}</p>
              <p className="font-semibold">Amount: ₹{order.amount.toLocaleString()}</p>
            </div>

            <div className="text-right space-y-2">
              {order.status === 'In Transit' && (
                <p className="text-sm text-blue-600">
                  Expected: {order.expectedDelivery}
                </p>
              )}
              {order.status === 'Delivered' && (
                <p className="text-sm text-green-600">
                  Delivered: {order.deliveredOn}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Invoice
                </Button>
                {order.status === 'In Transit' && (
                  <Button variant="outline" size="sm">
                    <Truck className="w-4 h-4 mr-1" />
                    Track
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Product Detail Modal Component
const ProductDetailModal: React.FC<{
  product: SupplyProduct;
  onClose: () => void;
  onAddToCart: (product: SupplyProduct, quantity: number) => void;
}> = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(product.minimumOrder);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{product.name}</CardTitle>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
          <CardDescription>by {product.brand}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="w-24 h-24 text-gray-400" />
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="font-semibold">Wholesale Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Wholesale Price</p>
                <p className="text-xl font-bold">₹{product.wholesalePrice.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Your Margin</p>
                <p className="text-xl font-bold text-green-600">₹{product.marginOpportunity.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">MRP</p>
              <p className="text-lg line-through">₹{product.mrp.toLocaleString()}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Minimum Order:</p>
                <p className="font-medium">{product.minimumOrder} units</p>
              </div>
              <div>
                <p className="text-gray-600">Maximum Order:</p>
                <p className="font-medium">{product.maximumOrder} units</p>
              </div>
              <div>
                <p className="text-gray-600">Stock Available:</p>
                <p className="font-medium">{product.stockAvailable} units</p>
              </div>
              <div>
                <p className="text-gray-600">Lead Time:</p>
                <p className="font-medium">{product.leadTimeDays} days</p>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <h3 className="font-semibold">Select Quantity</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(product.minimumOrder, quantity - 1))}
                  disabled={quantity <= product.minimumOrder}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-16 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.maximumOrder, quantity + 1))}
                  disabled={quantity >= product.maximumOrder}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total: ₹{(quantity * product.wholesalePrice).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-semibold">Description</h3>
            <p className="text-sm text-gray-600">{product.description}</p>
          </div>

          {/* Specifications */}
          <div className="space-y-3">
            <h3 className="font-semibold">Specifications</h3>
            <ul className="space-y-1">
              {product.specifications.map((spec, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  {spec}
                </li>
              ))}
            </ul>
          </div>

          {/* Warranty */}
          <div className="space-y-3">
            <h3 className="font-semibold">Warranty</h3>
            <p className="text-sm text-gray-600">{product.warranty}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={() => {
                onAddToCart(product, quantity);
                onClose();
              }}
              className="flex-1"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
