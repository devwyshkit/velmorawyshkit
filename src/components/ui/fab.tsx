import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fabVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 fixed z-50 shadow-lg hover:shadow-xl",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-secondary/25",
        surface: "bg-surface-container text-on-surface hover:bg-surface-container-high shadow-surface-container/25",
        tertiary: "bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/80 shadow-tertiary-container/25",
      },
      size: {
        sm: "h-12 w-12",
        default: "h-14 w-14",
        lg: "h-16 w-16",
        extended: "h-14 px-6 gap-2",
      },
      position: {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "bottom-center": "bottom-6 left-1/2 -translate-x-1/2",
        "top-right": "top-6 right-6",
        "top-left": "top-6 left-6",
        "center-right": "top-1/2 right-6 -translate-y-1/2",
        "center-left": "top-1/2 left-6 -translate-y-1/2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      position: "bottom-right",
    },
  }
);

export interface FabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  children: React.ReactNode;
  label?: string;
}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, variant, size, position, children, label, ...props }, ref) => {
    const isExtended = size === "extended";

    return (
      <button
        className={cn(fabVariants({ variant, size, position }), className)}
        ref={ref}
        aria-label={label}
        {...props}
      >
        {children}
        {isExtended && label && (
          <span className="text-sm font-medium">{label}</span>
        )}
      </button>
    );
  }
);
Fab.displayName = "Fab";

export { Fab, fabVariants };