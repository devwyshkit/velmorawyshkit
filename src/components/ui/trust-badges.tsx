import { Badge } from "@/components/ui/badge";
import { Shield, Award, Truck, RefreshCw, Users, Star, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Global E-commerce Standard Trust Badges - Security & Social Proof
// Norton, SSL, Trustpilot, Quality assurance indicators

interface TrustBadge {
  type: "security" | "quality" | "delivery" | "support" | "social" | "certification";
  text: string;
  icon?: any;
  verified?: boolean;
  rating?: number;
  count?: number;
}
interface TrustBadgeProps {
  badges?: TrustBadge[];
  variant?: "compact" | "detailed" | "inline";
  showSecurityFirst?: boolean;
  className?: string;
}
export const TrustBadges = ({
  badges = [],
  variant = "compact",
  showSecurityFirst = true,
  className
}: TrustBadgeProps) => {
  // Default badges following global e-commerce standards
  const defaultBadges: TrustBadge[] = [{
    type: "security",
    text: "SSL Secured",
    icon: Lock,
    verified: true
  }, {
    type: "quality",
    text: "Quality Assured",
    icon: Award,
    verified: true
  }, {
    type: "delivery",
    text: "Fast Delivery",
    icon: Truck,
    verified: true
  }, {
    type: "support",
    text: "24/7 Support",
    icon: CheckCircle,
    verified: true
  }, {
    type: "social",
    text: "Trusted by 10K+",
    icon: Users,
    verified: true,
    count: 10000
  }];
  const allBadges = badges.length > 0 ? badges : defaultBadges;

  // Sort badges to show security first if enabled
  const sortedBadges = showSecurityFirst ? [...allBadges].sort((a, b) => {
    if (a.type === "security") return -1;
    if (b.type === "security") return 1;
    return 0;
  }) : allBadges;
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "security":
        return "bg-green-50 text-green-700 border-green-200";
      case "quality":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "delivery":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "support":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "social":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "certification":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };
  if (variant === "inline") {
    return <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {sortedBadges.slice(0, 3).map((badge, index) => {
        const IconComponent = badge.icon || Shield;
        return <div key={index} className="flex items-center gap-1">
              <IconComponent className="h-3 w-3 text-green-600" />
              <span className="text-xs text-muted-foreground">{badge.text}</span>
              {badge.verified && <CheckCircle className="h-3 w-3 text-green-600" />}
            </div>;
      })}
      </div>;
  }
  if (variant === "compact") {
    return;
  }

  // Detailed variant
  return <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium text-muted-foreground">Trust & Security</h4>
      <div className="grid grid-cols-2 gap-2">
        {sortedBadges.map((badge, index) => {
        const IconComponent = badge.icon || Shield;
        return <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getBadgeColor(badge.type))}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{badge.text}</div>
                {badge.rating && <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{badge.rating}</span>
                    {badge.count && <span>({badge.count}+)</span>}
                  </div>}
                {badge.verified && !badge.rating && <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Verified</span>
                  </div>}
              </div>
            </div>;
      })}
      </div>
    </div>;
};