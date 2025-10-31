import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Package, RefreshCw, FileText, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";

interface Order {
  id: string;
  date: string;
  itemName: string;
  recipient: string;
  total: number;
  status: 'delivered' | 'in-transit' | 'preview-pending';
  image: string;
}

export const Orders = () => {
  const navigate = useNavigate();

  // Mock orders data
  const orders: Order[] = [
    {
      id: 'GFT-1234',
      date: 'Delivered Feb 14',
      itemName: 'Custom T-Shirt',
      recipient: 'Sarah Kumar',
      total: 1500,
      status: 'delivered',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
    },
    {
      id: 'GFT-1230',
      date: 'Delivered Feb 10',
      itemName: 'Birthday Hamper XL',
      recipient: 'Amit Kumar',
      total: 800,
      status: 'delivered',
      image: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=100&h=100&fit=crop',
    },
    {
      id: 'GFT-1228',
      date: 'In Transit',
      itemName: 'Photo Mug',
      recipient: 'Rajesh Kumar',
      total: 400,
      status: 'in-transit',
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=100&h=100&fit=crop',
    },
    {
      id: 'GFT-1225',
      date: 'Preview Pending',
      itemName: 'Custom Hoodie',
      recipient: 'Priya Sharma',
      total: 2500,
      status: 'preview-pending',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&h=100&fit=crop',
    },
  ];

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-700">✓ Delivered</Badge>;
      case 'in-transit':
        return <Badge variant="secondary">🚗 In Transit</Badge>;
      case 'preview-pending':
        return <Badge variant="outline" className="border-orange-300 text-orange-700">⏰ Preview Pending</Badge>;
    }
  };

  const canReturn = (status: Order['status']) => status === 'delivered';

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader title="Orders" showBackButton />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start exploring and place your first order
            </p>
            <Button onClick={() => navigate(RouteMap.home())}>
              Start Shopping
            </Button>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">#{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mb-3">
                  <img 
                    src={order.image} 
                    alt={order.itemName}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">{order.itemName}</p>
                    <p className="text-xs text-muted-foreground">To: {order.recipient}</p>
                    <p className="font-semibold mt-1">₹{order.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {order.status === 'delivered' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {/* TODO: Reorder logic */}}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reorder
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {/* TODO: Download invoice */}}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Invoice
                      </Button>
                      {canReturn(order.status) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {/* TODO: Return logic */}}
                          className="flex items-center gap-1"
                        >
                          <Undo2 className="h-3 w-3" />
                          Return
                        </Button>
                      )}
                    </>
                  )}
                  {order.status === 'in-transit' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(RouteMap.track(order.id))}
                    >
                      Track Order
                    </Button>
                  )}
                  {order.status === 'preview-pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(RouteMap.track(order.id) + '#preview')}
                    >
                      Review Preview
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
      
      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};

