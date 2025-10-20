import { useState, useEffect } from "react";
import { Info, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/integrations/supabase-client";

interface SourcingLimitsProps {
  productId?: string;
  initialAvailable?: boolean;
  initialMonthlyLimit?: number;
  onSourcingChange: (available: boolean, monthlyLimit?: number) => void;
  disabled?: boolean;
}

interface SourcingUsage {
  used: number;
  limit: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * Sourcing Limits Component
 * Allows partners to control monthly sourcing caps for resellers
 * Prevents overselling, like Zomato's inventory caps
 */
export const SourcingLimits = ({
  productId,
  initialAvailable = false,
  initialMonthlyLimit,
  onSourcingChange,
  disabled = false,
}: SourcingLimitsProps) => {
  const [sourcingAvailable, setSourcingAvailable] = useState(initialAvailable);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(initialMonthlyLimit || 100);
  const [limitEnabled, setLimitEnabled] = useState(!!initialMonthlyLimit);
  const [currentUsage, setCurrentUsage] = useState<SourcingUsage>({
    used: 0,
    limit: initialMonthlyLimit || 100,
    percentage: 0,
    status: 'healthy',
  });

  // Fetch current month usage if product exists
  useEffect(() => {
    if (productId && limitEnabled) {
      fetchCurrentUsage();
    }
  }, [productId, limitEnabled]);

  const fetchCurrentUsage = async () => {
    if (!productId) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const { data, error } = await supabase
        .from('sourcing_usage')
        .select('units_sourced')
        .eq('product_id', productId)
        .eq('month', currentMonth);

      if (error) {
        console.error('Failed to fetch sourcing usage:', error);
        return;
      }

      const used = data?.reduce((sum, record) => sum + record.units_sourced, 0) || 0;
      const percentage = (used / monthlyLimit) * 100;
      const status = percentage >= 90 ? 'critical' : percentage >= 70 ? 'warning' : 'healthy';

      setCurrentUsage({
        used,
        limit: monthlyLimit,
        percentage,
        status,
      });
    } catch (error) {
      console.error('Error fetching sourcing usage:', error);
    }
  };

  const handleAvailableToggle = (checked: boolean) => {
    setSourcingAvailable(checked);
    if (!checked) {
      setLimitEnabled(false);
      onSourcingChange(false);
    } else {
      onSourcingChange(true, limitEnabled ? monthlyLimit : undefined);
    }
  };

  const handleLimitToggle = (checked: boolean) => {
    setLimitEnabled(checked);
    if (checked) {
      onSourcingChange(sourcingAvailable, monthlyLimit);
    } else {
      onSourcingChange(sourcingAvailable, undefined);
    }
  };

  const handleLimitChange = (value: number) => {
    setMonthlyLimit(value);
    if (limitEnabled) {
      onSourcingChange(sourcingAvailable, value);
    }
  };

  return (
    <Card className="border-secondary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Sourcing Availability</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="right">
                    <p className="text-sm">
                      Allow resellers (curators) to source this product for hampers.
                    </p>
                    <ul className="text-xs space-y-1 mt-2">
                      <li>• Earn wholesale revenue from resellers</li>
                      <li>• Set monthly limits to protect inventory</li>
                      <li>• Auto-disable when out of stock</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Let resellers include this product in their curated hampers
            </CardDescription>
          </div>
          <Switch
            checked={sourcingAvailable}
            onCheckedChange={handleAvailableToggle}
            disabled={disabled}
          />
        </div>
      </CardHeader>

      {sourcingAvailable && (
        <CardContent className="space-y-4">
          {/* Monthly Limit Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="limit-toggle" className="text-sm font-medium">
                Set Monthly Sourcing Limit
              </Label>
              <p className="text-xs text-muted-foreground">
                Prevents overselling to resellers. Unlimited if unchecked.
              </p>
            </div>
            <Switch
              id="limit-toggle"
              checked={limitEnabled}
              onCheckedChange={handleLimitToggle}
              disabled={disabled}
            />
          </div>

          {/* Monthly Limit Input */}
          {limitEnabled && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="monthly-limit" className="text-sm">
                  Max Units Per Month
                </Label>
                <Input
                  id="monthly-limit"
                  type="number"
                  min="1"
                  value={monthlyLimit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  disabled={disabled}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">
                  Resets on 1st of each month
                </p>
              </div>

              {/* Current Usage Display (if product exists) */}
              {productId && (
                <div className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">This Month's Usage</span>
                    <span className="font-medium">
                      {currentUsage.used}/{currentUsage.limit} units
                    </span>
                  </div>
                  
                  <Progress
                    value={currentUsage.percentage}
                    className={`h-2 ${
                      currentUsage.status === 'critical'
                        ? '[&>div]:bg-destructive'
                        : currentUsage.status === 'warning'
                        ? '[&>div]:bg-warning'
                        : '[&>div]:bg-primary'
                    }`}
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    {currentUsage.status === 'critical' && (
                      <span className="text-destructive font-medium">
                        ⚠️ Critical: {Math.round(currentUsage.percentage)}% used
                      </span>
                    )}
                    {currentUsage.status === 'warning' && (
                      <span className="text-warning font-medium">
                        ⚠️ Warning: {Math.round(currentUsage.percentage)}% used
                      </span>
                    )}
                    {currentUsage.status === 'healthy' && (
                      <span className="text-primary font-medium">
                        ✓ Healthy: {Math.round(currentUsage.percentage)}% used
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info Alert */}
          <div className="text-xs text-muted-foreground bg-secondary/5 p-3 rounded-lg">
            <p className="font-medium text-secondary-foreground mb-1">How it works:</p>
            <ul className="space-y-1">
              <li>• Resellers can source this product for their hampers</li>
              <li>• You earn wholesale revenue on each sourced unit</li>
              <li>• Monthly limit prevents inventory overselling</li>
              <li>• Auto-disables when stock reaches zero</li>
              <li>• Limit resets automatically on 1st of each month</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

