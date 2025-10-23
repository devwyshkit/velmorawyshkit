/**
 * SkeletonScreen Component - Loading states to prevent CLS
 * Swiggy/Zomato pattern with proper dimensions
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div 
    className={cn(
      "animate-pulse rounded-md bg-muted/50",
      className
    )}
  />
);

// Predefined skeleton components
export const SkeletonComponents = {
  // Card skeleton
  Card: () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  ),

  // Table skeleton
  Table: ({ rows = 5 }: { rows?: number }) => (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  ),

  // List skeleton
  List: ({ items = 3 }: { items?: number }) => (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),

  // Product card skeleton
  ProductCard: () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  ),

  // Search results skeleton
  SearchResults: ({ count = 3 }: { count?: number }) => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-16 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  ),

  // Form skeleton
  Form: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  ),

  // Dashboard skeleton
  Dashboard: () => (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Chart area */}
      <Skeleton className="h-64 w-full" />
      
      {/* Table */}
      <Skeleton.Table rows={5} />
    </div>
  )
};

// Optimized image component to prevent CLS
export const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: 'lazy' | 'eager';
}> = ({ src, alt, width, height, className, loading = 'lazy' }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={cn("relative", className)} style={{ aspectRatio: `${width}/${height}` }}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {hasError ? (
        <div className="flex items-center justify-center w-full h-full bg-muted/50">
          <span className="text-muted-foreground text-sm">Image unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          style={{ aspectRatio: `${width}/${height}` }}
        />
      )}
    </div>
  );
};

export default Skeleton;
