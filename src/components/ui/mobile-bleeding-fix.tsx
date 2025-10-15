import { useEffect } from 'react';

// Mobile Bleeding Prevention Component - Phase 15 Implementation
// Addresses product card bleeding, text overflow, and container constraints

interface MobileBleedingFixProps {
  children: React.ReactNode;
}

export const MobileBleedingFix = ({ children }: MobileBleedingFixProps) => {
  useEffect(() => {
    // Apply global mobile constraints
    const applyMobileConstraints = () => {
      // Viewport meta tag enforcement
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');

      // Global mobile styles
      const mobileStyles = document.createElement('style');
      mobileStyles.innerHTML = `
        /* Mobile Container Constraints */
        html, body {
          overflow-x: hidden !important;
          max-width: 100vw !important;
          box-sizing: border-box;
        }
        
        *, *::before, *::after {
          box-sizing: border-box;
        }
        
        /* Product Card Mobile Fixes */
        [data-product-card] {
          min-width: 280px !important;
          max-width: 320px !important;
          flex-shrink: 0 !important;
          overflow: hidden !important;
        }
        
        [data-product-card] .truncate {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          max-width: 100% !important;
        }
        
        [data-product-card] img {
          max-width: 100% !important;
          height: auto !important;
          object-fit: cover !important;
        }
        
        /* Horizontal Scroll Fixes */
        .horizontal-scroll {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        .horizontal-scroll::-webkit-scrollbar {
          display: none !important;
        }
        
        /* Business Table Mobile Fixes */
        .business-table {
          overflow-x: auto !important;
          min-width: 100% !important;
        }
        
        .business-table table {
          min-width: 600px !important;
          width: 100% !important;
        }
        
        /* Chart Container Mobile Fixes */
        .chart-container {
          overflow: hidden !important;
          max-width: 100% !important;
        }
        
        .chart-container svg {
          max-width: 100% !important;
          height: auto !important;
        }
        
        /* Modal Mobile Fixes */
        .modal-content {
          max-width: 95vw !important;
          max-height: 90vh !important;
          overflow-y: auto !important;
        }
        
        /* Form Input Mobile Fixes */
        input, select, textarea {
          font-size: 16px !important; /* Prevents zoom on iOS */
        }
        
        /* Navigation Mobile Fixes */
        .mobile-nav {
          width: 100% !important;
          overflow-x: auto !important;
        }
        
        /* Mobile-specific breakpoints */
        @media (max-width: 640px) {
          .grid-cols-2 > * {
            min-width: 0 !important;
            overflow: hidden !important;
          }
          
          .flex-1 {
            min-width: 0 !important;
          }
          
          .truncate {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
        }
      `;
      
      // Remove existing mobile styles to prevent conflicts
      const existingStyles = document.getElementById('mobile-bleeding-fix');
      if (existingStyles) {
        existingStyles.remove();
      }
      
      mobileStyles.id = 'mobile-bleeding-fix';
      document.head.appendChild(mobileStyles);
    };

    // Apply constraints immediately
    applyMobileConstraints();

    // Re-apply when DOM changes (for dynamic content)
    const observer = new MutationObserver(() => {
      applyMobileConstraints();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      const styles = document.getElementById('mobile-bleeding-fix');
      if (styles) {
        styles.remove();
      }
    };
  }, []);

  return <>{children}</>;
};

// Utility function to fix specific elements
export const fixElementBleeding = (element: HTMLElement) => {
  // Product card specific fixes
  if (element.hasAttribute('data-product-card')) {
    element.style.minWidth = '280px';
    element.style.maxWidth = '320px';
    element.style.flexShrink = '0';
    element.style.overflow = 'hidden';
  }
  
  // Text truncation fixes
  const textElements = element.querySelectorAll('.truncate');
  textElements.forEach(el => {
    const textEl = el as HTMLElement;
    textEl.style.overflow = 'hidden';
    textEl.style.textOverflow = 'ellipsis';
    textEl.style.whiteSpace = 'nowrap';
    textEl.style.maxWidth = '100%';
  });
  
  // Image container fixes
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'cover';
  });
};