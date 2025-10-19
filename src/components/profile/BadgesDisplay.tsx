/**
 * Badges Display Component
 * Shows earned, in-progress, and locked badges
 * Zomato Gold pattern: Trust signals (10-15% conversion increase)
 */

import { Trophy, Star, Zap, Briefcase, Palette, CheckCircle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { badgeDefinitions } from "@/types/badges";

const iconMap: Record<string, React.ComponentType<any>> = {
  Trophy,
  Star,
  Zap,
  Briefcase,
  Palette,
  CheckCircle
};

interface BadgesDisplayProps {
  partnerId: string;
}

export const BadgesDisplay = ({ partnerId }: BadgesDisplayProps) => {
  // Mock: Partner has 1 earned badge (Verified Seller) and progress towards others
  const earnedBadges = [badgeDefinitions[5]]; // Verified Seller
  const inProgressBadges = badgeDefinitions.filter((_, idx) => idx < 2); // Premium & 5-Star
  const lockedBadges = badgeDefinitions.filter((_, idx) => idx >= 2 && idx < 5);

  // Mock progress data
  const progress = {
    premium_partner: { orders: 18, revenue: 250000, rating: 4.6 },
    five_star: { orders: 45, rating: 4.7 }
  };

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Your Badges</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {earnedBadges.map(badge => {
              const Icon = iconMap[badge.icon];
              return (
                <Card key={badge.type} className="border-2" style={{ borderColor: badge.color }}>
                  <CardContent className="pt-6 text-center">
                    {Icon && <Icon className="h-12 w-12 mx-auto mb-2" style={{ color: badge.color }} />}
                    <p className="font-bold mb-1">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>
                    <div className="space-y-1">
                      {badge.benefits.map((benefit, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">✓ {benefit}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* In Progress Badges */}
      {inProgressBadges.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">In Progress</h3>
          <div className="space-y-3">
            {inProgressBadges.map(badge => {
              const Icon = iconMap[badge.icon];
              const prog = progress[badge.type as keyof typeof progress];
              let completionPercent = 0;
              let progressText = "";

              if (badge.type === 'premium_partner' && prog) {
                const ordersPercent = ((prog as any).orders / (badge.criteria.orders || 1)) * 100;
                const revenuePercent = ((prog as any).revenue / (badge.criteria.revenue || 1)) * 100;
                const ratingPercent = ((prog as any).rating / (badge.criteria.rating || 1)) * 100;
                completionPercent = Math.min(ordersPercent, revenuePercent, ratingPercent);
                progressText = `${(prog as any).orders}/${badge.criteria.orders} orders • ₹${((prog as any).revenue / 100000).toFixed(1)}L/${(badge.criteria.revenue! / 100000).toFixed(0)}L revenue`;
              } else if (badge.type === 'five_star' && prog) {
                const ordersPercent = ((prog as any).orders / (badge.criteria.orders || 1)) * 100;
                completionPercent = ordersPercent;
                progressText = `${(prog as any).orders}/${badge.criteria.orders} orders`;
              }

              return (
                <Card key={badge.type}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {Icon && <Icon className="h-8 w-8 shrink-0" style={{ color: badge.color }} />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium mb-1">{badge.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{progressText}</p>
                        <Progress value={completionPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{completionPercent.toFixed(0)}% complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-muted-foreground">Locked Badges</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {lockedBadges.map(badge => {
              const Icon = iconMap[badge.icon];
              return (
                <Card key={badge.type} className="opacity-60">
                  <CardContent className="pt-6 text-center">
                    <div className="relative inline-block">
                      {Icon && <Icon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />}
                      <Lock className="h-5 w-5 absolute -top-1 -right-1 text-muted-foreground" />
                    </div>
                    <p className="font-medium mb-1 text-muted-foreground">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

