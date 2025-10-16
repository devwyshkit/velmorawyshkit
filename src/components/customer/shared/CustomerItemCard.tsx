import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerItemCardProps {
  id: string;
  name: string;
  image: string;
  price: number;
  rating?: number;
  badge?: 'bestseller' | 'trending';
  onClick?: () => void;
  className?: string;
}

export const CustomerItemCard = ({
  id,
  name,
  image,
  price,
  rating,
  badge,
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
        {/* Image */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-2">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {badge && (
            <Badge
              className="absolute top-2 left-2 gap-1 text-sm bg-[#FFB3AF] text-foreground border-0 hover:bg-[#FFB3AF]/90"
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
          <h3 className="text-sm font-medium line-clamp-2 leading-tight">
            {name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">
              ₹{price.toLocaleString('en-IN')}
            </p>
            {rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>★</span>
                <span>{rating}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

