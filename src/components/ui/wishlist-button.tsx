import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Global E-commerce Wishlist Button - Amazon/Myntra Standard
// Universal pattern for save for later functionality

interface WishlistButtonProps {
  productId: string;
  productName: string;
  isWishlisted?: boolean;
  onToggle?: (productId: string, isWishlisted: boolean) => void;
  variant?: "icon" | "full";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const WishlistButton = ({
  productId,
  productName,
  isWishlisted: initialWishlisted = false,
  onToggle,
  variant = "icon",
  size = "md",
  className
}: WishlistButtonProps) => {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const newState = !isWishlisted;
      setIsWishlisted(newState);
      
      // Update localStorage
      const wishlist = JSON.parse(localStorage.getItem('wyshkit-wishlist') || '[]');
      if (newState) {
        wishlist.push({
          productId,
          productName,
          addedAt: new Date().toISOString()
        });
      } else {
        const index = wishlist.findIndex((item: any) => item.productId === productId);
        if (index > -1) wishlist.splice(index, 1);
      }
      localStorage.setItem('wyshkit-wishlist', JSON.stringify(wishlist));
      
      // Call parent callback
      onToggle?.(productId, newState);
      
      // Show toast
      toast({
        title: newState ? "Added to wishlist" : "Removed from wishlist",
        description: productName,
      });
      
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      setIsWishlisted(!isWishlisted); // Revert on error
      
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: variant === "icon" ? "h-6 w-6" : "h-7 px-2 text-xs",
    md: variant === "icon" ? "h-8 w-8" : "h-8 px-3 text-sm",
    lg: variant === "icon" ? "h-10 w-10" : "h-10 px-4 text-sm"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  if (variant === "icon") {
    return (
      <Button
        size="icon"
        variant="secondary"
        className={cn(
          sizeClasses[size],
          "bg-background/90 backdrop-blur border shadow-sm transition-all duration-200",
          isWishlisted && "bg-red-50 border-red-200",
          className
        )}
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart 
          className={cn(
            iconSizes[size],
            "transition-colors duration-200",
            isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground",
            isLoading && "animate-pulse"
          )} 
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isWishlisted ? "default" : "outline"}
      size="sm"
      className={cn(
        sizeClasses[size],
        "transition-all duration-200",
        isWishlisted && "bg-red-500 hover:bg-red-600 text-white",
        className
      )}
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "mr-2 transition-colors duration-200",
          isWishlisted ? "fill-current" : ""
        )} 
      />
      {isWishlisted ? "Saved" : "Save"}
    </Button>
  );
};