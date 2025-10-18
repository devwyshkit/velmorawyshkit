/**
 * Bulk Pricing Tier Management Form
 * Partner can define quantity-based pricing (Amazon B2B pattern)
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { BulkPricingTier } from '@/lib/integrations/supabase-data';

interface BulkPricingFormProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  tiers: BulkPricingTier[];
  onTiersChange: (tiers: BulkPricingTier[]) => void;
  minOrderQty: number;
  onMinOrderQtyChange: (qty: number) => void;
  basePrice: number; // For calculating discount %
}

export const BulkPricingForm = ({
  enabled,
  onEnabledChange,
  tiers,
  onTiersChange,
  minOrderQty,
  onMinOrderQtyChange,
  basePrice,
}: BulkPricingFormProps) => {
  
  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinQty = lastTier ? (lastTier.max_qty || 0) + 1 : 1;
    
    onTiersChange([
      ...tiers,
      { min_qty: newMinQty, max_qty: null, price_per_unit: 0 },
    ]);
  };

  const removeTier = (index: number) => {
    onTiersChange(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof BulkPricingTier, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onTiersChange(updated);
  };

  const calculateDiscount = (pricePerUnit: number) => {
    if (!basePrice || !pricePerUnit) return 0;
    return Math.round(((basePrice - pricePerUnit) / basePrice) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div>
          <Label htmlFor="bulk-enabled" className="font-medium cursor-pointer">
            Enable Bulk Pricing
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Offer discounts for larger quantities (B2B/Corporate)
          </p>
        </div>
        <Switch
          id="bulk-enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <>
          {/* Minimum Order Quantity */}
          <div>
            <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
            <Input
              id="moq"
              type="number"
              value={minOrderQty}
              onChange={(e) => onMinOrderQtyChange(parseInt(e.target.value) || 1)}
              min={1}
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Customers must order at least this many units
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pricing Tiers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTier}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </Button>
            </div>

            {tiers.map((tier, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tier {index + 1}</span>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTier(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min Quantity</Label>
                    <Input
                      type="number"
                      value={tier.min_qty}
                      onChange={(e) => updateTier(index, 'min_qty', parseInt(e.target.value) || 0)}
                      min={1}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Quantity</Label>
                    <Input
                      type="number"
                      value={tier.max_qty || ''}
                      onChange={(e) => updateTier(index, 'max_qty', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="∞"
                      className="h-9"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Price per Unit (₹)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={tier.price_per_unit ? tier.price_per_unit / 100 : ''}
                      onChange={(e) => updateTier(index, 'price_per_unit', Math.round((parseFloat(e.target.value) || 0) * 100))}
                      placeholder="1499"
                      className="h-9"
                    />
                    {tier.price_per_unit > 0 && (
                      <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                        {calculateDiscount(tier.price_per_unit)}% off
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {tier.min_qty} - {tier.max_qty || '∞'} units: ₹{tier.price_per_unit > 0 ? (tier.price_per_unit / 100).toFixed(0) : '0'}/unit
                </p>
              </div>
            ))}

            {tiers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tiers defined. Click "Add Tier" to create pricing levels.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

