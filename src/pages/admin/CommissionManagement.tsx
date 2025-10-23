/**
 * Admin Commission Management Interface
 * Dynamic commission control with real-time updates
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { CommissionRule } from '@/types/tiered-pricing';
import { createDefaultCommissionRules, calculateCommission, formatCommission } from '@/lib/pricing/commission';
import { supabase } from '@/lib/integrations/supabase-client';

interface CommissionManagementProps {}

export const CommissionManagement: React.FC<CommissionManagementProps> = () => {
  const { toast } = useToast();
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [testOrder, setTestOrder] = useState({
    orderValue: 50000,
    vendorId: '',
    category: 'electronics'
  });
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    const loadCommissionRules = async () => {
      try {
        const { data, error } = await supabase
          .from('commission_rules')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const rules: CommissionRule[] = data.map(rule => ({
            id: rule.id,
            ruleType: rule.rule_type,
            vendorId: rule.vendor_id,
            category: rule.category,
            orderValueMinPaise: rule.order_value_min_paise,
            orderValueMaxPaise: rule.order_value_max_paise,
            commissionPercent: rule.commission_percent,
            isActive: rule.is_active,
            effectiveFrom: rule.effective_from,
            effectiveUntil: rule.effective_until,
            createdAt: rule.created_at,
            updatedAt: rule.updated_at
          }));
          setCommissionRules(rules);
        } else {
          // Use default rules if none exist
          setCommissionRules(createDefaultCommissionRules());
        }
      } catch (error) {
        console.error('Error loading commission rules:', error);
        // Fallback to default rules
        setCommissionRules(createDefaultCommissionRules());
      }
    };

    loadCommissionRules();
  }, []);

  const handleCreateRule = () => {
    const newRule: CommissionRule = {
      id: `rule-${Date.now()}`,
      ruleType: 'default',
      orderValueMin: 0,
      orderValueMax: null,
      commissionPercent: 18,
      isActive: true,
      effectiveFrom: new Date()
    };
    setEditingRule(newRule);
    setIsCreating(true);
  };

  const handleEditRule = (rule: CommissionRule) => {
    setEditingRule({ ...rule });
    setIsCreating(false);
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;

    try {
      // Save to backend (Supabase)
      const { error } = await supabase
        .from('commission_rules')
        .upsert({
          id: editingRule.id,
          rule_type: editingRule.ruleType,
          vendor_id: editingRule.vendorId || null,
          category: editingRule.category || null,
          order_value_min_paise: editingRule.orderValueMinPaise,
          order_value_max_paise: editingRule.orderValueMaxPaise,
          commission_percent: editingRule.commissionPercent,
          is_active: editingRule.isActive,
          effective_from: editingRule.effectiveFrom,
          effective_until: editingRule.effectiveUntil || null
        });

      if (error) throw error;

      // Update local state
      if (isCreating) {
        setCommissionRules([...commissionRules, editingRule]);
      } else {
        setCommissionRules(commissionRules.map(rule => 
          rule.id === editingRule.id ? editingRule : rule
        ));
      }

      setEditingRule(null);
      setIsCreating(false);

      toast({
        title: "Commission rule saved",
        description: "Changes have been applied and will take effect immediately",
      });
    } catch (error) {
      console.error('Error saving commission rule:', error);
      toast({
        title: "Save failed",
        description: "Failed to save commission rule. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    setCommissionRules(commissionRules.filter(rule => rule.id !== ruleId));
  };

  const handleTestCommission = () => {
    try {
      const result = calculateCommission(
        testOrder.orderValue,
        testOrder.vendorId,
        testOrder.category,
        commissionRules
      );
      setTestResult(result);
    } catch (error) {
      console.error('Error calculating commission:', error);
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'vendor': return 'bg-blue-100 text-blue-800';
      case 'category': return 'bg-green-100 text-green-800';
      case 'volume': return 'bg-purple-100 text-purple-800';
      case 'default': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'vendor': return <Users className="w-4 h-4" />;
      case 'category': return <TrendingUp className="w-4 h-4" />;
      case 'volume': return <DollarSign className="w-4 h-4" />;
      case 'default': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Commission Management</h1>
            <p className="text-gray-600">Configure platform commission rules and vendor-specific rates</p>
          </div>
          <Button onClick={handleCreateRule} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Commission Rule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">Commission Rules</TabsTrigger>
          <TabsTrigger value="calculator">Commission Calculator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Commission Rules */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rules List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Active Commission Rules</h2>
                <Badge variant="outline">{commissionRules.length} rules</Badge>
              </div>

              {commissionRules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getRuleTypeColor(rule.ruleType)}`}>
                        {getRuleTypeIcon(rule.ruleType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium capitalize">{rule.ruleType} Rule</h3>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {rule.commissionPercent}% commission
                          {rule.ruleType === 'vendor' && rule.vendorId && ` for vendor ${rule.vendorId}`}
                          {rule.ruleType === 'category' && rule.categoryId && ` for category ${rule.categoryId}`}
                          {rule.orderValueMin > 0 && ` (orders ₹${rule.orderValueMin}+)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {commissionRules.length === 0 && (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No commission rules</h3>
                  <p className="text-gray-600">Create your first commission rule to get started</p>
                </Card>
              )}
            </div>

            {/* Rule Editor */}
            <div className="space-y-4">
              {editingRule && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isCreating ? 'Create New Rule' : 'Edit Rule'}
                    </CardTitle>
                    <CardDescription>
                      Configure commission settings for this rule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ruleType">Rule Type</Label>
                      <Select
                        value={editingRule.ruleType}
                        onValueChange={(value: any) => setEditingRule({...editingRule, ruleType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="vendor">Vendor Specific</SelectItem>
                          <SelectItem value="category">Category Specific</SelectItem>
                          <SelectItem value="volume">Volume Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingRule.ruleType === 'vendor' && (
                      <div className="space-y-2">
                        <Label htmlFor="vendorId">Vendor ID</Label>
                        <Input
                          id="vendorId"
                          value={editingRule.vendorId || ''}
                          onChange={(e) => setEditingRule({...editingRule, vendorId: e.target.value})}
                          placeholder="Enter vendor ID"
                        />
                      </div>
                    )}

                    {editingRule.ruleType === 'category' && (
                      <div className="space-y-2">
                        <Label htmlFor="categoryId">Category</Label>
                        <Select
                          value={editingRule.categoryId || ''}
                          onValueChange={(value) => setEditingRule({...editingRule, categoryId: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="gourmet">Gourmet</SelectItem>
                            <SelectItem value="wellness">Wellness</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="orderValueMin">Min Order Value (₹)</Label>
                        <Input
                          id="orderValueMin"
                          type="number"
                          value={editingRule.orderValueMin}
                          onChange={(e) => setEditingRule({...editingRule, orderValueMin: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orderValueMax">Max Order Value (₹)</Label>
                        <Input
                          id="orderValueMax"
                          type="number"
                          value={editingRule.orderValueMax || ''}
                          onChange={(e) => setEditingRule({...editingRule, orderValueMax: e.target.value ? parseInt(e.target.value) : null})}
                          placeholder="Leave empty for unlimited"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commissionPercent">Commission Percentage</Label>
                      <Input
                        id="commissionPercent"
                        type="number"
                        value={editingRule.commissionPercent}
                        onChange={(e) => setEditingRule({...editingRule, commissionPercent: parseInt(e.target.value) || 0})}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="isActive">Active</Label>
                      <Switch
                        id="isActive"
                        checked={editingRule.isActive}
                        onCheckedChange={(checked) => setEditingRule({...editingRule, isActive: checked})}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingRule(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveRule}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Rule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Commission Calculator */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Commission Calculator
              </CardTitle>
              <CardDescription>
                Test commission calculations with sample orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testOrderValue">Order Value (₹)</Label>
                  <Input
                    id="testOrderValue"
                    type="number"
                    value={testOrder.orderValue}
                    onChange={(e) => setTestOrder({...testOrder, orderValue: parseInt(e.target.value) || 0})}
                    placeholder="Enter order value"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testVendorId">Vendor ID</Label>
                  <Input
                    id="testVendorId"
                    value={testOrder.vendorId}
                    onChange={(e) => setTestOrder({...testOrder, vendorId: e.target.value})}
                    placeholder="Enter vendor ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testCategory">Category</Label>
                  <Select
                    value={testOrder.category}
                    onValueChange={(value) => setTestOrder({...testOrder, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="gourmet">Gourmet</SelectItem>
                      <SelectItem value="wellness">Wellness</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleTestCommission} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Commission
              </Button>

              {testResult && (
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Commission Calculation Result</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Order Value:</p>
                        <p className="font-semibold">₹{testResult.breakdown.orderValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Commission Rate:</p>
                        <p className="font-semibold">{testResult.commissionPercent}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Commission Amount:</p>
                        <p className="font-semibold text-red-600">₹{testResult.commissionAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Vendor Payout:</p>
                        <p className="font-semibold text-green-600">₹{testResult.vendorPayout.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-white rounded">
                      <p className="text-xs text-gray-600">
                        Applied Rule: {testResult.appliedRule.ruleType} - {testResult.appliedRule.commissionPercent}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Commission Today</p>
                    <p className="text-2xl font-bold">₹45,230</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-green-600 mt-2">+12% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Rules</p>
                    <p className="text-2xl font-bold">{commissionRules.filter(r => r.isActive).length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Commission rules active</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Commission</p>
                    <p className="text-2xl font-bold">18.5%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Across all orders</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Commission Rules Summary</CardTitle>
              <CardDescription>Overview of all commission rules and their impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissionRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getRuleTypeColor(rule.ruleType)}`}>
                        {getRuleTypeIcon(rule.ruleType)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{rule.ruleType} Rule</p>
                        <p className="text-sm text-gray-600">
                          {rule.commissionPercent}% commission
                          {rule.orderValueMin > 0 && ` (₹${rule.orderValueMin}+)`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        Effective: {new Date(rule.effectiveFrom).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
