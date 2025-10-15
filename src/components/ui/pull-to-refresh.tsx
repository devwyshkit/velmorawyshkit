import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, RotateCcw } from "lucide-react";

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold?: number;
  onTouchStart: (e: React.TouchEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh = React.forwardRef<HTMLDivElement, PullToRefreshProps>(
  ({ isRefreshing, pullDistance, threshold = 100, onTouchStart, children, className }, ref) => {
    const progress = Math.min(pullDistance / threshold, 1);
    const shouldShowIndicator = pullDistance > 0 || isRefreshing;

    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        onTouchStart={onTouchStart}
      >
        {/* Pull indicator */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 ease-out",
            shouldShowIndicator ? "translate-y-0" : "-translate-y-full"
          )}
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          }}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full shadow-lg">
            {isRefreshing ? (
              <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
            ) : (
              <RotateCcw
                className="w-6 h-6 text-primary-foreground transition-transform duration-200"
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                }}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className="transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(${pullDistance > 0 ? Math.min(pullDistance * 0.5, 60) : 0}px)`,
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

PullToRefresh.displayName = "PullToRefresh";