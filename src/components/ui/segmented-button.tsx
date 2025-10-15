import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedButtonProps {
  children: React.ReactNode;
  className?: string;
}

interface SegmentedButtonItemProps {
  children: React.ReactNode;
  value: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

const SegmentedButton = React.forwardRef<HTMLDivElement, SegmentedButtonProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
SegmentedButton.displayName = "SegmentedButton";

const SegmentedButtonItem = React.forwardRef<HTMLButtonElement, SegmentedButtonItemProps>(
  ({ className, children, isActive, onClick, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
);
SegmentedButtonItem.displayName = "SegmentedButtonItem";

export { SegmentedButton, SegmentedButtonItem };