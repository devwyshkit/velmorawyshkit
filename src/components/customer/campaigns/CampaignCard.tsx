/**
 * Campaign Card Component
 * Displays active promotional campaigns in customer UI
 * Follows Swiggy/Zomato offers card pattern
 */

import { Clock, Tag, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { formatDistanceToNow } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  type: 'discount' | 'bogo' | 'free_shipping';
  discount_type?: 'percentage' | 'flat';
  discount_value: number;
  banner_url?: string;
  start_date: string;
  end_date: string;
  terms?: string;
  products: string[]; // Product IDs (JSONB array)
}

interface CampaignCardProps {
  campaign: Campaign;
}

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const navigate = useNavigate();

  const getDiscountText = () => {
    if (campaign.type === 'bogo') return 'Buy 1 Get 1 FREE';
    if (campaign.type === 'free_shipping') return 'FREE Shipping';
    if (campaign.discount_type === 'percentage') {
      return `${campaign.discount_value}% OFF`;
    }
    return `₹${campaign.discount_value} OFF`;
  };

  const isExpiringSoon = () => {
    const hoursLeft = (new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft <= 24;
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(RouteMap.search(`campaign=${campaign.id}`))}
    >
      <div className="flex gap-3 p-3">
        {/* Campaign Icon/Image */}
        {campaign.banner_url ? (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            <img 
              src={campaign.banner_url} 
              alt={campaign.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <Tag className="h-10 w-10 text-white" />
          </div>
        )}

        {/* Campaign Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1">
              {campaign.name}
            </h3>
            {isExpiringSoon() && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                Ending Soon
              </Badge>
            )}
          </div>

          {/* Discount Badge */}
          <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200 dark:border-red-700 mb-2">
            {getDiscountText()}
          </Badge>

          {/* Terms */}
          {campaign.terms && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {campaign.terms}
            </p>
          )}

          {/* Expiry */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Ends {formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(RouteMap.search(`campaign=${campaign.id}`));
              }}
            >
              Shop Now
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

