import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const bottomAppBarVariants = cva(
  "fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 z-bottom-bar safe-area-pb",
  {
    variants: {
      variant: {
        default: "h-16",
        extended: "h-20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const BottomAppBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof bottomAppBarVariants>
>(({ className, variant, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(bottomAppBarVariants({ variant }), className)}
    {...props}
  >
    <div className="flex items-center justify-around h-full px-4">
      {children}
    </div>
  </div>
));
BottomAppBar.displayName = "BottomAppBar";

const BottomAppBarItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    icon?: React.ReactNode;
    label?: string;
    badge?: number;
  }
>(({ className, active, icon, label, badge, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-xl transition-colors",
      active
        ? "text-primary bg-primary/10"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      className
    )}
    {...props}
  >
    <div className="relative">
      {icon && <div className="h-6 w-6">{icon}</div>}
      {badge && badge > 0 && (
        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-xs font-medium">
          {badge > 9 ? "9+" : badge}
        </div>
      )}
    </div>
    {label && <span className="text-xs font-medium mt-1">{label}</span>}
    {children}
  </button>
));
BottomAppBarItem.displayName = "BottomAppBarItem";

export { BottomAppBar, BottomAppBarItem };