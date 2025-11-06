/**
 * Add-ons Selector Component
 * Swiggy/Zomato Pattern: Add-ons conditionally appear based on quantity (MOQ)
 * Battle-tested from food delivery apps and e-commerce platforms
 */

import { useState, useMemo } from 'react';
import { AddOn, CalculatedAddOns } from '@/types/product';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice } from '@/lib/pricing/tieredPricing';
import { Lock, Unlock, Eye, Upload, Sparkles } from 'lucide-react';

interface AddOnsSelectorProps {
  addOns: AddOn[];
  quantity: number;
  selectedAddOnIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  className?: string;
}

export function AddOnsSelector({
  addOns,
  quantity,
  selectedAddOnIds,
  onSelectionChange,
  className = '',
}: AddOnsSelectorProps) {
  // Separate standard and bulk add-ons
  const { standardAddOns, bulkAddOns } = useMemo(() => {
    const standard = addOns.filter((addon) => addon.type === 'standard');
    const bulk = addOns.filter((addon) => addon.type === 'bulk');
    return { standardAddOns: standard, bulkAddOns: bulk };
  }, [addOns]);
  
  // Determine which bulk add-ons are unlocked
  const unlockedBulkAddOns = useMemo(() => {
    return bulkAddOns.filter((addon) => {
      const moq = addon.minimumOrder || 0;
      return quantity >= moq;
    });
  }, [bulkAddOns, quantity]);
  
  // Determine which bulk add-ons are still locked
  const lockedBulkAddOns = useMemo(() => {
    return bulkAddOns.filter((addon) => {
      const moq = addon.minimumOrder || 0;
      return quantity < moq;
    });
  }, [bulkAddOns, quantity]);
  
  // Calculate total add-on cost
  const totalAddOnCost = useMemo(() => {
    return selectedAddOnIds.reduce((total, id) => {
      const addon = addOns.find((a) => a.id === id);
      if (addon) {
        return total + addon.price * quantity; // price per item * quantity
      }
      return total;
    }, 0);
  }, [selectedAddOnIds, addOns, quantity]);
  
  const handleToggle = (addonId: string, isChecked: boolean) => {
    if (isChecked) {
      onSelectionChange([...selectedAddOnIds, addonId]);
    } else {
      onSelectionChange(selectedAddOnIds.filter((id) => id !== addonId));
    }
  };
  
  const hasStandardAddOns = standardAddOns.length > 0;
  const hasBulkAddOns = bulkAddOns.length > 0;
  const hasUnlockedBulkAddOns = unlockedBulkAddOns.length > 0;
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Heading */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Make It Special
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your order with these add-ons
        </p>
      </div>
      
      {/* Standard Add-ons (Always Visible) */}
      {hasStandardAddOns && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Available for all orders
          </h4>
          <div className="space-y-3">
            {standardAddOns.map((addon) => (
              <AddOnItem
                key={addon.id}
                addon={addon}
                quantity={quantity}
                isSelected={selectedAddOnIds.includes(addon.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Unlocked Bulk Add-ons (Show with "NOW AVAILABLE" message) */}
      {hasBulkAddOns && hasUnlockedBulkAddOns && (
        <div className="space-y-3">
          {/* Unlock Success Message */}
          <Alert className="border-green-500 bg-green-50">
            <Unlock className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm font-medium text-green-600">
              ✅ Corporate Customization Now Available!
            </AlertDescription>
          </Alert>
          
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            Corporate Customization
            <Badge variant="secondary" className="text-xs">
              Available for {unlockedBulkAddOns[0]?.minimumOrder}+ items
            </Badge>
          </h4>
          
          <div className="space-y-3">
            {unlockedBulkAddOns.map((addon) => (
              <AddOnItem
                key={addon.id}
                addon={addon}
                quantity={quantity}
                isSelected={selectedAddOnIds.includes(addon.id)}
                onToggle={handleToggle}
                isNewlyUnlocked={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Locked Bulk Add-ons (Show with unlock hint) */}
      {hasBulkAddOns && lockedBulkAddOns.length > 0 && (
        <div className="space-y-3 opacity-60">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Corporate Customization
          </h4>
          
          <div className="space-y-3">
            {lockedBulkAddOns.map((addon) => {
              const moq = addon.minimumOrder || 0;
              const needed = moq - quantity;
              
              return (
                <div
                  key={addon.id}
                  className="border rounded-lg p-4 bg-muted/30 cursor-not-allowed"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">{addon.name}</span>
                      </div>
                      {addon.description && (
                        <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                      )}
                      
                      {/* Unlock Hint (Swiggy pattern) */}
                      <div className="mt-2 text-sm text-primary font-medium">
                        Add {needed} more item{needed > 1 ? 's' : ''} to unlock this option
                      </div>
                    </div>
                    
                    <div className="text-sm font-semibold text-muted-foreground">
                      +{formatPrice(addon.price)}/item
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Total Add-ons Cost */}
      {selectedAddOnIds.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Add-ons Total ({selectedAddOnIds.length} selected)</span>
            <span className="font-semibold">{formatPrice(totalAddOnCost)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Add-on Item
 */
function AddOnItem({
  addon,
  quantity,
  isSelected,
  onToggle,
  isNewlyUnlocked = false,
}: {
  addon: AddOn;
  quantity: number;
  isSelected: boolean;
  onToggle: (id: string, checked: boolean) => void;
  isNewlyUnlocked?: boolean;
}) {
  const totalCost = addon.price * quantity;
  
  return (
    <div
      className={`border rounded-lg p-4 ${isNewlyUnlocked ? 'border-green-500 bg-green-50' : ''} ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={addon.id}
          checked={isSelected}
          onCheckedChange={(checked) => onToggle(addon.id, checked as boolean)}
          className="mt-0.5"
        />
        
        <div className="flex-1">
          <Label htmlFor={addon.id} className="cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="font-medium">{addon.name}</span>
              
              {/* Badges */}
              {addon.type === 'bulk' && (
                <Badge variant="secondary" className="text-xs">
                  Bulk Only
                </Badge>
              )}
              {isNewlyUnlocked && (
                <Badge variant="default" className="text-xs bg-green-600">
                  Just Unlocked!
                </Badge>
              )}
            </div>
            
            {/* Description */}
            {addon.description && (
              <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
            )}
            
            {/* Additional Info */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {addon.requiresProof && (
                <span className="flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  Logo/design upload required
                </span>
              )}
              {addon.minimumOrder && (
                <span>
                  Minimum order: {addon.minimumOrder} items
                </span>
              )}
            </div>
          </Label>
        </div>
        
        {/* Price */}
        <div className="text-right">
          <div className="text-sm font-semibold">
            +{formatPrice(totalCost)}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatPrice(addon.price)}/item
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate selected add-ons total
 * Helper function for use in other components
 */
export function calculateAddOnsTotal(
  selectedAddOnIds: string[],
  addOns: AddOn[],
  quantity: number
): CalculatedAddOns {
  const selectedAddOns = addOns.filter((addon) => selectedAddOnIds.includes(addon.id));
  
  const totalAddOnCost = selectedAddOns.reduce((total, addon) => {
    return total + addon.price * quantity;
  }, 0);
  
  const perItemAddOnCost = selectedAddOns.reduce((total, addon) => {
    return total + addon.price;
  }, 0);
  
  const unlockedBulkAddOns = addOns.filter((addon) => {
    if (addon.type !== 'bulk') return false;
    const moq = addon.minimumOrder || 0;
    return quantity >= moq;
  });
  
  return {
    selectedAddOns,
    totalAddOnCost,
    perItemAddOnCost,
    unlockedBulkAddOns,
  };
}

