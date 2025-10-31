import { useState, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export const usePullToRefresh = ({ onRefresh, threshold = 100 }: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);

  // Update ref when pullDistance changes
  const updatePullDistance = useCallback((distance: number) => {
    setPullDistance(distance);
    pullDistanceRef.current = distance;
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      updatePullDistance(0);
    }
  }, [onRefresh, isRefreshing, updatePullDistance]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    
    const touch = e.touches[0];
    const startY = touch.clientY;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const distance = Math.max(0, currentY - startY);
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        const newDistance = Math.min(distance, threshold * 1.5);
        updatePullDistance(newDistance);
      }
    };

    const handleTouchEnd = () => {
      const currentDistance = pullDistanceRef.current;
      if (currentDistance >= threshold) {
        handleRefresh();
      } else {
        updatePullDistance(0);
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [threshold, handleRefresh, updatePullDistance]);

  return {
    isRefreshing,
    pullDistance,
    handleTouchStart,
    showRefreshIndicator: pullDistance > 0
  };
};