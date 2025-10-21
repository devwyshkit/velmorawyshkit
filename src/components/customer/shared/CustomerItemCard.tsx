import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerItemCardProps {
  id: string;
  name: string;
  image: string;
  price: number;
  rating?: number;
  ratingCount?: number;
  badge?: 'bestseller' | 'trending';
  shortDesc?: string;
  sponsored?: boolean;
  isCustomizable?: boolean;
  campaignDiscount?: { type: 'percentage' | 'flat'; value: number }; // NEW!
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
  onClick,
  className,
}: CustomerItemCardProps) => {
  return (
    <Card
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-2">
        {/* Image - 1:1 square (Amazon/Flipkart standard for vendor image reuse) */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Hide broken image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Fallback icon - shows if image fails */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
            <Gift className="w-12 h-12" />
          </div>
          {/* Sponsored Badge - Top Left (Small icon + text, Zomato pattern) */}
          {sponsored && (
            <Badge className="absolute top-2 left-2 bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 gap-0.5 text-[10px] border-amber-200 dark:border-amber-700">
              <Sparkles className="h-2.5 w-2.5 text-amber-900 dark:text-amber-100" />
              <span className="text-amber-900 dark:text-amber-100 font-medium">Sponsored</span>
            </Badge>
          )}
          {/* Bestseller/Trending Badge - Top Right (Small icon + text, Swiggy pattern) */}
          {badge && !campaignDiscount && (
            <Badge
              className="absolute top-2 right-2 px-1.5 py-0.5 gap-0.5 text-[10px] bg-[#FFB3AF] dark:bg-[#8B4A47] border-0"
            >
              {badge === 'bestseller' ? (
                <>
                  <Trophy className="h-2.5 w-2.5 text-foreground" />
                  <span className="font-medium">Bestseller</span>
                </>
              ) : (
                <>
                  <Flame className="h-2.5 w-2.5 text-foreground" />
                  <span className="font-medium">Trending</span>
                </>
              )}
            </Badge>
          )}
          {/* Campaign Discount Badge - Top Right (Highest priority, Zomato pattern) */}
          {campaignDiscount && (
            <Badge className="absolute top-2 right-2 px-2 py-1 gap-0.5 text-xs bg-red-500 text-white border-0 font-bold shadow-md">
              {campaignDiscount.type === 'percentage' 
                ? `${campaignDiscount.value}% OFF` 
                : `₹${campaignDiscount.value} OFF`}
            </Badge>
          )}
          {/* Customizable Badge - Bottom Right (Icon only, secondary info) */}
          {isCustomizable && (
            <Badge className="absolute bottom-2 right-2 p-1 bg-background/90 dark:bg-card/90 backdrop-blur-sm border border-border" aria-label="Customizable">
              <Gift className="h-3 w-3 text-primary" />
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
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
            {/* Price - 14px bold per spec (hide for partners with price -1 or 0) */}
            {price > 0 && (
              <p className="text-sm font-bold text-primary">
                ₹{price.toLocaleString('en-IN')}
              </p>
            )}
            {/* Rating - 12px with count per spec */}
            {rating && (
              <div className={cn(
                "flex items-center gap-1 text-xs text-muted-foreground",
                price <= 0 && "ml-auto" // Right-align if no price shown
              )}>
                <span>★</span>
                <span>{rating}</span>
                {ratingCount && <span>({ratingCount})</span>}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

