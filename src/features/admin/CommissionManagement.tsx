/**
 * Commission Management - Admin Panel
 * Real-time commission rule editor with live preview
 * Swiggy/Zomato operations console pattern
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Save, 
  Eye,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import { CommissionRule, CommissionCalculation } from '@/types/tiered-pricing';

interface CommissionManagementProps {
  className?: string;
}

export const CommissionManagement: React.FC<CommissionManagementProps> = ({
  className
}) => {
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([
    // B2C Commission Rules
    {
      id: '1',
      ruleType: 'default',
      marketplaceType: 'b2c',
      commissionPercent: 18.00,
      orderValueMinPaise: 0,
      orderValueMaxPaise: null,
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      ruleType: 'volume',
      marketplaceType: 'b2c',
      commissionPercent: 15.00,
      orderValueMinPaise: 500000, // ₹5,000
      orderValueMaxPaise: 4999000, // ₹49,999
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      ruleType: 'volume',
      marketplaceType: 'b2c',
      commissionPercent: 12.00,
      orderValueMinPaise: 5000000, // ₹50,000+
      orderValueMaxPaise: null,
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // B2B Commission Rules
    {
      id: '4',
      ruleType: 'default',
      marketplaceType: 'b2b',
      commissionPercent: 7.00,
      platformFeePercent: 2.00,
      orderValueMinPaise: 0,
      orderValueMaxPaise: null,
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '5',
      ruleType: 'volume',
      marketplaceType: 'b2b',
      commissionPercent: 5.00,
      platformFeePercent: 2.00,
      orderValueMinPaise: 10000000, // ₹1,00,000+ (volume partner)
      orderValueMaxPaise: null,
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  const [newRule, setNewRule] = useState<Partial<CommissionRule>>({
    ruleType: 'default',
    marketplaceType: 'b2c',
    commissionPercent: 18.00,
    orderValueMinPaise: 0,
    orderValueMaxPaise: null,
    isActive: true
  });

  const [previewOrderValue, setPreviewOrderValue] = useState(100000); // ₹1,000
  const [previewCalculation, setPreviewCalculation] = useState<CommissionCalculation | null>(null);
  const [activeTab, setActiveTab] = useState('rules');
  const [marketplaceFilter, setMarketplaceFilter] = useState<'all' | 'b2c' | 'b2b'>('all');

  // Calculate commission for preview
  useEffect(() => {
    // Sort rules by specificity (most specific first, default last)
    const sortedRules = [...commissionRules].sort((a, b) => {
      // Volume-based rules are more specific than default
      if (a.ruleType === 'default' && b.ruleType !== 'default') return 1;
      if (a.ruleType !== 'default' && b.ruleType === 'default') return -1;
      
      // Among volume rules, prefer those with smaller ranges (more specific)
      if (a.ruleType === 'volume' && b.ruleType === 'volume') {
        const aRange = (a.orderValueMaxPaise || Infinity) - a.orderValueMinPaise;
        const bRange = (b.orderValueMaxPaise || Infinity) - b.orderValueMinPaise;
        return aRange - bRange;
      }
      
      return 0;
    });

    const applicableRule = sortedRules.find(rule => {
      if (!rule.isActive) return false;
      
      const orderValue = previewOrderValue;
      return orderValue >= rule.orderValueMinPaise && 
             (rule.orderValueMaxPaise === null || orderValue <= rule.orderValueMaxPaise);
    });

    if (applicableRule) {
      const commissionAmount = (previewOrderValue * applicableRule.commissionPercent) / 100;
      const platformFeeAmount = applicableRule.platformFeePercent 
        ? (previewOrderValue * applicableRule.platformFeePercent) / 100 
        : 0;
      const vendorReceives = previewOrderValue - commissionAmount;
      const platformEarns = commissionAmount + platformFeeAmount;
      const buyerPays = previewOrderValue + platformFeeAmount;

      setPreviewCalculation({
        orderValue: previewOrderValue,
        appliedRule: applicableRule,
        commissionAmount,
        vendorReceives,
        platformEarns,
        platformFeeAmount,
        buyerPays
      });
    } else {
      setPreviewCalculation(null);
    }
  }, [previewOrderValue, commissionRules]);

  const addCommissionRule = () => {
    const rule: CommissionRule = {
      id: Date.now().toString(),
      ruleType: newRule.ruleType as 'default' | 'vendor' | 'category' | 'volume',
      marketplaceType: newRule.marketplaceType as 'b2c' | 'b2b',
      commissionPercent: newRule.commissionPercent || 18.00,
      platformFeePercent: newRule.platformFeePercent,
      orderValueMinPaise: newRule.orderValueMinPaise || 0,
      orderValueMaxPaise: newRule.orderValueMaxPaise || null,
      isActive: newRule.isActive || true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCommissionRules([...commissionRules, rule]);
    setNewRule({
      ruleType: 'default',
      marketplaceType: 'b2c',
      commissionPercent: 18.00,
      orderValueMinPaise: 0,
      orderValueMaxPaise: null,
      isActive: true
    });
  };

  const updateCommissionRule = (id: string, updates: Partial<CommissionRule>) => {
    setCommissionRules(commissionRules.map(rule => 
      rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
    ));
  };

  const deleteCommissionRule = (id: string) => {
    setCommissionRules(commissionRules.filter(rule => rule.id !== id));
  };

  const toggleRuleStatus = (id: string) => {
    updateCommissionRule(id, { isActive: !commissionRules.find(r => r.id === id)?.isActive });
  };

  const formatPrice = (paise: number) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case 'default': return 'Default';
      case 'vendor': return 'Vendor Specific';
      case 'category': return 'Category Based';
      case 'volume': return 'Volume Based';
      default: return ruleType;
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'default': return 'bg-blue-100 text-blue-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      case 'category': return 'bg-green-100 text-green-800';
      case 'volume': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">
            Configure commission rules and rates for different scenarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Marketplace Filter */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Marketplace:</Label>
        <div className="flex gap-2">
          <Button
            variant={marketplaceFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMarketplaceFilter('all')}
          >
            All
          </Button>
          <Button
            variant={marketplaceFilter === 'b2c' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMarketplaceFilter('b2c')}
          >
            B2C (Retail)
          </Button>
          <Button
            variant={marketplaceFilter === 'b2b' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMarketplaceFilter('b2b')}
          >
            B2B (Wholesale)
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{commissionRules.filter(r => r.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Commission</p>
                <p className="text-2xl font-bold">15.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">₹2.4L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Partners</p>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          {/* Add New Rule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Commission Rule
              </CardTitle>
              <CardDescription>
                Create custom commission rules for specific scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marketplaceType">Marketplace Type</Label>
                  <Select 
                    value={newRule.marketplaceType} 
                    onValueChange={(value) => setNewRule({ ...newRule, marketplaceType: value as 'b2c' | 'b2b' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select marketplace" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2c">B2C (Retail)</SelectItem>
                      <SelectItem value="b2b">B2B (Wholesale)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ruleType">Rule Type</Label>
                  <Select 
                    value={newRule.ruleType} 
                    onValueChange={(value) => setNewRule({ ...newRule, ruleType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="volume">Volume Based</SelectItem>
                      <SelectItem value="category">Category Based</SelectItem>
                      <SelectItem value="vendor">Vendor Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="commissionPercent">Commission %</Label>
                  <Input
                    id="commissionPercent"
                    type="number"
                    value={newRule.commissionPercent}
                    onChange={(e) => setNewRule({ ...newRule, commissionPercent: parseFloat(e.target.value) })}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                {newRule.marketplaceType === 'b2b' && (
                  <div>
                    <Label htmlFor="platformFeePercent">Platform Fee % (B2B only)</Label>
                    <Input
                      id="platformFeePercent"
                      type="number"
                      value={newRule.platformFeePercent || 2}
                      onChange={(e) => setNewRule({ ...newRule, platformFeePercent: parseFloat(e.target.value) })}
                      min="0"
                      max="10"
                      step="0.1"
                      placeholder="2"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="minValue">Minimum Order Value (₹)</Label>
                  <Input
                    id="minValue"
                    type="number"
                    value={newRule.orderValueMinPaise ? newRule.orderValueMinPaise / 100 : 0}
                    onChange={(e) => setNewRule({ ...newRule, orderValueMinPaise: (parseFloat(e.target.value) || 0) * 100 })}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="maxValue">Maximum Order Value (₹)</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    value={newRule.orderValueMaxPaise ? newRule.orderValueMaxPaise / 100 : ''}
                    onChange={(e) => setNewRule({ ...newRule, orderValueMaxPaise: e.target.value ? (parseFloat(e.target.value) * 100) : null })}
                    min="0"
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newRule.isActive}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, isActive: checked })}
                />
                <Label>Active</Label>
              </div>

              <Button onClick={addCommissionRule} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Commission Rule
              </Button>
            </CardContent>
          </Card>

          {/* Commission Rules List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Commission Rules</h3>
            {commissionRules
              .filter(rule => marketplaceFilter === 'all' || rule.marketplaceType === marketplaceFilter)
              .map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRuleStatus(rule.id)}
                        />
                        <Badge className={getRuleTypeColor(rule.ruleType)}>
                          {getRuleTypeLabel(rule.ruleType)}
                        </Badge>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={rule.marketplaceType === 'b2c' ? 'text-blue-600' : 'text-green-600'}>
                            {rule.marketplaceType === 'b2c' ? 'B2C' : 'B2B'}
                          </Badge>
                          <p className="font-medium">
                            {rule.commissionPercent}% Commission
                            {rule.platformFeePercent && (
                              <span className="text-sm text-muted-foreground ml-2">
                                + {rule.platformFeePercent}% Platform Fee
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(rule.orderValueMinPaise)} - {rule.orderValueMaxPaise ? formatPrice(rule.orderValueMaxPaise) : 'No limit'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Edit rule
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCommissionRule(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Commission Preview
              </CardTitle>
              <CardDescription>
                Test how commission rules apply to different order values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="previewOrderValue">Order Value (₹)</Label>
                <Input
                  id="previewOrderValue"
                  type="number"
                  value={previewOrderValue / 100}
                  onChange={(e) => setPreviewOrderValue((parseFloat(e.target.value) || 0) * 100)}
                  min="0"
                  step="100"
                />
              </div>

              {previewCalculation ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Commission Calculation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Order Value:</span>
                        <span className="font-medium">{formatPrice(previewCalculation.orderValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Marketplace:</span>
                        <Badge variant="outline" className={previewCalculation.appliedRule.marketplaceType === 'b2c' ? 'text-blue-600' : 'text-green-600'}>
                          {previewCalculation.appliedRule.marketplaceType === 'b2c' ? 'B2C (Retail)' : 'B2B (Wholesale)'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission Rate:</span>
                        <span className="font-medium">{previewCalculation.appliedRule.commissionPercent}%</span>
                      </div>
                      {previewCalculation.appliedRule.platformFeePercent && (
                        <div className="flex justify-between">
                          <span>Platform Fee Rate:</span>
                          <span className="font-medium">{previewCalculation.appliedRule.platformFeePercent}%</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Commission Amount:</span>
                        <span className="font-medium text-orange-600">{formatPrice(previewCalculation.commissionAmount)}</span>
                      </div>
                      {previewCalculation.platformFeeAmount && (
                        <div className="flex justify-between">
                          <span>Platform Fee:</span>
                          <span className="font-medium text-purple-600">{formatPrice(previewCalculation.platformFeeAmount)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between">
                        <span>Vendor Receives:</span>
                        <span className="font-bold text-green-600">{formatPrice(previewCalculation.vendorReceives)}</span>
                      </div>
                      {previewCalculation.buyerPays && (
                        <div className="flex justify-between">
                          <span>Buyer Pays (B2B):</span>
                          <span className="font-bold text-blue-600">{formatPrice(previewCalculation.buyerPays)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Platform Earns:</span>
                        <span className="font-bold text-blue-600">{formatPrice(previewCalculation.platformEarns)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Applied Rule</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {getRuleTypeLabel(previewCalculation.appliedRule.ruleType)} rule with {previewCalculation.appliedRule.commissionPercent}% commission
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">No applicable rule found</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    This order value doesn't match any active commission rules
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Commission Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission by Rule Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Default Rules</span>
                    <span className="font-medium">₹45,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume Rules</span>
                    <span className="font-medium">₹78,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category Rules</span>
                    <span className="font-medium">₹23,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vendor Rules</span>
                    <span className="font-medium">₹12,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <span className="font-medium">₹158,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Month</span>
                    <span className="font-medium">₹142,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth</span>
                    <span className="font-medium text-green-600">+11.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommissionManagement;
