import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const topAppBarVariants = cva("flex items-center w-full bg-[hsl(var(--surface-container))] border-b border-[hsl(var(--outline-variant))]", {
  variants: {
    variant: {
      small: "h-16 px-4",
      medium: "h-20 px-4",
      large: "h-24 px-4"
    },
    position: {
      fixed: "fixed top-0 left-0 right-0 z-50",
      sticky: "sticky top-0 z-40",
      static: "relative"
    }
  },
  defaultVariants: {
    variant: "medium",
    position: "static"
  }
});
export interface TopAppBarProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof topAppBarVariants> {
  title?: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}
const TopAppBar = React.forwardRef<HTMLElement, TopAppBarProps>(({
  className,
  variant,
  position,
  title,
  subtitle,
  leading,
  trailing,
  children,
  ...props
}, ref) => {
  return <header ref={ref} className={cn(topAppBarVariants({
    variant,
    position
  }), className)} {...props}>
        {leading && <div className="flex items-center mr-4">
            {leading}
          </div>}
        
        
        
        {trailing && <div className="flex items-center ml-4">
            {trailing}
          </div>}
      </header>;
});
TopAppBar.displayName = "TopAppBar";

// TopAppBar Title Component
const TopAppBarTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  className,
  children,
  ...props
}, ref) => {
  return <h1 ref={ref} className={cn("text-lg font-semibold text-[hsl(var(--on-surface))] truncate", className)} {...props}>
        {children}
      </h1>;
});
TopAppBarTitle.displayName = "TopAppBarTitle";
export { TopAppBar, TopAppBarTitle, topAppBarVariants };