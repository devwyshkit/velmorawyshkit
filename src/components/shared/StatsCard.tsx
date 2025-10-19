import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}

/**
 * Reusable stats/metrics card component
 * Used across Customer, Partner, and Admin dashboards
 * Follows Swiggy/Zomato dashboard pattern
 * 
 * Usage:
 * <StatsCard
 *   title="Today's Orders"
 *   value={24}
 *   icon={ShoppingBag}
 *   trend="+12% from yesterday"
 *   trendDirection="up"
 * />
 */
export const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  className,
}: StatsCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trendDirection === 'up' && "text-green-600 dark:text-green-400",
                trendDirection === 'down' && "text-red-600 dark:text-red-400",
                trendDirection === 'neutral' && "text-muted-foreground"
              )}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            "bg-primary/10 dark:bg-primary/20"
          )}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

