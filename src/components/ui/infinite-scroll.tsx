import React, { useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
}

export const InfiniteScroll = ({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 100,
  className,
  loadingComponent
}: InfiniteScrollProps) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreCallback = useCallback(() => {
    if (hasMore && !isLoading) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadMoreCallback();
      }
    }, options);

    const sentinelElement = scrollElement.querySelector('[data-infinite-scroll-sentinel]');
    if (sentinelElement) {
      observerRef.current.observe(sentinelElement);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreCallback, threshold]);

  const defaultLoadingComponent = (
    <div className="flex justify-center items-center py-4">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
    </div>
  );

  return (
    <div ref={scrollElementRef} className={cn("relative", className)}>
      {children}
      {hasMore && (
        <div data-infinite-scroll-sentinel className="h-1">
          {isLoading && (loadingComponent || defaultLoadingComponent)}
        </div>
      )}
    </div>
  );
};

// Hook for infinite scroll logic
export const useInfiniteScroll = (
  fetchMore: () => Promise<void>,
  hasMore: boolean,
  isLoading: boolean
) => {
  const [isFetching, setIsFetching] = React.useState(false);

  const loadMore = useCallback(async () => {
    if (isFetching || isLoading || !hasMore) return;
    
    setIsFetching(true);
    try {
      await fetchMore();
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setIsFetching(false);
    }
  }, [fetchMore, hasMore, isLoading, isFetching]);

  return {
    loadMore,
    isFetching: isFetching || isLoading
  };
};