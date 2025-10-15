import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusChipVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        pending: "bg-[hsl(var(--warning-container))] text-[hsl(var(--on-warning-container))] border border-[hsl(var(--warning))]",
        confirmed: "bg-[hsl(var(--info-container))] text-[hsl(var(--on-info-container))] border border-[hsl(var(--info))]",
        inProgress: "bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))] border border-[hsl(var(--tertiary))]",
        shipped: "bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))] border border-[hsl(var(--primary))]",
        delivered: "bg-[hsl(var(--success-container))] text-[hsl(var(--on-success-container))] border border-[hsl(var(--success))]",
        cancelled: "bg-[hsl(var(--error-container))] text-[hsl(var(--on-error-container))] border border-[hsl(var(--error))]",
        refunded: "bg-[hsl(var(--surface-variant))] text-[hsl(var(--on-surface-variant))] border border-[hsl(var(--outline))]",
        ready: "bg-[hsl(var(--success-container))] text-[hsl(var(--on-success-container))] border border-[hsl(var(--success))]",
        custom: "bg-[hsl(var(--secondary-container))] text-[hsl(var(--on-secondary-container))] border border-[hsl(var(--secondary))]",
        featured: "bg-[hsl(var(--primary-container))] text-[hsl(var(--on-primary-container))] border border-[hsl(var(--primary))]",
        bulk: "bg-[hsl(var(--tertiary-container))] text-[hsl(var(--on-tertiary-container))] border border-[hsl(var(--tertiary))]",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "default",
    },
  }
);

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusChipVariants> {
  status: "pending" | "confirmed" | "inProgress" | "shipped" | "delivered" | "cancelled" | "refunded" | "ready" | "custom" | "featured" | "bulk";
}

const StatusChip = React.forwardRef<HTMLDivElement, StatusChipProps>(
  ({ className, status, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusChipVariants({ status, size }), className)}
        {...props}
      />
    );
  }
);
StatusChip.displayName = "StatusChip";

export { StatusChip, statusChipVariants };