/**
 * Badges Display Component
 * Feature 7: PROMPT 6
 * Shows earned and in-progress badges in partner profile
 */

import { useState, useEffect } from "react";
import { Trophy, Star, Zap, Briefcase, Palette, Award, CheckCircle, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { BADGE_DEFINITIONS, checkBadgeCriteria } from "@/lib/badges/definitions";
import type { PartnerBadge, BadgeProgress } from "@/types/badges";
import { format } from "date-fns";

const ICON_MAP = {
  Trophy,
  Star,
  Zap,
  Briefcase,
  Palette,
  Award,
  CheckCircle,
};

export const BadgesDisplay = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState<PartnerBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  const loadBadges = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch earned badges
      const { data: badges, error } = await supabase
        .from('partner_badges')
        .select('*')
        .eq('partner_id', user.id);

      if (error) {
        console.warn('Badges fetch failed:', error);
        setEarnedBadges([]);
      } else {
        setEarnedBadges(badges || []);
      }

      // Calculate progress for unearned badges
      // TODO: Fetch actual partner metrics from partner_profiles
      const mockMetrics = {
        orders: 25,
        revenue: 2500000,
        rating: 4.7,
        onTimePercent: 92,
        bulkOrders: 5,
        customOrders: 15,
        activeDays: 45,
      };

      const progress = BADGE_DEFINITIONS.map(badge => {
        const isEarned = (badges || []).some(b => b.badge_type === badge.type);
        const meetsAll = checkBadgeCriteria(badge, mockMetrics);

        return {
          badge,
          earned: isEarned,
          progress: isEarned ? 100 : calculateProgress(badge, mockMetrics),
          current_values: mockMetrics,
          missing_requirements: getMissingRequirements(badge, mockMetrics),
        };
      });

      setBadgeProgress(progress);
    } catch (error) {
      console.error('Load badges error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (badge: any, metrics: Record<string, number>): number => {
    const criteria = badge.criteria;
    const checks = [];

    if (criteria.orders) checks.push((metrics.orders / criteria.orders) * 100);
    if (criteria.revenue) checks.push((metrics.revenue / criteria.revenue) * 100);
    if (criteria.rating) checks.push((metrics.rating / criteria.rating) * 100);
    if (criteria.onTimePercent) checks.push((metrics.onTimePercent / criteria.onTimePercent) * 100);
    if (criteria.bulkOrders) checks.push((metrics.bulkOrders / criteria.bulkOrders) * 100);
    if (criteria.customOrders) checks.push((metrics.customOrders / criteria.customOrders) * 100);
    if (criteria.activeDays) checks.push((metrics.activeDays / criteria.activeDays) * 100);

    return Math.min(100, checks.length > 0 ? checks.reduce((a, b) => a + b) / checks.length : 0);
  };

  const getMissingRequirements = (badge: any, metrics: Record<string, number>): string[] => {
    const missing = [];
    const criteria = badge.criteria;

    if (criteria.orders && metrics.orders < criteria.orders) {
      missing.push(`${criteria.orders - metrics.orders} more orders`);
    }
    if (criteria.rating && metrics.rating < criteria.rating) {
      missing.push(`Improve rating to ${criteria.rating}★`);
    }
    if (criteria.onTimePercent && metrics.onTimePercent < criteria.onTimePercent) {
      missing.push(`Improve on-time delivery to ${criteria.onTimePercent}%`);
    }

    return missing;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Badges</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earnedBadges.map(earnedBadge => {
              const badge = BADGE_DEFINITIONS.find(b => b.type === earnedBadge.badge_type);
              if (!badge) return null;

              const IconComponent = ICON_MAP[badge.icon as keyof typeof ICON_MAP];

              return (
                <Card key={earnedBadge.id} className="border-2 border-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                        {IconComponent && <IconComponent className="h-8 w-8 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{badge.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Earned {format(new Date(earnedBadge.earned_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-medium">Benefits:</p>
                      {badge.benefits.map((benefit, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">• {benefit}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* In-Progress & Locked Badges */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {earnedBadges.length > 0 ? 'More Badges to Earn' : 'Available Badges'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badgeProgress
            .filter(bp => !bp.earned)
            .map(({ badge, progress, missing_requirements }) => {
              const IconComponent = ICON_MAP[badge.icon as keyof typeof ICON_MAP];

              return (
                <Card key={badge.type} className="opacity-80 hover:opacity-100 transition-opacity">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 relative">
                        {IconComponent && <IconComponent className="h-8 w-8 text-muted-foreground" />}
                        {progress < 50 && (
                          <div className="absolute -top-1 -right-1">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{badge.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {missing_requirements.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium mb-1">To earn:</p>
                            {missing_requirements.slice(0, 2).map((req, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground">• {req}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
};

