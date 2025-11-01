import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Flame,
  Gift,
  Sparkles,
  Plus,
  Minus,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CustomerItemCardProps {
  id: string;
  name: string;
  image: string;
  price: number;
  rating?: number;
  ratingCount?: number;
  badge?: "bestseller" | "trending";
  shortDesc?: string;
  sponsored?: boolean;
  isCustomizable?: boolean;
  campaignDiscount?: { type: "percentage" | "flat"; value: number }; // NEW!
  // Removed variant prop - grid is the global e-commerce standard
  moq?: number; // NEW: Minimum order quantity
  eta?: string; // NEW: Delivery ETA
  isFavourited?: boolean;
  onFavouriteToggle?: (itemId: string, isFavourited: boolean) => void;
  onClick?: () => void;
  className?: string;
}

export const CustomerItemCard = ({
  id,
  name,
  image,
  price,
  rating,
  ratingCount,
  badge,
  shortDesc,
  sponsored,
  isCustomizable,
  campaignDiscount,
  // Removed variant prop
  moq,
  eta,
  isFavourited,
  onFavouriteToggle,
  onClick,
  className,
}: CustomerItemCardProps) => {
  const [quantity, setQuantity] = useState(0);

  // Grid variant (global e-commerce standard) - Swiggy 2025 pattern
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        className,
      )}
      onClick={(e) => {
        // Only trigger if not clicking ADD button
        if (onClick && !(e.target as HTMLElement).closest("button")) {
          onClick();
        }
      }}
    >
      <CardContent className="p-3">
        {/* Image - 1:1 square (Amazon/Flipkart standard for vendor image reuse) */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-3">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Fallback icon - shows if image fails */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
            <Gift className="w-12 h-12" />
          </div>
          {/* Badge Positioning Strategy:
              - Top Left: Sponsored OR (if not sponsored) Bestseller/Trending
              - Top Right: Heart button (always visible if onFavouriteToggle provided)
          */}
          {sponsored ? (
            <Badge className="absolute top-2 left-2 bg-amber-100 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200">
              <Sparkles className="h-2.5 w-2.5 text-amber-900" />
              <span className="text-amber-900 font-medium">Sponsored</span>
            </Badge>
          ) : badge ? (
            <Badge
              className={cn(
                "absolute top-2 left-2 px-1.5 py-0.5 gap-0.5 text-[10px] border-0",
                badge === "bestseller"
                  ? "bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))]"
                  : "bg-[hsl(var(--warning-container))] text-[hsl(var(--on-warning-container))]",
              )}
            >
              {badge === "bestseller" ? (
                <>
                  <Trophy className="h-2.5 w-2.5" />
                  <span className="font-medium">Bestseller</span>
                </>
              ) : (
                <>
                  <Flame className="h-2.5 w-2.5" />
                  <span className="font-medium">Trending</span>
                </>
              )}
            </Badge>
          ) : null}

          {/* Favourite Button - Top Right (Swiggy pattern) */}
          {onFavouriteToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavouriteToggle(id, !isFavourited);
              }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border border-border shadow-sm hover:bg-white transition-all duration-200 flex items-center justify-center z-10"
              aria-label={
                isFavourited ? "Remove from favourites" : "Add to favourites"
              }
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  isFavourited
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground",
                )}
              />
            </button>
          )}

          {/* Campaign Discount - Overlay on top-right (below heart) */}
          {campaignDiscount && (
            <Badge className="absolute top-10 right-2 px-2 py-1 gap-0.5 text-xs bg-red-500 text-white border-0 font-bold shadow-md">
              {campaignDiscount.type === "percentage"
                ? `${campaignDiscount.value}% OFF`
                : `₹${campaignDiscount.value} OFF`}
            </Badge>
          )}
          {/* Customizable Badge - Bottom Right (Icon only, secondary info) */}
          {isCustomizable && (
            <Badge
              className="absolute bottom-2 right-2 p-1 bg-background/90 backdrop-blur-sm border border-border"
              aria-label="Customizable"
            >
              <Gift className="h-3 w-3 text-primary" />
            </Badge>
          )}
          {/* MOQ Badge - Bottom Left */}
          {moq && moq > 1 && (
            <Badge
              variant="secondary"
              className="absolute bottom-2 left-2 text-xs px-1.5 py-0.5"
            >
              Min {moq}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          {/* Name - 16px bold per spec */}
          <h3 className="text-base font-bold line-clamp-1 leading-tight">
            {name}
          </h3>

          {/* Short Description - 3 lines, 12px gray per spec (emotional appeal for gifting) */}
          {shortDesc && (
            <p className="text-xs text-muted-foreground line-clamp-3 leading-snug">
              {shortDesc}
            </p>
          )}

          {/* Price and Rating */}
          <div className="flex items-center justify-between">
            {/* Price - 16px bold per spec (hide for partners with price -1 or 0) */}
            {price > 0 && (
              <p className="text-base font-bold text-primary">
                ₹{price.toLocaleString("en-IN")}
              </p>
            )}
            {/* Rating - 12px with count per spec */}
            {rating && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs text-muted-foreground",
                  price <= 0 && "ml-auto", // Right-align if no price shown
                )}
              >
                <span>★</span>
                <span>{rating}</span>
                {ratingCount && <span>({ratingCount})</span>}
              </div>
            )}
          </div>

          {/* ADD Button / Quantity Stepper - Swiggy 2025 pattern */}
          <div className="mt-2 flex justify-end">
            {quantity === 0 ? (
              <Button
                size="sm"
                className="h-8 px-4 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(1);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                ADD
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quantity > 0) setQuantity(quantity - 1);
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium min-w-[20px] text-center">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity(quantity + 1);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
