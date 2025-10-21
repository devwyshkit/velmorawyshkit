/**
 * Commission Breakdown Component
 * Shows detailed commission calculation for partners
 * Based on Swiggy/Zomato hybrid model
 */

import { Info, TrendingDown, Package, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommissionBreakdownProps {
  categoryCommission: number; // Percentage (e.g., 5.00 for 5%)
  fulfillmentFee: number; // In paise (e.g., 5000 for ₹50)
  badgeDiscount: number; // Percentage (e.g., 2.00 for 2%)
  totalOrders: number;
  totalRevenue: number; // In paise
  category: string;
  earnedBadges?: string[]; // Badge types earned
}

export const CommissionBreakdown = ({
  categoryCommission,
  fulfillmentFee,
  badgeDiscount,
  totalOrders,
  totalRevenue,
  category,
  earnedBadges = [],
}: CommissionBreakdownProps) => {
  // Calculate breakdown
  const baseCommissionAmount = Math.round((totalRevenue * categoryCommission) / 100);
  const badgeDiscountAmount = Math.round((totalRevenue * badgeDiscount) / 100);
  const totalFulfillmentFees = fulfillmentFee * totalOrders;
  const netCommission = baseCommissionAmount - badgeDiscountAmount + totalFulfillmentFees;
  const netEarnings = totalRevenue - netCommission;

  const categoryLabels: Record<string, string> = {
    jewelry: 'Jewelry/Gold',
    tech_gifts: 'Electronics',
    food: 'Food Items',
    perishables: 'Perishables',
    chocolates: 'Chocolates',
    premium: 'Premium Hampers',
    personalized: 'Personalized Gifts',
    default: 'General Gifts',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          💰 Commission Breakdown
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Your commission is calculated based on your product category, 
                  loyalty badges, and fulfillment services. Lower commission = more earnings!
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Your Category</p>
            <p className="text-xs text-muted-foreground">
              {categoryLabels[category] || category}
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {categoryCommission}% rate
          </Badge>
        </div>

        {/* Calculation Steps */}
        <div className="space-y-3">
          {/* Base Commission */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Base Commission</p>
                <p className="text-xs text-muted-foreground">
                  {categoryCommission}% of ₹{(totalRevenue / 100).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-destructive">
              -₹{(baseCommissionAmount / 100).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Badge Discount */}
          {badgeDiscount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Badge Discount</p>
                  <p className="text-xs text-muted-foreground">
                    {badgeDiscount}% loyalty reward
                    {earnedBadges.length > 0 && ` • ${earnedBadges[0]}`}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-green-600">
                +₹{(badgeDiscountAmount / 100).toLocaleString('en-IN')}
              </p>
            </div>
          )}

          {/* Fulfillment Fees */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Fulfillment Fees</p>
                <p className="text-xs text-muted-foreground">
                  ₹{(fulfillmentFee / 100).toFixed(0)} × {totalOrders} orders
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-destructive">
              -₹{(totalFulfillmentFees / 100).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t my-2" />

          {/* Net Commission */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div>
              <p className="font-semibold">Total Platform Fees</p>
              <p className="text-xs text-muted-foreground">
                Deducted from your earnings
              </p>
            </div>
            <p className="text-lg font-bold text-destructive">
              ₹{(netCommission / 100).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Your Earnings */}
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">Your Net Earnings</p>
              <p className="text-xs text-green-700 dark:text-green-300">
                After all deductions
              </p>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              ₹{(netEarnings / 100).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>💡 Tip:</strong> Earn loyalty badges to reduce your commission rate! 
            {badgeDiscount === 0 && ' Complete 50+ orders to earn Rising Seller badge (-2%).'}
            {badgeDiscount > 0 && badgeDiscount < 8 && ' Earn more badges to unlock VIP 8% discount!'}
          </p>
        </div>

        {/* Detailed Breakdown Table */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            View calculation details
          </summary>
          <div className="mt-3 space-y-2 pl-4 border-l-2 border-muted">
            <div className="flex justify-between">
              <span>Total Revenue:</span>
              <span className="font-mono">₹{(totalRevenue / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>× Category Rate ({categoryCommission}%):</span>
              <span className="font-mono">-₹{(baseCommissionAmount / 100).toLocaleString('en-IN')}</span>
            </div>
            {badgeDiscount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>+ Badge Discount ({badgeDiscount}%):</span>
                <span className="font-mono">+₹{(badgeDiscountAmount / 100).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>- Fulfillment ({totalOrders} orders × ₹{(fulfillmentFee / 100)}):</span>
              <span className="font-mono">-₹{(totalFulfillmentFees / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Net Earnings:</span>
              <span className="font-mono text-green-600">₹{(netEarnings / 100).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

