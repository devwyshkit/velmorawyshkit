/**
 * Partner Badges Page
 * Display loyalty badges based on performance metrics
 * Gamification to encourage partner engagement
 */

import { useState, useEffect } from "react";
import { Trophy, Star, Zap, Award, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { BadgeCard } from "@/components/partner/badges/BadgeCard";
import { BADGE_DEFINITIONS, type BadgeType, type PartnerBadge } from "@/lib/badges/definitions";

export const PartnerBadges = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState<PartnerBadge[]>([]);
  const [metrics, setMetrics] = useState({
    total_orders: 0,
    rating: 0,
    on_time_delivery_rate: 0,
  });

  useEffect(() => {
    if (user) {
      loadBadgesAndMetrics();
    }
  }, [user]);

  const loadBadgesAndMetrics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load partner metrics
      const { data: profile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('total_orders, rating')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        // Calculate on-time delivery rate (mock for now)
        const onTimeRate = 95; // TODO: Calculate from orders table

        setMetrics({
          total_orders: profile.total_orders || 0,
          rating: profile.rating || 0,
          on_time_delivery_rate: onTimeRate,
        });
      }

      // Load earned badges
      const { data: badges, error: badgesError } = await supabase
        .from('partner_badges')
        .select('*')
        .eq('partner_id', user.id);

      if (!badgesError && badges) {
        setEarnedBadges(badges);
      }
    } catch (error) {
      console.error('Load badges error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBadgeEarned = (badgeType: BadgeType): boolean => {
    return earnedBadges.some(b => b.badge_type === badgeType);
  };

  const getBadgeProgress = (badgeType: BadgeType): number => {
    const badge = BADGE_DEFINITIONS.find(b => b.type === badgeType);
    if (!badge) return 0;

    let progress = 0;
    const criteria = badge.criteria;

    // Calculate progress based on badge type
    if (criteria.min_orders) {
      progress = Math.max(progress, (metrics.total_orders / criteria.min_orders) * 100);
    }
    if (criteria.min_rating) {
      progress = Math.max(progress, (metrics.rating / criteria.min_rating) * 100);
    }
    if (criteria.min_on_time_rate) {
      progress = Math.max(progress, (metrics.on_time_delivery_rate / criteria.min_on_time_rate) * 100);
    }

    return Math.min(progress, 100);
  };

  const earnedBadgesList = BADGE_DEFINITIONS.filter(b => isBadgeEarned(b.type));
  const lockedBadgesList = BADGE_DEFINITIONS.filter(b => !isBadgeEarned(b.type));

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Loyalty Badges</h1>
        <p className="text-muted-foreground">
          Earn badges by providing excellent service and growing your business
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Earned Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnedBadgesList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {BADGE_DEFINITIONS.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_orders}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime orders completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rating > 0 ? metrics.rating.toFixed(1) : 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">Customer satisfaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">On-Time Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.on_time_delivery_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Delivery performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Earned Badges */}
      {earnedBadgesList.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Earned Badges</h2>
            <p className="text-sm text-muted-foreground">Badges you've unlocked through excellent performance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadgesList.map(badge => {
              const earned = earnedBadges.find(b => b.badge_type === badge.type);
              return (
                <BadgeCard
                  key={badge.type}
                  badge={badge}
                  earned={true}
                  earnedAt={earned?.earned_at}
                  progress={100}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadgesList.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Available Badges</h2>
            <p className="text-sm text-muted-foreground">Keep improving to unlock these badges</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedBadgesList.map(badge => (
              <BadgeCard
                key={badge.type}
                badge={badge}
                earned={false}
                progress={getBadgeProgress(badge.type)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Tips to Earn More Badges
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Maintain high ratings by providing excellent customer service</li>
                <li>Deliver orders on time to build trust with customers</li>
                <li>Complete more orders to unlock volume-based badges</li>
                <li>Respond promptly to customer reviews and disputes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

