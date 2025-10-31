import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/skeleton-screen";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

export interface Offer {
  id: string;
  title: string;
  discount?: string; // e.g., "50% OFF", "₹200 OFF"
  validUntil?: string; // e.g., "Valid till 31 Dec"
  ctaLink?: string;
  image?: string;
  bankName?: string; // e.g., "HDFC Bank"
  description?: string;
}

interface OfferCardProps {
  offer: Offer;
  onClick?: () => void;
  className?: string;
}

export const OfferCard = ({
  offer,
  onClick,
  className,
}: OfferCardProps) => {
  return (
    <Card
      className={cn(
        "cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow snap-start shrink-0 w-[280px] md:w-[320px] h-32",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 h-full">
        <div className="relative w-full h-full">
          {/* Background Image or Gradient */}
          {offer.image ? (
            <OptimizedImage
              src={offer.image}
              alt={offer.title}
              width={320}
              height={128}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
          )}
          
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-transparent" />
          
          {/* Content */}
          <div className="relative z-10 p-4 h-full flex flex-col justify-between">
            <div className="space-y-1">
              {/* Bank Name Badge (if applicable) */}
              {offer.bankName && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 w-fit">
                  {offer.bankName}
                </Badge>
              )}
              
              {/* Title */}
              <h3 className="font-semibold text-white text-sm line-clamp-2">
                {offer.title}
              </h3>
              
              {/* Description (optional) */}
              {offer.description && (
                <p className="text-white/80 text-xs line-clamp-1">
                  {offer.description}
                </p>
              )}
            </div>
            
            {/* Bottom Row: Discount + Valid Until */}
            <div className="flex items-center justify-between">
              {offer.discount && (
                <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1">
                  {offer.discount}
                </Badge>
              )}
              {offer.validUntil && (
                <span className="text-white/70 text-[10px]">
                  {offer.validUntil}
                </span>
              )}
            </div>
          </div>
          
          {/* Optional Tag Icon (top right) */}
          <div className="absolute top-2 right-2 z-20">
            <Tag className="h-4 w-4 text-white/80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

