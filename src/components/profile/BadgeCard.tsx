/**
 * Badge Card Component
 * Feature 6: PROMPT 6 - Loyalty Badges
 * Displays individual partner achievement badges
 * Mobile-first design (320px base)
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Trophy, Star, Zap, Briefcase, Palette, Award, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge as BadgeType } from "@/lib/badges/definitions";

interface BadgeCardProps {
  badge: BadgeType;
  earned?: boolean;
  earnedAt?: string;
  progress?: number; // 0-100
  className?: string;
}

const iconMap: Record<string, any> = {
  Trophy,
  Star,
  Zap,
  Briefcase,
  Palette,
  Award,
  Shield,
};

/**
 * Individual Badge Card
 * Shows earned badges in color, locked badges in grayscale
 * Displays progress bar for in-progress badges
 */
export const BadgeCard = ({
  badge,
  earned = false,
  earnedAt,
  progress = 0,
  className,
}: BadgeCardProps) => {
  const Icon = iconMap[badge.icon] || Shield;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        earned ? "border-2" : "opacity-60",
        className
      )}
      style={{
        borderColor: earned ? badge.color : undefined
      }}
    >
      <CardContent className="p-4 space-y-3">
        {/* Icon and Name */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full",
              earned ? "bg-opacity-20" : "bg-muted"
            )}
            style={{
              backgroundColor: earned ? `${badge.color}20` : undefined
            }}
          >
            {earned ? (
              <Icon
                className="w-6 h-6"
                style={{ color: badge.color }}
              />
            ) : (
              <Lock className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight line-clamp-1">
              {badge.name}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {badge.description}
            </p>
          </div>
        </div>

        {/* Earned Date or Progress */}
        {earned && earnedAt ? (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Earned {new Date(earnedAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        ) : (
          progress > 0 && progress < 100 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: badge.color
                  }}
                />
              </div>
            </div>
          )
        )}

        {/* Benefits (only show for earned badges) */}
        {earned && badge.benefits.length > 0 && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Benefits:</p>
            {badge.benefits.slice(0, 2).map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground line-clamp-1">{benefit}</p>
              </div>
            ))}
            {badge.benefits.length > 2 && (
              <p className="text-xs text-primary">+{badge.benefits.length - 2} more</p>
            )}
          </div>
        )}

        {/* Locked State Indicator */}
        {!earned && progress === 0 && (
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

