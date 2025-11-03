/**
 * Step 1: Listing Type Selection
 * Choose between Individual Product, Hamper/Combo, or Service Only
 * Mobile-first, B2C-friendly language
 */

import { ListingType } from '@/types/product';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Package, Gift, Wrench } from 'lucide-react';

interface Step1ListingTypeProps {
  value: ListingType;
  onChange: (value: ListingType) => void;
}

const LISTING_TYPES = [
  {
    value: 'individual' as ListingType,
    icon: Package,
    title: 'Individual Product',
    description: 'Single item with gifting service (box, wrapping, card)',
    examples: 'Example: Premium gift-packed wireless earbuds, Branded power bank with custom box',
  },
  {
    value: 'hamper' as ListingType,
    icon: Gift,
    title: 'Hamper / Combo',
    description: 'Multiple items bundled together in a gift package',
    examples: 'Example: Tech hamper (speaker + earbuds + power bank), Gourmet gift box (chocolates + wine + nuts)',
  },
  {
    value: 'service' as ListingType,
    icon: Wrench,
    title: 'Service Only',
    description: 'Gift wrapping, customization, or other services',
    examples: 'Example: Premium gift wrapping service, Logo engraving service',
  },
];

export function Step1ListingType({ value, onChange }: Step1ListingTypeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What are you offering?</CardTitle>
        <CardDescription>
          Choose the type of listing you want to create. This helps customers find your products.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={(v) => onChange(v as ListingType)}>
          <div className="grid gap-4 md:grid-cols-3">
            {LISTING_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = value === type.value;

              return (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={`flex cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                >
                  <Card className="w-full border-0 shadow-none">
                    <CardContent className="p-4 space-y-3">
                      {/* Icon & Radio */}
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="font-semibold text-sm mb-1">{type.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {type.description}
                        </p>
                      </div>

                      {/* Examples */}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground italic">
                          {type.examples}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Label>
              );
            })}
          </div>
        </RadioGroup>

        {/* Helper Text */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Customers see all types the same way - as gift options.
            This categorization helps with inventory and pricing management.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

