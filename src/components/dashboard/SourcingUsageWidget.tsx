/**
 * Sourcing Usage Widget
 * Feature 11: PROMPT 11 - Sourcing Limits
 * Dashboard widget showing monthly sourcing usage per product
 * Mobile-first design (320px base)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getSourcingStatus } from "@/lib/sourcing/trackUsage";

interface SourcingProduct {
  product_id: string;
  product_name: string;
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical' | 'reached';
}

/**
 * Sourcing Usage Widget
 * Shows top 5 products with highest sourcing usage this month
 * Helps partners track monthly caps
 */
export const SourcingUsageWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SourcingProduct[]>([]);

  useEffect(() => {
    if (user) {
      loadSourcingUsage();
    }
  }, [user]);

  const loadSourcingUsage = async () => {
    // Mock implementation - replace with actual Supabase query
    setLoading(true);
    try {
      // Mock data for development
      setProducts([
        {
          product_id: '1',
          product_name: 'Premium Gift Box',
          limit: 100,
          used: 45,
          remaining: 55,
          percentage: 45,
          status: 'healthy'
        },
        {
          product_id: '2',
          product_name: 'Chocolate Hamper',
          limit: 100,
          used: 78,
          remaining: 22,
          percentage: 78,
          status: 'warning'
        },
        {
          product_id: '3',
          product_name: 'Corporate Gift Set',
          limit: 50,
          used: 48,
          remaining: 2,
          percentage: 96,
          status: 'critical'
        },
      ]);
    } catch (error) {
      console.error('Load sourcing usage error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: SourcingProduct['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
      case 'reached':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: SourcingProduct['status']) => {
    switch (status) {
      case 'healthy':
        return '🟢 Healthy';
      case 'warning':
        return '🟡 Warning';
      case 'critical':
        return '🔴 Critical';
      case 'reached':
        return '⛔ Limit Reached';
      default:
        return '';
    }
  };

  if (loading) {
    return null; // Or skeleton loader
  }

  if (products.length === 0) {
    return null; // Don't show widget if no products with limits
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Sourcing Usage This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Products List */}
        {products.map((product) => (
          <div key={product.product_id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{product.product_name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.used}/{product.limit} units • {product.remaining} remaining
                </p>
              </div>
              <Badge
                variant={product.status === 'critical' || product.status === 'reached' ? 'destructive' : 'secondary'}
                className="shrink-0 text-xs"
              >
                {getStatusLabel(product.status)}
              </Badge>
            </div>
            <Progress 
              value={Math.min(100, product.percentage)}
              className={`h-2 ${
                product.status === 'critical' || product.status === 'reached' ? '[&>div]:bg-red-500' :
                product.status === 'warning' ? '[&>div]:bg-yellow-500' :
                '[&>div]:bg-green-500'
              }`}
            />
          </div>
        ))}

        {/* Info Alert if critical */}
        {products.some(p => p.status === 'critical' || p.status === 'reached') && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              Some products are approaching or have reached their monthly sourcing limit.
              Limits reset on the 1st of each month.
            </p>
          </div>
        )}

        {/* View All Button */}
        <Button
          variant="link"
          size="sm"
          className="w-full text-primary p-0 h-auto"
          onClick={() => navigate("/partner/products?filter=sourcing")}
        >
          View All Products with Limits →
        </Button>
      </CardContent>
    </Card>
  );
};

