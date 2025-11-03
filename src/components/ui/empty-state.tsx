/**
 * EmptyState Component - Reusable empty state with illustrations
 * Swiggy/Zomato pattern with consistent messaging and CTAs
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Package, 
  AlertCircle,
  FileText,
  Users,
  TrendingUp,
  LucideIcon
} from 'lucide-react';
import { pwaNavigationService } from '@/services/pwaNavigationService';
import { RouteMap } from '@/routes';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'cart' | 'wishlist' | 'favourites' | 'saved' | 'products' | 'orders' | 'error';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className = ''
}) => {
  // Default icons based on variant
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return Search;
      case 'cart':
        return ShoppingCart;
      case 'wishlist':
        return Heart;
      case 'favourites':
        return Heart;
      case 'saved':
        return Heart;
      case 'products':
        return Package;
      case 'orders':
        return FileText;
      case 'error':
        return AlertCircle;
      default:
        return Icon || Package;
    }
  };

  const DefaultIcon = getDefaultIcon();

  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 p-4 rounded-full bg-muted/50">
          <DefaultIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick} className="w-full sm:w-auto">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              variant="outline" 
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Predefined empty states for common scenarios
export const EmptyStates = {
  Search: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="search"
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for"
      {...props}
    />
  ),
  
  Cart: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="cart"
      title="Your cart is empty"
      description="Add some products to get started with your order"
      action={{
        label: "Browse Products",
        onClick: () => pwaNavigationService.navigateToHome()
      }}
      {...props}
    />
  ),
  
  Wishlist: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="wishlist"
      title="Sign in to save items"
      description="Create an account to save your favorite items for later"
      action={{
        label: "Sign In",
        onClick: () => pwaNavigationService.navigateTo(RouteMap.login())
      }}
      secondaryAction={{
        label: "Browse Stores",
        onClick: () => pwaNavigationService.navigateToHome()
      }}
      {...props}
    />
  ),
  
  Favourites: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="favourites"
      title="No favourites yet"
      description="Tap the heart icon to save stores and products you love"
      action={{
        label: "Start Exploring",
        onClick: () => pwaNavigationService.navigateToHome()
      }}
      {...props}
    />
  ),
  
  
  Products: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="products"
      title="No products found"
      description="Try adjusting your search or filters to find products"
      action={{
        label: "Clear Filters",
        onClick: () => {
          // Swiggy 2025: Navigate to search without filters instead of reload
          pwaNavigationService.navigateTo(RouteMap.search());
        }
      }}
      {...props}
    />
  ),
  
  Orders: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="orders"
      title="No orders yet"
      description="Your order history will appear here once you start shopping"
      action={{
        label: "Start Shopping",
        onClick: () => pwaNavigationService.navigateToHome()
      }}
      {...props}
    />
  ),
  
  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description="We encountered an error. Please try again or contact support if the problem persists"
      action={{
        label: "Try Again",
        onClick: () => window.location.reload()
      }}
      secondaryAction={{
        label: "Contact Support",
        onClick: () => pwaNavigationService.navigateTo(RouteMap.help())
      }}
      {...props}
    />
  ),

  NoResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="search"
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for"
      {...props}
    />
  )
};

export default EmptyState;
