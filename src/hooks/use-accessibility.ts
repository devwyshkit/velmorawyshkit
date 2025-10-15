import { useEffect, useRef, useCallback } from 'react';

// Hook for focus management
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return { saveFocus, restoreFocus, trapFocus };
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  items: HTMLElement[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options;
  const currentIndexRef = useRef(0);

  const navigate = useCallback((direction: 'next' | 'previous') => {
    if (items.length === 0) return;

    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndexRef.current + 1;
      if (nextIndex >= items.length) {
        nextIndex = loop ? 0 : items.length - 1;
      }
    } else {
      nextIndex = currentIndexRef.current - 1;
      if (nextIndex < 0) {
        nextIndex = loop ? items.length - 1 : 0;
      }
    }

    currentIndexRef.current = nextIndex;
    items[nextIndex]?.focus();
  }, [items, loop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isVertical = orientation === 'vertical';
    const nextKeys = isVertical ? ['ArrowDown'] : ['ArrowRight'];
    const prevKeys = isVertical ? ['ArrowUp'] : ['ArrowLeft'];

    if (nextKeys.includes(e.key)) {
      e.preventDefault();
      navigate('next');
    } else if (prevKeys.includes(e.key)) {
      e.preventDefault();
      navigate('previous');
    } else if (e.key === 'Home') {
      e.preventDefault();
      currentIndexRef.current = 0;
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      currentIndexRef.current = items.length - 1;
      items[items.length - 1]?.focus();
    }
  }, [navigate, orientation, items]);

  return { handleKeyDown, navigate };
}

// Hook for ARIA live regions
export function useLiveRegion() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    }
  }, []);

  return { announce };
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const preferReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return preferReducedMotion;
}

// Hook for skip links
export function useSkipLinks(links: Array<{ href: string; text: string }>) {
  useEffect(() => {
    // Create skip links container
    const skipContainer = document.createElement('div');
    skipContainer.className = 'skip-links';
    skipContainer.style.position = 'absolute';
    skipContainer.style.top = '-40px';
    skipContainer.style.left = '6px';
    skipContainer.style.zIndex = '1000';

    links.forEach(({ href, text }) => {
      const skipLink = document.createElement('a');
      skipLink.href = href;
      skipLink.textContent = text;
      skipLink.style.position = 'absolute';
      skipLink.style.top = '-40px';
      skipLink.style.left = '6px';
      skipLink.style.background = 'white';
      skipLink.style.color = 'black';
      skipLink.style.padding = '8px';
      skipLink.style.textDecoration = 'none';
      skipLink.style.zIndex = '100';

      skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
      });

      skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
      });

      skipContainer.appendChild(skipLink);
    });

    document.body.insertBefore(skipContainer, document.body.firstChild);

    return () => {
      if (skipContainer.parentNode) {
        skipContainer.parentNode.removeChild(skipContainer);
      }
    };
  }, [links]);
}