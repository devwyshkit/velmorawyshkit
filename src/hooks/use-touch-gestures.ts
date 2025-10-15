import { useRef, useEffect } from 'react';

interface TouchGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPullToRefresh?: () => void;
  threshold?: number;
}

export const useTouchGestures = (options: TouchGesturesOptions) => {
  const ref = useRef<HTMLElement>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const threshold = options.threshold || 50;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY
      };

      const deltaX = touchEnd.x - touchStart.current.x;
      const deltaY = touchEnd.y - touchStart.current.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > threshold && options.onSwipeRight) {
          options.onSwipeRight();
        } else if (deltaX < -threshold && options.onSwipeLeft) {
          options.onSwipeLeft();
        }
      } else if (deltaY > threshold && options.onPullToRefresh && window.scrollY === 0) {
        options.onPullToRefresh();
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [options, threshold]);

  return ref;
};