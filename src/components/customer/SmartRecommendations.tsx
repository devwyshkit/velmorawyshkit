/**
 * Smart Recommendations Component - Amazon/Flipkart Style
 * AI-powered product suggestions with frequently bought together
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  TrendingUp,
  Package,
  Gift,
  Sparkles
} from 'lucide-react';
import { getSmartRecommendations, getFrequentlyBoughtTogether, getTrendingProducts } from '@/lib/ai/recommendations';
import { formatPrice } from '@/lib/pricing/tieredPricing';

interface SmartRecommendationsProps {
  productId?: string;
  category?: string;
  userId?: string;
  cartItems?: Array<{
    productId: string;
    category: string;
  }>;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  productId,
  category,
  userId,
  cartItems = []
}) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [frequentlyBoughtTogether, setFrequentlyBoughtTogether] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [productId, category, userId, cartItems]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Load personalized recommendations
      const recs = await getSmartRecommendations({
        userId,
        productId,
        category,
        cartItems,
      });
      setRecommendations(recs.recommendations || []);

      // Load frequently bought together if viewing a product
      if (productId && category) {
        const fbt = await getFrequentlyBoughtTogether(productId, category);
        setFrequentlyBoughtTogether(fbt);
      }

      // Load trending products
      const trending = await getTrendingProducts(category);
      setTrendingProducts(trending);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Frequently Bought Together */}
      {frequentlyBoughtTogether.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Frequently Bought Together
            </CardTitle>
            <CardDescription>
              Customers who bought this also bought these items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {frequentlyBoughtTogether.map((bundle, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Bundle Deal #{index + 1}</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Save ₹{bundle.savings}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {bundle.products.map((product: any, productIndex: number) => (
                      <div key={productIndex} className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{product.productName}</h5>
                          <p className="text-sm text-gray-600">{formatPrice(product.price * 100)}</p>
                        </div>
                        {productIndex < bundle.products.length - 1 && (
                          <div className="text-gray-400">+</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div>
                      <span className="text-sm text-gray-600">Bundle Price:</span>
                      <span className="font-semibold ml-2">{formatPrice(bundle.bundlePrice * 100)}</span>
                    </div>
                    <Button size="sm">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add Bundle to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recommended for You
            </CardTitle>
            <CardDescription>
              Based on your preferences and browsing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((product, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">{product.productName}</h3>
                      <p className="text-sm text-gray-600 capitalize">{product.category}</p>
                      <p className="font-semibold">{formatPrice(product.price * 100)}</p>
                      
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">4.8</span>
                        <span className="text-xs text-gray-500">({product.confidence}/10)</span>
                      </div>
                      
                      <p className="text-xs text-blue-600">{product.reason}</p>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Now
            </CardTitle>
            <CardDescription>
              Popular products this season
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {trendingProducts.map((product, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative">
                      <Package className="w-8 h-8 text-gray-400" />
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">{product.productName}</h3>
                      <p className="text-sm text-gray-600 capitalize">{product.category}</p>
                      <p className="font-semibold">{formatPrice(product.price * 100)}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600">Trending</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Score: {product.trendScore}/10
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Recommendations Fallback */}
      {recommendations.length === 0 && frequentlyBoughtTogether.length === 0 && trendingProducts.length === 0 && (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
          <p className="text-gray-600">Try browsing different categories to get personalized suggestions</p>
        </Card>
      )}
    </div>
  );
};
