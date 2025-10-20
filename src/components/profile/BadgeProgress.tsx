/**
 * Badge Progress Component
 * Feature 6: PROMPT 6 - Loyalty Badges
 * Shows progress towards earning a badge
 * Mobile-first design (320px base)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target } from "lucide-react";
import { Badge as BadgeType, calculateBadgeProgress } from "@/lib/badges/definitions";

interface BadgeProgressProps {
  badge: BadgeType;
  partnerStats: {
    orders?: number;
    revenue?: number;
    rating?: number;
    onTimePercent?: number;
    bulkOrders?: number;
    customOrders?: number;
  };
}

/**
 * Badge Progress Tracker
 * Shows how close partner is to earning a badge
 * Displays missing criteria and estimated time
 */
export const BadgeProgress = ({
  badge,
  partnerStats
}: BadgeProgressProps) => {
  const progress = calculateBadgeProgress(badge, partnerStats);

  if (progress.canEarn || progress.percentage === 0) {
    return null; // Don't show if already earned or no progress
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: badge.color }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4" style={{ color: badge.color }} />
          {badge.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{Math.round(progress.percentage)}%</span>
          </div>
          <Progress 
            value={progress.percentage} 
            className="h-2"
            style={{
              // @ts-ignore - CSS custom property
              '--progress-color': badge.color
            }}
          />
        </div>

        {/* Missing Criteria */}
        {progress.missing.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">To unlock:</p>
            {progress.missing.map((item, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        )}

        {/* Estimated Time (simple heuristic) */}
        {progress.percentage > 0 && progress.percentage < 100 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              At current rate: <span className="font-medium text-foreground">
                {estimateTimeToEarn(progress.percentage)} 
              </span>
            </p>
          </div>
        )}

        {/* Benefits Preview */}
        {badge.benefits.length > 0 && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-xs font-medium flex items-center gap-1">
              <Trophy className="h-3 w-3" style={{ color: badge.color }} />
              Benefits when earned:
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {badge.benefits[0]}
              {badge.benefits.length > 1 && `, +${badge.benefits.length - 1} more`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Estimate time to earn badge based on current progress
 * Simple heuristic: assumes linear progress
 */
function estimateTimeToEarn(progressPercent: number): string {
  if (progressPercent >= 90) return '1-2 days';
  if (progressPercent >= 70) return '3-5 days';
  if (progressPercent >= 50) return '1-2 weeks';
  if (progressPercent >= 25) return '3-4 weeks';
  return '1-2 months';
}

