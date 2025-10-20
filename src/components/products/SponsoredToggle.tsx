/**
 * Sponsored Toggle Component
 * Feature 6: PROMPT 5
 * Allows partners to sponsor products for better visibility
 */

import { useState } from "react";
import { TrendingUp, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SponsoredToggleProps {
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
  productPrice?: number; // For fee calculation
  onChange: (config: {
    enabled: boolean;
    startDate: Date;
    endDate: Date;
  }) => void;
}

export const SponsoredToggle = ({
  enabled,
  startDate = new Date(),
  endDate = new Date(Date.now() + 7 * 86400000),
  productPrice = 0,
  onChange
}: SponsoredToggleProps) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    onChange({ enabled: checked, startDate: start, endDate: end });
  };

  const handleDateChange = (type: 'start' | 'end', date: Date) => {
    if (type === 'start') {
      setStart(date);
      onChange({ enabled: isEnabled, startDate: date, endDate: end });
    } else {
      setEnd(date);
      onChange({ enabled: isEnabled, startDate: start, endDate: date });
    }
  };

  // Calculate estimated daily cost (simplified)
  const avgDailySales = 5; // Estimate
  const estimatedDailyCost = (productPrice / 100) * avgDailySales * 0.05;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Toggle Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="sponsored-toggle" className="text-base font-medium cursor-pointer">
            Make this product sponsored
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Pay +5% fee per sale for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
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
          id="sponsored-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Sponsored Settings (shown when enabled) */}
      {isEnabled && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
          {/* Fee Estimate */}
          {productPrice > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Estimated cost:</strong> ₹{estimatedDailyCost.toFixed(0)}/day 
                based on avg sales
              </p>
            </div>
          )}

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sponsored-start" className="text-sm">Start Date</Label>
              <Input
                id="sponsored-start"
                type="date"
                value={start.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('start', new Date(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sponsored-end" className="text-sm">End Date</Label>
              <Input
                id="sponsored-end"
                type="date"
                value={end.toISOString().split('T')[0]}
                min={start.toISOString().split('T')[0]}
                onChange={(e) => handleDateChange('end', new Date(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Quick Duration Options */}
          <div className="flex gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleDateChange('end', new Date(start.getTime() + 7 * 86400000))}
            >
              7 days
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleDateChange('end', new Date(start.getTime() + 14 * 86400000))}
            >
              14 days
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleDateChange('end', new Date(start.getTime() + 30 * 86400000))}
            >
              30 days
            </Badge>
          </div>

          {/* Preview Badge */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Customer will see:</p>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Sponsored
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

