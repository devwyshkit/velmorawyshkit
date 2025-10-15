import * as React from "react";
import { cn } from "@/lib/utils";

interface NavigationIndicatorProps {
  className?: string;
  current: number;
  total: number;
  onSelectItem?: (index: number) => void;
  variant?: "dots" | "progress" | "numbers";
}

const NavigationIndicator = React.forwardRef<HTMLDivElement, NavigationIndicatorProps>(
  ({ className, current, total, onSelectItem, variant = "dots", ...props }, ref) => {
    if (total <= 1) return null;

    const renderDots = () => (
      <div className="flex justify-center gap-2">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              index === current
                ? "bg-primary scale-125"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            onClick={() => onSelectItem?.(index)}
            aria-label={`Go to item ${index + 1}`}
          />
        ))}
      </div>
    );

    const renderProgress = () => (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-[2rem]">
          {current + 1}/{total}
        </span>
      </div>
    );

    const renderNumbers = () => (
      <div className="flex justify-center gap-1">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-8 h-8 rounded-full text-xs font-medium transition-colors",
              index === current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
            )}
            onClick={() => onSelectItem?.(index)}
            aria-label={`Go to item ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    );

    return (
      <div
        ref={ref}
        className={cn("py-4", className)}
        {...props}
      >
        {variant === "dots" && renderDots()}
        {variant === "progress" && renderProgress()}
        {variant === "numbers" && renderNumbers()}
      </div>
    );
  }
);

NavigationIndicator.displayName = "NavigationIndicator";

export { NavigationIndicator };