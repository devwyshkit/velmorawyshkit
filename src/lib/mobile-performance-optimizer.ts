/**
 * Mobile Performance Optimizer - Critical Web Vitals Enhancement
 * Implements global e-commerce performance standards for mobile devices
 */

export class MobilePerformanceOptimizer {
  private static instance: MobilePerformanceOptimizer;
  private observer: IntersectionObserver | null = null;
  private performanceEntries: PerformanceEntry[] = [];

  static getInstance(): MobilePerformanceOptimizer {
    if (!this.instance) {
      this.instance = new MobilePerformanceOptimizer();
    }
    return this.instance;
  }

  /**
   * Initialize performance optimization for mobile devices
   * Target: LCP < 1.2s, FID < 50ms, CLS < 0.05
   */
  initialize() {
    this.optimizeImages();
    this.optimizeScrolling();
    this.preloadCriticalResources();
    this.monitorWebVitals();
    this.enableLazyLoading();
  }

  /**
   * Optimize images for mobile performance
   */
  private optimizeImages() {
    const images = document.querySelectorAll('img[data-optimize]');
    
    images.forEach((img) => {
      const htmlImg = img as HTMLImageElement;
      
      // Add intersection observer for lazy loading
      if (this.observer) {
        this.observer.observe(htmlImg);
      }
      
      // Optimize loading attributes
      htmlImg.loading = 'lazy';
      htmlImg.decoding = 'async';
      
      // Add error fallback
      htmlImg.onerror = () => {
        htmlImg.src = '/placeholder.svg';
      };
    });
  }

  /**
   * Optimize scrolling performance for mobile
   */
  private optimizeScrolling() {
    // Add passive event listeners for better scroll performance
    const scrollContainers = document.querySelectorAll('[data-horizontal-scroll]');
    
    scrollContainers.forEach((container) => {
      container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
      
      // Enable hardware acceleration
      (container as HTMLElement).style.transform = 'translateZ(0)';
      (container as HTMLElement).style.willChange = 'scroll-position';
    });
  }

  /**
   * Preload critical resources for faster initial paint
   * Note: Removed preload logic to eliminate browser warnings for unused resources
   */
  private preloadCriticalResources() {
    // Preload logic removed to prevent browser warnings
    // Resources are loaded naturally when needed
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorWebVitals() {
    // Monitor Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          const lcp = entry.startTime;
          if (lcp > 1200) {
            console.warn(`LCP exceeded target: ${lcp}ms > 1200ms`);
          }
        }
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // Monitor Cumulative Layout Shift (CLS)
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      entryList.getEntries().forEach((entry) => {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      if (clsValue > 0.05) {
        console.warn(`CLS exceeded target: ${clsValue} > 0.05`);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }

  /**
   * Enable advanced lazy loading for product cards and images
   */
  private enableLazyLoading() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            
            // Add fade-in animation
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            
            img.onload = () => {
              img.style.opacity = '1';
            };
            
            this.observer!.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );
  }

  /**
   * Handle touch events for smooth scrolling
   */
  private handleTouchStart(event: TouchEvent) {
    const container = event.currentTarget as HTMLElement;
    container.dataset.touchStartX = event.touches[0].clientX.toString();
  }

  /**
   * Handle touch move for momentum scrolling
   */
  private handleTouchMove(event: TouchEvent) {
    const container = event.currentTarget as HTMLElement;
    const touchStartX = parseFloat(container.dataset.touchStartX || '0');
    const touchCurrentX = event.touches[0].clientX;
    const touchDiff = touchStartX - touchCurrentX;
    
    container.scrollLeft += touchDiff;
    container.dataset.touchStartX = touchCurrentX.toString();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export singleton instance
export const mobilePerformanceOptimizer = MobilePerformanceOptimizer.getInstance();