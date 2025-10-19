import { useState, useEffect } from "react";
import { Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { BulkTier } from "@/types/products";
import { cn } from "@/lib/utils";

interface BulkPricingTiersProps {
  basePrice: number;  // Retail price (in paise) from parent form
  initialTiers?: BulkTier[];
  onTiersChange: (tiers: BulkTier[]) => void;
  disabled?: boolean;
}

/**
 * Bulk Pricing Tiers Component (PROMPT 1)
 * Zomato/Swiggy pattern: Restaurant-controlled pricing for bulk orders
 * Partners define up to 5 pricing tiers with automatic validation
 * 
 * Features:
 * - Multi-tier support (up to 5)
 * - Auto-calculated discount percentages
 * - Real-time validation (no overlaps, ascending quantities, descending prices)
 * - Mobile-first responsive design
 */
export const BulkPricingTiers = ({
  basePrice,
  initialTiers = [],
  onTiersChange,
  disabled = false,
}: BulkPricingTiersProps) => {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<BulkTier[]>(initialTiers);

  // Calculate discount percentage
  const calculateDiscount = (tierPrice: number, basePrice: number): number => {
    if (basePrice === 0) return 0;
    return Math.round(((basePrice - tierPrice) / basePrice) * 100);
  };

  // Add new tier
  const handleAddTier = () => {
    if (tiers.length >= 5) {
      toast({
        title: "Maximum tiers reached",
        description: "You can add up to 5 pricing tiers",
        variant: "destructive",
      });
      return;
    }

    // Suggest next tier based on existing ones
    const lastTier = tiers[tiers.length - 1];
    const suggestedMinQty = lastTier ? (lastTier.maxQty || lastTier.minQty) + 1 : 10;
    const suggestedPrice = lastTier ? Math.round(lastTier.price * 0.95) : Math.round(basePrice * 0.9);

    const newTier: BulkTier = {
      minQty: suggestedMinQty,
      price: suggestedPrice,
      discountPercent: calculateDiscount(suggestedPrice, basePrice),
    };

    setTiers([...tiers, newTier]);
  };

  // Remove tier
  const handleRemoveTier = (index: number) => {
    if (tiers.length === 1) {
      toast({
        title: "Cannot remove last tier",
        description: "At least one tier is required if bulk pricing is enabled",
        variant: "destructive",
      });
      return;
    }

    setTiers(tiers.filter((_, i) => i !== index));
  };

  // Update tier field
  const updateTier = (index: number, field: keyof BulkTier, value: number) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate discount when price changes
    if (field === 'price') {
      updated[index].discountPercent = calculateDiscount(value, basePrice);
    }

    // Auto-calculate maxQty from next tier's minQty
    if (field === 'minQty' && index < tiers.length - 1) {
      updated[index].maxQty = updated[index + 1].minQty - 1;
    }

    setTiers(updated);
  };

  // Validate tiers
  const validateTiers = (): { valid: boolean; error?: string } => {
    if (tiers.length === 0) return { valid: true };

    // Check ascending quantities
    for (let i = 0; i < tiers.length - 1; i++) {
      if (tiers[i].minQty >= tiers[i + 1].minQty) {
        return {
          valid: false,
          error: `Tier ${i + 2} quantity (${tiers[i + 1].minQty}) must be greater than Tier ${i + 1} (${tiers[i].minQty})`,
        };
      }
    }

    // Check descending prices
    for (let i = 0; i < tiers.length - 1; i++) {
      if (tiers[i].price <= tiers[i + 1].price) {
        return {
          valid: false,
          error: `Tier ${i + 2} price must be less than Tier ${i + 1} for bulk discount`,
        };
      }
    }

    // Check all prices less than base price
    for (let i = 0; i < tiers.length; i++) {
      if (tiers[i].price >= basePrice) {
        return {
          valid: false,
          error: `Tier ${i + 1} price (₹${tiers[i].price / 100}) must be less than retail price (₹${basePrice / 100})`,
        };
      }
    }

    return { valid: true };
  };

  // Notify parent of changes (with validation)
  useEffect(() => {
    const validation = validateTiers();
    if (validation.valid) {
      onTiersChange(tiers);
    }
  }, [tiers, onTiersChange]);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="bulk-pricing" className="border-none">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium">💰 Bulk Pricing Tiers (Optional)</span>
            {tiers.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {tiers.length} tier{tiers.length > 1 ? 's' : ''}
              </span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Offer discounted pricing for bulk orders. Prices auto-apply in customer UI when quantity meets threshold.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="space-y-4 pt-2">
            {/* Explanation */}
            <p className="text-sm text-gray-600">
              Set discounted prices for bulk quantities. Example: 10-49 units at ₹1,400 each, 50+ units at ₹1,300 each.
            </p>

            {/* Tier List */}
            {tiers.length > 0 && (
              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      {/* Tier Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">
                          Tier {index + 1}
                        </h4>
                        {tiers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTier(index)}
                            disabled={disabled}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Tier Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Min Quantity */}
                        <div className="space-y-2">
                          <Label htmlFor={`tier-${index}-minQty`} className="text-xs">
                            Min Quantity
                          </Label>
                          <Input
                            id={`tier-${index}-minQty`}
                            type="number"
                            min="1"
                            value={tier.minQty}
                            onChange={(e) => updateTier(index, 'minQty', parseInt(e.target.value) || 0)}
                            disabled={disabled}
                            className="text-sm"
                          />
                        </div>

                        {/* Price per Unit */}
                        <div className="space-y-2">
                          <Label htmlFor={`tier-${index}-price`} className="text-xs">
                            Price per Unit (₹)
                          </Label>
                          <Input
                            id={`tier-${index}-price`}
                            type="number"
                            min="1"
                            value={tier.price / 100}
                            onChange={(e) => updateTier(index, 'price', Math.round((parseFloat(e.target.value) || 0) * 100))}
                            disabled={disabled}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Tier Summary */}
                      <div className="p-2 bg-gray-50 rounded text-xs space-y-1">
                        <p className="text-gray-700">
                          <span className="font-medium">Range:</span> {tier.minQty}
                          {tier.maxQty ? `-${tier.maxQty}` : '+'} units
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Price:</span> ₹{(tier.price / 100).toLocaleString('en-IN')} per unit
                        </p>
                        <p className={cn(
                          "font-medium",
                          tier.discountPercent > 0 ? "text-green-600" : "text-gray-500"
                        )}>
                          <span className="font-normal text-gray-700">Discount:</span> {tier.discountPercent}% off retail
                        </p>
                        <p className="text-gray-600 italic">
                          Customer pays: ₹{((tier.price / 100) * tier.minQty).toLocaleString('en-IN')} for {tier.minQty} units
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Tier Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTier}
              disabled={disabled || tiers.length >= 5}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {tiers.length === 0 ? "Add First Tier" : `Add Tier (${5 - tiers.length} left)`}
            </Button>

            {/* Validation Error Display */}
            {tiers.length > 0 && (() => {
              const validation = validateTiers();
              if (!validation.valid) {
                return (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{validation.error}</p>
                  </div>
                );
              }
              return null;
            })()}

            {/* Preview Message */}
            {tiers.length > 0 && validateTiers().valid && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium">Bulk pricing will auto-apply in customer UI</p>
                  <p className="mt-1">
                    When customers order {tiers[0].minQty}+ units, they'll see discounted tier pricing automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

