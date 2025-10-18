/**
 * Admin Orders Monitoring Page
 * View all partner orders across the platform
 */

import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

export const Orders = () => {
  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Order Monitoring</h1>
        <p className="text-sm text-muted-foreground">View all platform orders</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Order monitoring and analytics coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

