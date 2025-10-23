/**
 * Mobile Optimization Utilities
 * Fix common mobile issues like overflow, touch targets, and performance
 */

// Mobile breakpoints
export const MOBILE_BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

// Touch target minimum sizes
export const TOUCH_TARGETS = {
  minimum: '44px',
  comfortable: '48px',
  large: '56px',
} as const;

// Mobile-first CSS classes
export const MOBILE_CLASSES = {
  // Prevent horizontal overflow
  noOverflow: 'overflow-x-hidden',
  
  // Touch-friendly buttons
  touchButton: 'min-h-[44px] min-w-[44px]',
  
  // Mobile text sizes
  textXs: 'text-xs sm:text-sm',
  textSm: 'text-sm sm:text-base',
  textBase: 'text-base sm:text-lg',
  
  // Mobile spacing
  spacingXs: 'p-2 sm:p-3',
  spacingSm: 'p-3 sm:p-4',
  spacingMd: 'p-4 sm:p-6',
  
  // Mobile grid
  gridMobile: 'grid-cols-1 sm:grid-cols-2',
  gridTablet: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  
  // Mobile cards
  cardMobile: 'p-3 sm:p-4',
  cardPadding: 'p-4 sm:p-6',
  
  // Mobile navigation
  navMobile: 'fixed bottom-0 left-0 right-0 z-50',
  navDesktop: 'hidden md:block',
  
  // Mobile modals
  modalMobile: 'max-h-[90vh] overflow-y-auto',
  modalDesktop: 'max-h-[80vh]',
} as const;

// Check if device is mobile
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

// Check if device is touch
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Get responsive class based on screen size
export const getResponsiveClass = (mobile: string, desktop: string): string => {
  return `${mobile} md:${desktop}`;
};

// Mobile-optimized image loading
export const getOptimizedImageUrl = (url: string, width?: number): string => {
  if (!url) return '/placeholder.svg';
  
  // Add width parameter for optimization
  if (width) {
    return `${url}?w=${width}&q=80`;
  }
  
  return url;
};

// Mobile performance optimization
export const optimizeForMobile = {
  // Lazy load images
  lazyLoad: 'loading="lazy"',
  
  // Optimize animations
  reduceMotion: 'motion-reduce:transition-none',
  
  // Touch gestures
  touchAction: 'touch-action: manipulation',
  
  // Prevent zoom on input focus
  preventZoom: 'text-base sm:text-sm',
} as const;

// Mobile accessibility
export const mobileAccessibility = {
  // High contrast mode
  highContrast: 'contrast-more:border-2',
  
  // Focus indicators
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-offset-2',
  
  // Screen reader text
  srOnly: 'sr-only',
  
  // Skip links
  skipLink: 'absolute -top-10 left-0 bg-primary text-primary-foreground p-2 rounded focus:top-0',
} as const;

// Mobile form optimization
export const mobileForms = {
  // Input sizing
  inputMobile: 'h-12 text-base',
  inputDesktop: 'h-10 text-sm',
  
  // Button sizing
  buttonMobile: 'h-12 px-4 text-base',
  buttonDesktop: 'h-10 px-3 text-sm',
  
  // Form spacing
  formSpacing: 'space-y-4',
  formGroup: 'space-y-2',
} as const;

// Mobile navigation optimization
export const mobileNavigation = {
  // Bottom navigation
  bottomNav: 'fixed bottom-0 left-0 right-0 z-50 bg-background border-t',
  
  // Top navigation
  topNav: 'sticky top-0 z-40 bg-background/95 backdrop-blur',
  
  // Side navigation
  sideNav: 'hidden md:block',
  
  // Mobile menu
  mobileMenu: 'md:hidden',
} as const;

// Mobile layout utilities
export const mobileLayout = {
  // Container
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  
  // Safe area
  safeArea: 'pb-20 md:pb-6',
  
  // Full height
  fullHeight: 'min-h-screen',
  
  // Flex utilities
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  flexCenter: 'flex items-center justify-center',
  
  // Grid utilities
  gridAuto: 'grid grid-cols-1 gap-4',
  gridResponsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
} as const;

// Mobile performance hooks
export const useMobileOptimization = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobileDevice(window.innerWidth < 768);
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return { isMobileDevice, isTouchDevice };
};

// Mobile-specific component props
export interface MobileOptimizedProps {
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
  isMobile?: boolean;
  isTouch?: boolean;
}

// Mobile optimization wrapper
export const withMobileOptimization = <P extends object>(
  Component: React.ComponentType<P & MobileOptimizedProps>
) => {
  return (props: P & MobileOptimizedProps) => {
    const { isMobileDevice, isTouchDevice } = useMobileOptimization();
    
    const optimizedProps = {
      ...props,
      isMobile: isMobileDevice,
      isTouch: isTouchDevice,
      className: `${props.className || ''} ${props.mobileClassName || ''} md:${props.desktopClassName || ''}`,
    };
    
    return <Component {...optimizedProps} />;
  };
};

export default {
  MOBILE_BREAKPOINTS,
  TOUCH_TARGETS,
  MOBILE_CLASSES,
  isMobile,
  isTouchDevice,
  getResponsiveClass,
  getOptimizedImageUrl,
  optimizeForMobile,
  mobileAccessibility,
  mobileForms,
  mobileNavigation,
  mobileLayout,
  useMobileOptimization,
  withMobileOptimization,
};
