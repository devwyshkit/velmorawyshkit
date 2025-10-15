import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CartIndicatorProps {
  count: number;
  onClick: () => void;
  className?: string;
  variant?: "header" | "floating" | "minimal";
}

export const CartIndicator = ({ 
  count, 
  onClick, 
  className,
  variant = "header" 
}: CartIndicatorProps) => {
  const baseClasses = "relative";
  
  const variantClasses = {
    header: "h-12 w-12 hover:bg-[hsl(var(--surface-container-high))]",
    floating: "h-14 w-14 rounded-full shadow-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:shadow-xl fixed bottom-20 right-4 z-40",
    minimal: "h-10 w-10"
  };

  return (
    <Button
      variant={variant === "floating" ? "default" : "ghost"}
      size="icon"
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={onClick}
      aria-label={`Shopping cart with ${count} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] min-w-[20px]"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Button>
  );
};