/**
 * Admin Fee Management Interface
 * Configure delivery fees, platform fees, and payment gateway charges
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Truck,
  CreditCard,
  Settings,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { DeliveryFeeConfig } from '@/lib/pricing/deliveryFee';
import { createDefaultDeliveryFeeConfig } from '@/lib/pricing/deliveryFee';

interface FeeManagementProps {}

export const FeeManagement: React.FC<FeeManagementProps> = () => {
  const [deliveryFeeConfig, setDeliveryFeeConfig] = useState<DeliveryFeeConfig>(
    createDefaultDeliveryFeeConfig()
  );
  const [platformFee, setPlatformFee] = useState({
    enabled: true,
    fixedFee: 15, // ₹15 base fee (Swiggy 2025 pattern)
    percentageFee: 0,
    categoryVariations: {} as Record<string, number>
  });
  const [paymentGatewayCharges, setPaymentGatewayCharges] = useState({
    percentage: 2.0,
    passToCustomer: true,
    minimumCharge: 2,
    maximumCharge: 50
  });
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [testOrderValue, setTestOrderValue] = useState(2500);
  const [testDistance, setTestDistance] = useState(8);
  const [testResult, setTestResult] = useState<any>(null);

  const handleSaveDeliveryConfig = () => {
    // Save delivery fee configuration
    // Save delivery fee configuration
    setIsEditingDelivery(false);
  };

  const handleTestDeliveryFee = () => {
    // Test delivery fee calculation
    const { calculateDeliveryFee } = require('@/lib/pricing/deliveryFee');
    try {
      const result = calculateDeliveryFee(testOrderValue, testDistance, deliveryFeeConfig);
      setTestResult(result);
    } catch (error) {
      // Handle error silently in production
    }
  };

  const addOrderValueTier = () => {
    const newTier = {
      minValue: 0,
      maxValue: null,
      feeAmount: 0
    };
    setDeliveryFeeConfig({
      ...deliveryFeeConfig,
      orderValueTiers: [...deliveryFeeConfig.orderValueTiers, newTier]
    });
  };

  const updateOrderValueTier = (index: number, updates: Partial<{
    minValue: number;
    maxValue: number | null;
    feeAmount: number;
  }>) => {
    const newTiers = [...deliveryFeeConfig.orderValueTiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setDeliveryFeeConfig({
      ...deliveryFeeConfig,
      orderValueTiers: newTiers
    });
  };

  const removeOrderValueTier = (index: number) => {
    if (deliveryFeeConfig.orderValueTiers.length > 1) {
      const newTiers = deliveryFeeConfig.orderValueTiers.filter((_, i) => i !== index);
      setDeliveryFeeConfig({
        ...deliveryFeeConfig,
        orderValueTiers: newTiers
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-gray-600">Configure delivery fees, platform fees, and payment charges</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="delivery" className="space-y-6">
        <TabsList>
          <TabsTrigger value="delivery">Delivery Fees</TabsTrigger>
          <TabsTrigger value="platform">Platform Fees</TabsTrigger>
          <TabsTrigger value="payment">Payment Charges</TabsTrigger>
          <TabsTrigger value="calculator">Fee Calculator</TabsTrigger>
        </TabsList>

        {/* Delivery Fee Configuration */}
        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Fee Structure
                  </CardTitle>
                  <CardDescription>
                    Configure order value-based delivery fees and free delivery thresholds
                  </CardDescription>
                </div>
                <Button
                  variant={isEditingDelivery ? "default" : "outline"}
                  onClick={() => setIsEditingDelivery(!isEditingDelivery)}
                >
                  {isEditingDelivery ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Free Delivery Threshold */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Free Delivery Threshold</h3>
                    <p className="text-sm text-gray-600">Orders above this amount get free delivery</p>
                  </div>
                  <div className="w-48">
                    <Input
                      type="number"
                      value={deliveryFeeConfig.freeDeliveryThreshold}
                      onChange={(e) => setDeliveryFeeConfig({
                        ...deliveryFeeConfig,
                        freeDeliveryThreshold: parseInt(e.target.value) || 0
                      })}
                      disabled={!isEditingDelivery}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Value Tiers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Order Value Tiers</h3>
                    <p className="text-sm text-gray-600">Set delivery fees based on order value</p>
                  </div>
                  {isEditingDelivery && (
                    <Button onClick={addOrderValueTier} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Tier
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {deliveryFeeConfig.orderValueTiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Min Value (₹)</Label>
                        <Input
                          type="number"
                          value={tier.minValue}
                          onChange={(e) => updateOrderValueTier(index, { 
                            minValue: parseInt(e.target.value) || 0 
                          })}
                          disabled={!isEditingDelivery}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Max Value (₹)</Label>
                        <Input
                          type="number"
                          value={tier.maxValue || ''}
                          onChange={(e) => updateOrderValueTier(index, { 
                            maxValue: e.target.value ? parseInt(e.target.value) : null 
                          })}
                          placeholder="Leave empty for unlimited"
                          disabled={!isEditingDelivery}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Fee Amount (₹)</Label>
                        <Input
                          type="number"
                          value={tier.feeAmount}
                          onChange={(e) => updateOrderValueTier(index, { 
                            feeAmount: parseInt(e.target.value) || 0 
                          })}
                          disabled={!isEditingDelivery}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        {isEditingDelivery && deliveryFeeConfig.orderValueTiers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOrderValueTier(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Distance Tiers */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Distance-Based Surcharges</h3>
                  <p className="text-sm text-gray-600">Additional charges based on delivery distance</p>
                </div>

                <div className="space-y-3">
                  {deliveryFeeConfig.distanceTiers?.map((tier, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Min Distance (km)</Label>
                        <Input
                          type="number"
                          value={tier.minKm}
                          disabled={!isEditingDelivery}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Max Distance (km)</Label>
                        <Input
                          type="number"
                          value={tier.maxKm || ''}
                          placeholder="Leave empty for unlimited"
                          disabled={!isEditingDelivery}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Surcharge (₹)</Label>
                        <Input
                          type="number"
                          value={tier.surcharge}
                          disabled={!isEditingDelivery}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isEditingDelivery && (
                <div className="flex gap-2">
                  <Button onClick={handleSaveDeliveryConfig} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Delivery Config
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Fee Configuration */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Platform Fee Settings
              </CardTitle>
              <CardDescription>
                Configure platform fees charged to vendors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Platform Fee</h3>
                    <p className="text-sm text-gray-600">Fixed fee charged per order</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={platformFee.enabled}
                      onCheckedChange={(checked) => setPlatformFee({...platformFee, enabled: checked})}
                    />
                    <span className="text-sm">{platformFee.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                {platformFee.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fixed Fee (₹)</Label>
                      <Input
                        type="number"
                        value={platformFee.fixedFee}
                        onChange={(e) => setPlatformFee({...platformFee, fixedFee: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Percentage Fee (%)</Label>
                      <Input
                        type="number"
                        value={platformFee.percentageFee}
                        onChange={(e) => setPlatformFee({...platformFee, percentageFee: parseFloat(e.target.value) || 0})}
                        step="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Category Variations</h3>
                  <p className="text-sm text-gray-600">Different fees for different categories</p>
                </div>

                <div className="space-y-3">
                  {Object.entries(platformFee.categoryVariations).map(([category, fee]) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded">
                      <span className="capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={fee}
                          onChange={(e) => setPlatformFee({
                            ...platformFee,
                            categoryVariations: {
                              ...platformFee.categoryVariations,
                              [category]: parseInt(e.target.value) || 0
                            }
                          })}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-600">₹</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Gateway Charges */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Gateway Charges
              </CardTitle>
              <CardDescription>
                Configure payment processing fees and charges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Gateway Fee Percentage (%)</Label>
                    <Input
                      type="number"
                      value={paymentGatewayCharges.percentage}
                      onChange={(e) => setPaymentGatewayCharges({
                        ...paymentGatewayCharges,
                        percentage: parseFloat(e.target.value) || 0
                      })}
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Charge (₹)</Label>
                    <Input
                      type="number"
                      value={paymentGatewayCharges.minimumCharge}
                      onChange={(e) => setPaymentGatewayCharges({
                        ...paymentGatewayCharges,
                        minimumCharge: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Maximum Charge (₹)</Label>
                    <Input
                      type="number"
                      value={paymentGatewayCharges.maximumCharge}
                      onChange={(e) => setPaymentGatewayCharges({
                        ...paymentGatewayCharges,
                        maximumCharge: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Pass to Customer</Label>
                    <Switch
                      checked={paymentGatewayCharges.passToCustomer}
                      onCheckedChange={(checked) => setPaymentGatewayCharges({
                        ...paymentGatewayCharges,
                        passToCustomer: checked
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Current Configuration</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Gateway Fee: {paymentGatewayCharges.percentage}%</p>
                  <p>• Min Charge: ₹{paymentGatewayCharges.minimumCharge}</p>
                  <p>• Max Charge: ₹{paymentGatewayCharges.maximumCharge}</p>
                  <p>• {paymentGatewayCharges.passToCustomer ? 'Charged to customer' : 'Absorbed by platform'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Calculator */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fee Calculator
              </CardTitle>
              <CardDescription>
                Test fee calculations with sample orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Order Value (₹)</Label>
                  <Input
                    type="number"
                    value={testOrderValue}
                    onChange={(e) => setTestOrderValue(parseInt(e.target.value) || 0)}
                    placeholder="Enter order value"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delivery Distance (km)</Label>
                  <Input
                    type="number"
                    value={testDistance}
                    onChange={(e) => setTestDistance(parseInt(e.target.value) || 0)}
                    placeholder="Enter distance"
                  />
                </div>
              </div>

              <Button onClick={handleTestDeliveryFee} className="w-full">
                <DollarSign className="w-4 h-4 mr-2" />
                Calculate Fees
              </Button>

              {testResult && (
                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 text-green-900">Fee Calculation Result</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Order Value:</p>
                        <p className="font-semibold">₹{testOrderValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Distance:</p>
                        <p className="font-semibold">{testDistance} km</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Delivery Fee:</p>
                        <p className="font-semibold">
                          {testResult.isFree ? 'FREE' : `₹${testResult.fee}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Message:</p>
                        <p className="font-semibold text-blue-600">{testResult.message}</p>
                      </div>
                    </div>
                    {testResult.amountNeededForFree > 0 && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded">
                        <p className="text-sm text-yellow-800">
                          Add ₹{Math.ceil(testResult.amountNeededForFree)} more for FREE delivery!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
