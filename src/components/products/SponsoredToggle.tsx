import { useState, useEffect } from "react";
import { Info, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SponsoredToggleProps {
  productId?: string;
  initialSponsored?: boolean;
  initialStartDate?: string;
  initialEndDate?: string;
  onSponsoredChange: (isSponsored: boolean, startDate?: Date, endDate?: Date) => void;
  disabled?: boolean;
}

/**
 * Sponsored Toggle Component
 * Allows partners to activate sponsored listing for products
 * Following Swiggy/Zomato ad platform patterns
 */
export const SponsoredToggle = ({
  productId,
  initialSponsored = false,
  initialStartDate,
  initialEndDate,
  onSponsoredChange,
  disabled = false,
}: SponsoredToggleProps) => {
  const [isSponsored, setIsSponsored] = useState(initialSponsored);
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialStartDate ? new Date(initialStartDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialEndDate ? new Date(initialEndDate) : addDays(new Date(), 7)
  );
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Helper function to add days
  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Calculate estimated cost based on duration
  useEffect(() => {
    if (startDate && endDate) {
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      // Mock calculation: ₹50/day (in real implementation, this would be based on product price and avg sales)
      setEstimatedCost(durationDays * 50);
    }
  }, [startDate, endDate]);

  const handleToggleChange = (checked: boolean) => {
    setIsSponsored(checked);
    if (checked) {
      onSponsoredChange(true, startDate, endDate);
    } else {
      onSponsoredChange(false);
    }
  };

  const handleQuickDuration = (days: number) => {
    const newEndDate = addDays(startDate || new Date(), days);
    setEndDate(newEndDate);
    if (isSponsored) {
      onSponsoredChange(true, startDate, newEndDate);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Sponsored Listing</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="right">
                    <p className="text-sm">
                      <strong>Pay +5% fee per sale for:</strong>
                    </p>
                    <ul className="text-xs space-y-1 mt-2">
                      <li>• Top placement in search results</li>
                      <li>• Featured in home carousel</li>
                      <li>• 'Sponsored' badge on listing</li>
                      <li>• 20-30% visibility increase</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Boost your product visibility with sponsored placement
            </CardDescription>
          </div>
          <Switch
            checked={isSponsored}
            onCheckedChange={handleToggleChange}
            disabled={disabled}
          />
        </div>
      </CardHeader>

      {isSponsored && (
        <CardContent className="space-y-4">
          {/* Duration Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sponsorship Duration</Label>
            
            {/* Quick Duration Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDuration(7)}
                className="text-xs"
              >
                7 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDuration(14)}
                className="text-xs"
              >
                14 days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDuration(30)}
                className="text-xs"
              >
                30 days
              </Button>
            </div>

            {/* Date Range Display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      disabled={disabled}
                    >
                      {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        if (isSponsored) {
                          onSponsoredChange(true, date, endDate);
                        }
                      }}
                      disabled={(date) => date < new Date() || disabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={disabled}
                    >
                      {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        if (isSponsored) {
                          onSponsoredChange(true, startDate, date);
                        }
                      }}
                      disabled={(date) => date < (startDate || new Date()) || disabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Fee Calculator */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Estimated Cost</span>
              </div>
              <span className="text-lg font-bold text-primary">₹{estimatedCost}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0} days at ₹50/day
              <br />
              <span className="text-[10px]">* Actual charges: 5% per sale during sponsorship period</span>
            </p>
          </div>

          {/* Preview Badge */}
          <div className="p-3 border border-dashed rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview in Customer UI:</p>
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-muted rounded-lg"></div>
              <Badge variant="secondary" className="absolute top-1 right-1 text-[10px]">
                Sponsored
              </Badge>
            </div>
          </div>

          {/* Info Alert */}
          <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg">
            <p className="font-medium text-primary mb-1">How it works:</p>
            <ul className="space-y-1">
              <li>• Your product appears at the top of search results</li>
              <li>• Featured in home carousel for maximum visibility</li>
              <li>• You pay 5% fee only on sales made during sponsorship</li>
              <li>• Can pause or extend anytime</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
