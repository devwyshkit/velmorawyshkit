import * as React from "react";
import { cn } from "@/lib/utils";

export interface LinearProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  buffer?: number;
  indeterminate?: boolean;
}

const LinearProgress = React.forwardRef<HTMLDivElement, LinearProgressProps>(
  ({ className, value = 0, buffer, indeterminate = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-1 w-full overflow-hidden rounded-full bg-surface-variant",
          className
        )}
        {...props}
      >
        {/* Buffer indicator (if provided) */}
        {buffer !== undefined && (
          <div
            className="absolute left-0 top-0 h-full bg-surface-variant transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, buffer))}%` }}
          />
        )}
        
        {/* Progress indicator */}
        <div
          className={cn(
            "h-full bg-primary transition-all duration-300",
            indeterminate && "animate-pulse"
          )}
          style={{
            width: indeterminate ? "100%" : `${Math.min(100, Math.max(0, value))}%`,
            transform: indeterminate 
              ? "translateX(-100%) scaleX(0.3)" 
              : "translateX(0%) scaleX(1)",
            animation: indeterminate 
              ? "linear-progress 2s ease-in-out infinite" 
              : undefined,
          }}
        />
        
      </div>
    );
  }
);
LinearProgress.displayName = "LinearProgress";

export { LinearProgress };