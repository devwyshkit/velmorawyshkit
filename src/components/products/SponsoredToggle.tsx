/**
 * Sponsored Listings Toggle
 * Integrates into ProductForm for pay-per-sale visibility boost
 * Swiggy/Zomato ad platform: +5% fee for 20-30% visibility increase
 */

import { useState } from "react";
import { Info, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface SponsoredToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean, config?: { start_date: string; end_date: string }) => void;
  productPrice?: number; // For fee estimation
}

export const SponsoredToggle = ({ enabled, onChange, productPrice = 0 }: SponsoredToggleProps) => {
  const [duration, setDuration] = useState(7); // Default 7 days
  
  // Calculate estimated daily cost (mock: ₹5 sales/day * price * 5% fee)
  const avgDailySales = 5;
  const feePercent = 0.05;
  const estimatedDailyCost = (productPrice / 100) * avgDailySales * feePercent;
  const totalEstimatedCost = estimatedDailyCost * duration;

  const handleToggle = (checked: boolean) => {
    if (checked) {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
      onChange(checked, { start_date: startDate, end_date: endDate });
    } else {
      onChange(checked);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="sponsored" className="cursor-pointer">
            Make this product sponsored
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Pay +5% fee per sale for:</p>
                  <ul className="text-sm space-y-0.5 list-disc list-inside">
                    <li>Top placement in search results</li>
                    <li>Featured in home carousel</li>
                    <li>'Sponsored' badge on listing</li>
                    <li>20-30% visibility increase</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch 
          id="sponsored" 
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {enabled && (
        <div className="space-y-4 pt-2 border-t">
          {/* Duration Picker */}
          <div>
            <Label htmlFor="duration">Duration (days)</Label>
            <div className="flex gap-2 mt-2">
              {[7, 14, 30].map(days => (
                <Button
                  key={days}
                  variant={duration === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(days)}
                >
                  {days} days
                </Button>
              ))}
              <Input
                id="duration"
                type="number"
                min="1"
                max="90"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 7)}
                className="w-20"
              />
            </div>
          </div>

          {/* Fee Calculator */}
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Estimated Cost</p>
            </div>
            <p className="text-xs text-muted-foreground">
              ₹{estimatedDailyCost.toFixed(2)}/day × {duration} days = ₹{totalEstimatedCost.toFixed(2)} total
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on avg 5 sales/day at {productPrice > 0 ? `₹${(productPrice / 100).toFixed(2)}` : 'product price'}
            </p>
          </div>

          {/* Preview Badge */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground mb-2">Preview in Customer UI:</p>
            <div className="inline-block relative">
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-500">Product Image</span>
              </div>
              <Badge className="absolute top-1 right-1 bg-green-600 text-white text-[10px] px-1 py-0">
                Sponsored
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

