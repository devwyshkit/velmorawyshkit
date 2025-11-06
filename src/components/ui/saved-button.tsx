import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { safeJsonParse } from "@/lib/utils/safe-json";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Global E-commerce Saved Button - Amazon/Myntra Standard
// Universal pattern for save for later functionality

interface SavedButtonProps {
  productId: string;
  productName: string;
  isSaved?: boolean;
  onToggle?: (productId: string, isSaved: boolean) => void;
  variant?: "icon" | "full";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SavedButton = ({
  productId,
  productName,
  isSaved: initialSaved = false,
  onToggle,
  variant = "icon",
  size = "md",
  className
}: SavedButtonProps) => {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const newState = !isSaved;
      setIsSaved(newState);
      
      // Update localStorage
      const savedItems = safeJsonParse(localStorage.getItem('wyshkit-favorites'), [] as Array<{ id: string; [key: string]: unknown }>);
      if (newState) {
        savedItems.push({
          productId,
          productName,
          addedAt: new Date().toISOString()
        });
      } else {
        const index = savedItems.findIndex((item: any) => item.productId === productId);
        if (index > -1) savedItems.splice(index, 1);
      }
      localStorage.setItem('wyshkit-favorites', JSON.stringify(savedItems));
      
      // Call parent callback
      onToggle?.(productId, newState);
      
      // Show toast
      toast({
        title: newState ? "Added to favourites" : "Removed from favourites",
        description: productName,
      });
      
    } catch (error) {
      console.error('Failed to update favourites:', error);
      setIsSaved(!isSaved); // Revert on error
      
      toast({
        title: "Error",
        description: "Failed to update favourites. Please try again.",
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
          isSaved && "bg-red-50 border-red-200",
          className
        )}
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isSaved ? "Remove from favourites" : "Add to favourites"}
      >
        <Heart 
          className={cn(
            iconSizes[size],
            "transition-colors duration-200",
            isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground",
            isLoading && "animate-pulse"
          )} 
        />
      </Button>
    );
  }

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      size="sm"
      className={cn(
        sizeClasses[size],
        "transition-all duration-200",
        isSaved && "bg-red-500 hover:bg-red-600 text-white",
        className
      )}
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "mr-2 transition-colors duration-200",
          isSaved ? "fill-current" : ""
        )} 
      />
      {isSaved ? "Favourited" : "Favourite"}
    </Button>
  );
};
