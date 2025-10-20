/**
 * Campaign Analytics Component
 * Feature 5: PROMPT 4
 * Shows performance metrics for campaigns
 */

import { TrendingUp, Eye, MousePointer, ShoppingBag, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Campaign } from "@/types/campaigns";

interface CampaignAnalyticsProps {
  campaign: Campaign;
  onClose: () => void;
}

export const CampaignAnalytics = ({ campaign, onClose }: CampaignAnalyticsProps) => {
  const ctr = campaign.impressions > 0 ? (campaign.orders / campaign.impressions) * 100 : 0;
  const avgOrderValue = campaign.orders > 0 ? campaign.revenue / campaign.orders : 0;
  const roi = campaign.featured ? ((campaign.revenue - (campaign.revenue * 0.05)) / (campaign.revenue * 0.05)) * 100 : 0;

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{campaign.name} - Analytics</SheetTitle>
          <SheetDescription>
            Performance metrics and insights
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{campaign.impressions.toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">Impressions</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <MousePointer className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{campaign.impressions > 0 ? ctr.toFixed(2) : 0}%</p>
                <p className="text-sm text-muted-foreground">Click-Through Rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{campaign.orders}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">₹{(campaign.revenue / 100).toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {campaign.impressions > 0 ? ((campaign.orders / campaign.impressions) * 100).toFixed(2) : 0}%
                  </span>
                </div>
                <Progress value={campaign.impressions > 0 ? (campaign.orders / campaign.impressions) * 100 : 0} className="h-2" />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Average Order Value</Label>
                <p className="text-lg font-semibold">₹{(avgOrderValue / 100).toLocaleString('en-IN')}</p>
              </div>

              {campaign.featured && (
                <div>
                  <Label className="text-sm text-muted-foreground">ROI (Return on Investment)</Label>
                  <p className="text-lg font-semibold">{roi.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    After 5% featured placement fee
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Fee Breakdown */}
          {campaign.featured && campaign.revenue > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Featured Placement Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Campaign Revenue</span>
                    <span className="text-sm font-medium">₹{(campaign.revenue / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span className="text-sm">Featured Fee (5%)</span>
                    <span className="text-sm font-medium">-₹{((campaign.revenue * 0.05) / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium">Net Revenue</span>
                    <span className="font-bold text-green-600">
                      ₹{((campaign.revenue * 0.95) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.orders > 0 ? (
                <>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ <strong>Performing well!</strong> Campaign generated {campaign.orders} orders.
                    </p>
                  </div>
                  {ctr < 1 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠ <strong>Low CTR.</strong> Consider improving banner or product selection.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>New campaign.</strong> Check back after 24 hours for initial data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Close Analytics
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

