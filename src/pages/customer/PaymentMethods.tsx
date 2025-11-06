import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RouteMap } from "@/routes";
import { CreditCard, Trash2, Plus, Check, Wallet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { logger } from "@/lib/logger";
import { generateCardId, generateUpiId, generateWalletId } from "@/lib/utils/id-generator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * PaymentMethods - Swiggy 2025 Pattern
 * 
 * Manage saved payment methods:
 * - Cards (debit/credit)
 * - UPI IDs
 * - Wallets
 * - Set default payment method
 */
interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  label: string;
  details: string;
  isDefault: boolean;
  last4?: string;
  expiry?: string;
  upiId?: string;
  walletName?: string;
}

// Helper to load payment methods synchronously (Swiggy 2025 pattern)
const loadPaymentMethodsSync = (): PaymentMethod[] => {
  try {
    // Load from localStorage (synchronous)
    const methods = safeGetItem<PaymentMethod[]>('wyshkit_payment_methods', { defaultValue: [] });
    if (methods && methods.length > 0) {
      return methods;
    } else {
      // Pre-populate with sample data
      const sampleMethods: PaymentMethod[] = [
        {
          id: 'card_1',
          type: 'card',
          label: 'Visa •••• 1234',
          details: 'Expires 12/25',
          isDefault: true,
          last4: '1234',
          expiry: '12/25',
        },
      ];
      localStorage.setItem('wyshkit_payment_methods', JSON.stringify(sampleMethods));
      return sampleMethods;
    }
  } catch (error) {
    console.error('Failed to load payment methods:', error);
    return [];
  }
};

