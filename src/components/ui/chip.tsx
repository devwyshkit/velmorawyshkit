import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center rounded-full border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // AssistChip - informational, no selection
        assist: "border-outline bg-surface text-on-surface hover:bg-surface-variant",
        // FilterChip - selectable for filtering
        filter: "border-outline bg-surface text-on-surface hover:bg-surface-variant data-[selected=true]:bg-secondary-container data-[selected=true]:text-on-secondary-container data-[selected=true]:border-secondary",
        // InputChip - for input fields with dismiss
        input: "border-outline bg-surface text-on-surface hover:bg-surface-variant",
        // SuggestionChip - actionable suggestions
        suggestion: "border-outline bg-surface text-on-surface hover:bg-surface-variant hover:border-primary",
      },
      size: {
        default: "h-8 px-3 py-1",
        sm: "h-6 px-2 py-0.5",
        lg: "h-10 px-4 py-2",
      },
      elevation: {
        none: "",
        elevated: "shadow-sm bg-surface-container",
      }
    },
    defaultVariants: {
      variant: "assist",
      size: "default",
      elevation: "none",
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  selected?: boolean;
  disabled?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, size, elevation, selected, disabled, dismissible, onDismiss, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          chipVariants({ variant, size, elevation, className }),
          disabled && "opacity-50 pointer-events-none",
          "cursor-pointer"
        )}
        data-selected={selected}
        {...props}
      >
        {icon && <span className="mr-1.5">{icon}</span>}
        <span className="truncate">{children}</span>
        {dismissible && onDismiss && (
          <button
            type="button"
            className="ml-1.5 hover:bg-on-surface/10 rounded-full p-0.5 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);
Chip.displayName = "Chip";

// Specific chip components for better semantic usage
const AssistChip = React.forwardRef<HTMLDivElement, Omit<ChipProps, "variant">>(
  (props, ref) => <Chip ref={ref} variant="assist" {...props} />
);
AssistChip.displayName = "AssistChip";

const FilterChip = React.forwardRef<HTMLDivElement, Omit<ChipProps, "variant">>(
  (props, ref) => <Chip ref={ref} variant="filter" {...props} />
);
FilterChip.displayName = "FilterChip";

const InputChip = React.forwardRef<HTMLDivElement, Omit<ChipProps, "variant">>(
  (props, ref) => <Chip ref={ref} variant="input" dismissible {...props} />
);
InputChip.displayName = "InputChip";

const SuggestionChip = React.forwardRef<HTMLDivElement, Omit<ChipProps, "variant">>(
  (props, ref) => <Chip ref={ref} variant="suggestion" {...props} />
);
SuggestionChip.displayName = "SuggestionChip";

export { Chip, AssistChip, FilterChip, InputChip, SuggestionChip, chipVariants };