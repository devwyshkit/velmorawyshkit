/**
 * Campaign Management Page
 * Create promotional campaigns with featured placement
 * Zomato pattern: 15-20% engagement boost
 */

import { useState } from "react";
import { Megaphone, Plus, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Campaign, CampaignType, DiscountType } from "@/types/campaigns";

export const CampaignManager = () => {
  const { toast } = useToast();
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  
  // Mock campaigns for development
  const campaigns: Campaign[] = [
    {
      id: '1',
      partner_id: 'partner-1',
      name: 'Diwali 10% Off',
      type: 'discount',
      discount_type: 'percentage',
      discount_value: 10,
      products: ['product-1', 'product-2'],
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      featured: true,
      status: 'active',
      impressions: 1250,
      orders: 45,
      revenue: 12450000,
      created_at: new Date().toISOString()
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateCampaign(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.impressions, 0).toLocaleString()}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campaign Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              ₹{(campaigns.reduce((sum, c) => sum + c.revenue, 0) / 100).toLocaleString('en-IN')}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    {campaign.featured && (
                      <Badge variant="default" className="bg-primary">Featured</Badge>
                    )}
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {campaign.type === 'discount' && `${campaign.discount_value}% off`}
                    {campaign.type === 'free_addon' && 'Free add-on'}
                    {campaign.type === 'bundle' && 'Bundle deal'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {campaign.impressions.toLocaleString()} impressions
                    </span>
                    <span>{campaign.orders} orders</span>
                    <span>₹{(campaign.revenue / 100).toLocaleString('en-IN')} revenue</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Analytics</Button>
              </div>
            ))}

            {campaigns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No campaigns yet. Create your first campaign!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Sheet */}
      <Sheet open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Campaign</SheetTitle>
            <SheetDescription>
              Set up a promotional campaign for your products
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* Campaign Name */}
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input id="name" placeholder="Diwali 10% Off" />
            </div>

            {/* Campaign Type */}
            <div>
              <Label>Campaign Type</Label>
              <RadioGroup defaultValue="discount" className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="discount" id="discount" />
                  <Label htmlFor="discount">Discount (% off or flat amount)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="free_addon" id="free_addon" />
                  <Label htmlFor="free_addon">Free Add-on</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bundle" id="bundle" />
                  <Label htmlFor="bundle">Bundle Deal</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Discount Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount-type">Discount Type</Label>
                <Select defaultValue="percentage">
                  <SelectTrigger id="discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount-value">Value</Label>
                <Input id="discount-value" type="number" placeholder="10" />
              </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" type="date" />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" />
              </div>
            </div>

            {/* Featured Placement */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="featured">Featured Placement (+5% commission fee)</Label>
                <p className="text-sm text-muted-foreground">
                  Appear in home carousel, top of search, +30% visibility
                </p>
              </div>
              <Switch id="featured" />
            </div>

            {/* Terms */}
            <div>
              <Label htmlFor="terms">Terms & Conditions (Optional)</Label>
              <Textarea
                id="terms"
                placeholder="Valid for orders above ₹1,000..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateCampaign(false)} className="flex-1">
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => {
                toast({ title: "Campaign created", description: "Your campaign is now live" });
                setShowCreateCampaign(false);
              }}>
                Publish Campaign
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