export const PaymentMethods = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  // Swiggy 2025: Initialize payment methods synchronously to prevent empty flash
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => loadPaymentMethodsSync());
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [addMethodType, setAddMethodType] = useState<'card' | 'upi' | 'wallet' | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [walletName, setWalletName] = useState('');

  // Refresh payment methods when needed (Swiggy 2025 pattern)
  const refreshPaymentMethods = () => {
    const methods = loadPaymentMethodsSync();
    setPaymentMethods(methods);
  };

  const savePaymentMethods = (methods: PaymentMethod[]) => {
    localStorage.setItem('wyshkit_payment_methods', JSON.stringify(methods));
    setPaymentMethods(methods);
  };

  const handleSetDefault = (methodId: string) => {
    const updated = paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === methodId,
    }));
    savePaymentMethods(updated);
    toast({
      title: 'Default payment method updated',
      description: 'Your default payment method has been changed.',
    });
  };

  const handleDelete = (methodId: string) => {
    const updated = paymentMethods.filter(method => method.id !== methodId);
    if (updated.length > 0 && !updated.some(m => m.isDefault)) {
      updated[0].isDefault = true;
    }
    savePaymentMethods(updated);
    toast({
      title: 'Payment method removed',
      description: 'The payment method has been removed from your account.',
    });
  };

  const handleAddCard = () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      toast({
        title: 'Please fill all fields',
        description: 'All card details are required.',
        variant: 'destructive',
      });
      return;
    }

    const last4 = cardNumber.slice(-4);
    const newCard: PaymentMethod = {
      id: generateCardId(),
      type: 'card',
      label: `Card •••• ${last4}`,
      details: `Expires ${cardExpiry}`,
      isDefault: paymentMethods.length === 0,
      last4,
      expiry: cardExpiry,
    };

    const updated = [...paymentMethods, newCard];
    savePaymentMethods(updated);
    setIsAddSheetOpen(false);
    setAddMethodType(null);
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    toast({
      title: 'Card added',
      description: 'Your card has been added successfully.',
    });
  };

  const handleAddUpi = () => {
    if (!upiId) {
      toast({
        title: 'Please enter UPI ID',
        description: 'UPI ID is required.',
        variant: 'destructive',
      });
      return;
    }

    const newUpi: PaymentMethod = {
      id: generateUpiId(),
      type: 'upi',
      label: upiId,
      details: 'UPI Payment',
      isDefault: paymentMethods.length === 0,
      upiId,
    };

    const updated = [...paymentMethods, newUpi];
    savePaymentMethods(updated);
    setIsAddSheetOpen(false);
    setAddMethodType(null);
    setUpiId('');
    toast({
      title: 'UPI ID added',
      description: 'Your UPI ID has been added successfully.',
    });
  };

  const handleAddWallet = () => {
    if (!walletName) {
      toast({
        title: 'Please enter wallet name',
        description: 'Wallet name is required.',
        variant: 'destructive',
      });
      return;
    }

    const newWallet: PaymentMethod = {
      id: generateWalletId(),
      type: 'wallet',
      label: walletName,
      details: 'Wallet Payment',
      isDefault: paymentMethods.length === 0,
      walletName,
    };

    const updated = [...paymentMethods, newWallet];
    savePaymentMethods(updated);
    setIsAddSheetOpen(false);
    setAddMethodType(null);
    setWalletName('');
    toast({
      title: 'Wallet added',
      description: 'Your wallet has been added successfully.',
    });
  };

  const getPaymentIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'upi':
        return <Smartphone className="h-5 w-5" />;
      case 'wallet':
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Payment Methods | Wyshkit</title>
        <meta name="description" content="Manage your payment methods" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Payment Methods" showBackButton />

        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-4 md:space-y-6">
          {
            <>
              {/* Payment Methods List */}
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <Card key={method.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            "p-2 rounded-lg",
                            method.type === 'card' ? "bg-blue-100 text-blue-700" :
                            method.type === 'upi' ? "bg-purple-100 text-purple-700" :
                            "bg-green-100 text-green-700"
                          )}>
                            {getPaymentIcon(method.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{method.label}</p>
                              {method.isDefault && (
                                <Badge variant="default" className="text-xs">Default</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{method.details}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!method.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(method.id)}
                              className="h-8 px-2"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(method.id)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {paymentMethods.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center space-y-4">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold mb-2">No Payment Methods</h3>
                      <p className="text-sm text-muted-foreground">
                        Add a payment method to make checkout faster.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Payment Method Button */}
              <Button
                onClick={() => {
                  setIsAddSheetOpen(true);
                  setAddMethodType(null);
                }}
                className="w-full h-12"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </>
          )}
        </main>
        <CustomerBottomNav />

        {/* Add Payment Method Sheet */}
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 overflow-y-auto snap-y snap-mandatory">
            <SheetHeader>
              <SheetTitle>
                {addMethodType === null ? 'Add Payment Method' :
                 addMethodType === 'card' ? 'Add Card' :
                 addMethodType === 'upi' ? 'Add UPI ID' :
                 'Add Wallet'}
              </SheetTitle>
            </SheetHeader>

            <div className="px-6 pb-6 space-y-4 mt-4">
              {addMethodType === null && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start"
                    onClick={() => setAddMethodType('card')}
                  >
                    <CreditCard className="mr-3 h-5 w-5" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Debit/Credit Card</div>
                      <div className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start"
                    onClick={() => setAddMethodType('upi')}
                  >
                    <Smartphone className="mr-3 h-5 w-5" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">UPI</div>
                      <div className="text-xs text-muted-foreground">PhonePe, Google Pay, Paytm</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start"
                    onClick={() => setAddMethodType('wallet')}
                  >
                    <Wallet className="mr-3 h-5 w-5" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Wallet</div>
                      <div className="text-xs text-muted-foreground">Paytm, PhonePe Wallet</div>
                    </div>
                  </Button>
                </div>
              )}

              {addMethodType === 'card' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                      maxLength={16}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                      <Input
                        id="expiry"
                        placeholder="12/25"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        maxLength={3}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddCard} className="w-full h-12">
                    Add Card
                  </Button>
                  <Button
                    onClick={() => setAddMethodType(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              )}

              {addMethodType === 'upi' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)
                    </p>
                  </div>
                  <Button onClick={handleAddUpi} className="w-full h-12">
                    Add UPI ID
                  </Button>
                  <Button
                    onClick={() => setAddMethodType(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              )}

              {addMethodType === 'wallet' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="walletName">Wallet Name</Label>
                    <Input
                      id="walletName"
                      placeholder="Paytm Wallet"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddWallet} className="w-full h-12">
                    Add Wallet
                  </Button>
                  <Button
                    onClick={() => setAddMethodType(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Back
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};


