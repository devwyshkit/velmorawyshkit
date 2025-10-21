import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Circle, Package, Truck, Home as HomeIcon, Phone, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { ProofSheet } from "@/pages/customer/ProofSheet";
import { useToast } from "@/hooks/use-toast";
import { getETAEstimate } from "@/lib/integrations/openai";
import { cn } from "@/lib/utils";

interface TimelineStep {
  id: string;
  label: string;
  time: string;
  completed: boolean;
  active: boolean;
}

export const Track = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const orderId = searchParams.get('orderId') || 'ORD-' + Date.now();
  const [eta, setEta] = useState<string>('');
  const [isProofSheetOpen, setIsProofSheetOpen] = useState(false);
  
  // Mock: Determine if order has custom items requiring proof
  const hasCustomItems = true; // In real app, fetch from order data

  // Mock order tracking data
  const timeline: TimelineStep[] = [
    {
      id: 'confirmed',
      label: 'Order Confirmed',
      time: 'Today, 2:30 PM',
      completed: true,
      active: false,
    },
    {
      id: 'preparing',
      label: 'Preparing Your Order',
      time: 'Today, 2:45 PM',
      completed: true,
      active: false,
    },
    {
      id: 'packed',
      label: 'Packed & Ready',
      time: 'Today, 3:00 PM',
      completed: true,
      active: false,
    },
    {
      id: 'out-for-delivery',
      label: 'Out for Delivery',
      time: 'Expected: 3:30 PM',
      completed: false,
      active: true,
    },
    {
      id: 'delivered',
      label: 'Delivered',
      time: 'Expected: 3:45 PM',
      completed: false,
      active: false,
    },
  ];

  const orderDetails = {
    id: orderId,
    items: [
      { name: 'Premium Gift Hamper', quantity: 2 },
      { name: 'Artisan Chocolate Box', quantity: 1 },
    ],
    deliveryAddress: '123 MG Road, Bangalore, Karnataka - 560001',
    deliveryPartner: 'Rahul Kumar',
    deliveryPhone: '+91 98765 43210',
  };

  useEffect(() => {
    const loadETA = async () => {
      const estimatedTime = await getETAEstimate(orderId);
      setEta(estimatedTime);
    };
    loadETA();

    // Show tracking update notification
    toast({
      title: "Order is on the way! 🚚",
      description: `Estimated arrival: ${eta || '30-45 mins'}`,
    });
  }, [orderId]);

  const getIcon = (step: TimelineStep) => {
    if (step.completed) {
      return <CheckCircle className="h-6 w-6 text-success" />;
    } else if (step.active) {
      return <Circle className="h-6 w-6 text-primary animate-pulse" />;
    } else {
      return <Circle className="h-6 w-6 text-muted" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader showBackButton title="Track Order" />

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
        {/* ETA Card - Prominent (Swiggy pattern) */}
        <Card className="bg-gradient-primary text-white border-0">
          <CardContent className="p-6 text-center">
            <Truck className="h-12 w-12 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">On the Way!</h2>
            <p className="text-lg font-semibold mb-1">
              Arriving by {eta || '3:45 PM'}
            </p>
            <p className="text-sm opacity-90">
              Order #{orderId.substring(0, 12)}
            </p>
          </CardContent>
        </Card>

        {/* Contact & Help Buttons (Swiggy/Zomato pattern) */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => {
              window.location.href = `tel:${orderDetails.deliveryPhone}`;
            }}
          >
            <Phone className="h-5 w-5" />
            <span className="hidden sm:inline">Contact Partner</span>
            <span className="sm:hidden">Call</span>
          </Button>
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => {
              toast({
                title: "Need Help?",
                description: "Our support team will contact you shortly",
              });
            }}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Need Help?</span>
            <span className="sm:hidden">Help</span>
          </Button>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-6">Order Timeline</h3>
            <div className="space-y-4 md:space-y-6">
              {timeline.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {getIcon(step)}
                    {index < timeline.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-12 mt-2",
                          step.completed ? "bg-success" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4
                      className={cn(
                        "font-medium text-sm mb-1",
                        step.active && "text-primary",
                        step.completed && "text-foreground",
                        !step.completed && !step.active && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Review Proof - For Custom Items */}
        {hasCustomItems && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Design Proof Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Review and approve your custom item design
                  </p>
                </div>
                <Button
                  onClick={() => setIsProofSheetOpen(true)}
                  variant="default"
                  size="sm"
                >
                  Review Proof
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Items in this order</h3>
            </div>
            <div className="space-y-2">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="text-sm">
                  <span className="text-muted-foreground">
                    {item.name} x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <HomeIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Delivery Details</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Address</p>
                <p>{orderDetails.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Delivery Partner</p>
                <p>{orderDetails.deliveryPartner}</p>
                <p className="text-xs text-muted-foreground">{orderDetails.deliveryPhone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions - Continue Shopping (Swiggy pattern) */}
        <Button
          onClick={() => navigate("/customer/home")}
          className="w-full h-12"
        >
          Continue Shopping
        </Button>
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />

      {/* Proof Approval Sheet */}
      <ProofSheet
        isOpen={isProofSheetOpen}
        onClose={() => setIsProofSheetOpen(false)}
        orderId={orderId}
      />
    </div>
  );
};

