import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const navigationRailVariants = cva(
  "flex flex-col bg-[hsl(var(--surface-container))] border-r border-[hsl(var(--outline-variant))] h-screen sticky top-0",
  {
    variants: {
      position: {
        left: "order-first",
        right: "order-last",
      },
      size: {
        compact: "w-20",
        expanded: "w-64",
        auto: "w-20 lg:w-64",
      },
    },
    defaultVariants: {
      position: "left",
      size: "auto",
    },
  }
);

const NavigationRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof navigationRailVariants>
>(({ className, position, size, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(navigationRailVariants({ position, size }), className)}
    {...props}
  >
    {children}
  </div>
));
NavigationRail.displayName = "NavigationRail";

const NavigationRailItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    icon?: React.ReactNode;
    label?: string;
  }
>(({ className, active, icon, label, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex items-center p-3 rounded-xl transition-colors min-h-[56px] gap-3 w-full",
      "lg:flex-row lg:justify-start flex-col justify-center",
      active
        ? "bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))]"
        : "text-[hsl(var(--on-surface-variant))] hover:bg-[hsl(var(--surface-container-high))]",
      className
    )}
    {...props}
  >
    {icon && <div className="h-6 w-6 flex-shrink-0">{icon}</div>}
    {label && (
      <span className="text-xs lg:text-sm font-medium lg:block hidden lg:inline">
        {label}
      </span>
    )}
    {children}
  </button>
));
NavigationRailItem.displayName = "NavigationRailItem";

export { NavigationRail, NavigationRailItem };