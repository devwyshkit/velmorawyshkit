import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Gift } from "lucide-react";
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
          {/* Sponsored Badge - Top Left (Zomato pattern) */}
          {sponsored && (
            <Badge className="absolute top-2 left-2 bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-xs border-amber-200 dark:border-amber-700">
              Sponsored
            </Badge>
          )}
          {/* Bestseller/Trending Badge - Top Right */}
          {badge && (
            <Badge
              className="absolute top-2 right-2 gap-1 text-sm bg-[#FFB3AF] dark:bg-[#8B4A47] text-foreground border-0 hover:bg-[#FFB3AF]/90 dark:hover:bg-[#8B4A47]/90"
            >
              {badge === 'bestseller' ? (
                <>
                  <Trophy className="w-3 h-3" />
                  Bestseller
                </>
              ) : (
                <>
                  <Flame className="w-3 h-3" />
                  Trending
                </>
              )}
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
            {/* Price - 14px bold per spec */}
            <p className="text-sm font-bold text-primary">
              ₹{price.toLocaleString('en-IN')}
            </p>
            {/* Rating - 12px with count per spec */}
            {rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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

