/**
 * Badge Card Component
 * Displays a single badge with earned status and progress
 */

import { Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { BadgeDefinition } from "@/lib/badges/definitions";
import { format } from "date-fns";

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned: boolean;
  progress: number;
  earnedAt?: string;
}

export const BadgeCard = ({ badge, earned, progress, earnedAt }: BadgeCardProps) => {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-950',
      border: 'border-gray-300 dark:border-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-300',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300',
    },
  };

  const colors = colorClasses[badge.color] || colorClasses.gray;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg",
        earned ? colors.border : "border-muted",
        earned ? colors.bg : "bg-muted/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "text-4xl",
                !earned && "opacity-30 grayscale"
              )}
            >
              {badge.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight">{badge.name}</h3>
              {earned && earnedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Earned {format(new Date(earnedAt), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>
          {earned ? (
            <CheckCircle2 className={cn("h-5 w-5 flex-shrink-0", colors.text)} />
          ) : (
            <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{badge.description}</p>

        {/* Progress Bar (for locked badges) */}
        {!earned && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Criteria */}
        {!earned && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {badge.criteria.min_orders && (
                <li>• {badge.criteria.min_orders}+ orders</li>
              )}
              {badge.criteria.min_rating && (
                <li>• {badge.criteria.min_rating}+ average rating</li>
              )}
              {badge.criteria.min_on_time_rate && (
                <li>• {badge.criteria.min_on_time_rate}%+ on-time delivery</li>
              )}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {badge.benefits && badge.benefits.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Benefits:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {badge.benefits.map((benefit, idx) => (
                <li key={idx}>✓ {benefit}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Earned Badge */}
        {earned && (
          <Badge className={cn("w-full justify-center", colors.text)}>
            Earned
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

