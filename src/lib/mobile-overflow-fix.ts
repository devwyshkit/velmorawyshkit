// Mobile Overflow & Bleeding Prevention - Production Standards
// Research-based fixes for mobile e-commerce apps

export class MobileOverflowFix {
  // Apply global overflow constraints
  static applyGlobalConstraints() {
    // Viewport meta tag enforcement
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    // Global CSS for mobile containment
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile Container Fixes */
      html {
        overflow-x: hidden;
        -webkit-text-size-adjust: 100%;
      }
      
      body {
        overflow-x: hidden;
        position: relative;
        max-width: 100vw;
      }
      
      * {
        box-sizing: border-box;
      }
      
      /* Prevent horizontal scrolling on mobile */
      .mobile-container-fix {
        max-width: 100vw;
        overflow-x: hidden;
        position: relative;
      }
      
      /* Fix for horizontal scroll bleeding */
      .horizontal-scroll-container {
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
        scroll-behavior: smooth;
        scroll-snap-type: x mandatory;
      }
      
      .horizontal-scroll-container::-webkit-scrollbar {
        display: none;
      }
      
      /* Card container fixes */
      .product-card-container {
        min-width: 0;
        flex-shrink: 0;
        scroll-snap-align: start;
        padding: 0.25rem;
      }
      
      /* Text overflow prevention */
      .text-overflow-fix {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }
      
      .text-overflow-multiline {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-wrap: break-word;
        hyphens: auto;
      }
      
      /* Image overflow fixes */
      .image-container-fix {
        overflow: hidden;
        position: relative;
      }
      
      .image-container-fix img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }
      
      /* Grid overflow prevention */
      .grid-container-fix {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
        padding: 0.5rem;
        overflow: hidden;
      }
      
      /* Mobile-first responsive utilities */
      @media (max-width: 640px) {
        .mobile-padding {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        
        .mobile-gap {
          gap: 0.75rem;
        }
        
        .mobile-text-sm {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
      }
      
      /* PWA specific fixes */
      @media (display-mode: standalone) {
        body {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        
        input, textarea {
          user-select: text;
          -webkit-user-select: text;
        }
      }
    `;
    
    if (!document.head.querySelector('#mobile-overflow-fix')) {
      style.id = 'mobile-overflow-fix';
      document.head.appendChild(style);
    }
  }

  // Fix specific element overflow
  static fixElementOverflow(element: HTMLElement, options: {
    horizontal?: boolean;
    vertical?: boolean;
    textClamp?: number;
    imageContain?: boolean;
  } = {}) {
    const { horizontal = true, vertical = false, textClamp, imageContain = false } = options;

    if (horizontal) {
      element.style.overflowX = 'hidden';
      element.style.maxWidth = '100%';
    }

    if (vertical) {
      element.style.overflowY = 'hidden';
    }

    if (textClamp) {
      element.style.display = '-webkit-box';
      element.style.webkitLineClamp = textClamp.toString();
      element.style.webkitBoxOrient = 'vertical';
      element.style.overflow = 'hidden';
    }

    if (imageContain) {
      const images = element.querySelectorAll('img');
      images.forEach(img => {
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'center';
      });
    }
  }

  // Product card specific fixes
  static fixProductCards() {
    const productCards = document.querySelectorAll('[data-product-card]');
    
    productCards.forEach(card => {
      const element = card as HTMLElement;
      
      // Container constraints
      element.style.minWidth = '0';
      element.style.flexShrink = '0';
      element.style.overflow = 'hidden';
      
      // Text elements
      const textElements = element.querySelectorAll('h3, p, span');
      textElements.forEach(text => {
        const textEl = text as HTMLElement;
        textEl.style.minWidth = '0';
        textEl.style.wordWrap = 'break-word';
        textEl.style.hyphens = 'auto';
      });
      
      // Price elements
      const priceElements = element.querySelectorAll('[data-price]');
      priceElements.forEach(price => {
        const priceEl = price as HTMLElement;
        priceEl.style.whiteSpace = 'nowrap';
        priceEl.style.overflow = 'hidden';
        priceEl.style.textOverflow = 'ellipsis';
      });
      
      // Image containers
      const imageContainers = element.querySelectorAll('[data-image-container]');
      imageContainers.forEach(container => {
        const containerEl = container as HTMLElement;
        containerEl.style.overflow = 'hidden';
        containerEl.style.position = 'relative';
        
        const img = containerEl.querySelector('img');
        if (img) {
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
        }
      });
    });
  }

  // Horizontal scroll container fixes
  static fixHorizontalScroll(container: HTMLElement) {
    container.style.overflowX = 'auto';
    container.style.overflowY = 'hidden';
    container.style.scrollBehavior = 'smooth';
    container.style.scrollSnapType = 'x mandatory';
    (container.style as any).webkitOverflowScrolling = 'touch';
    
    // Hide scrollbars
    container.style.scrollbarWidth = 'none';
    (container.style as any).msOverflowStyle = 'none';
    
    const children = Array.from(container.children) as HTMLElement[];
    children.forEach(child => {
      child.style.flexShrink = '0';
      child.style.scrollSnapAlign = 'start';
    });
  }

  // Initialize all fixes
  static initialize() {
    // Apply global constraints immediately
    this.applyGlobalConstraints();
    
    // Fix existing elements
    this.fixProductCards();
    
    // Fix horizontal scroll containers
    document.querySelectorAll('.horizontal-scroll').forEach(container => {
      this.fixHorizontalScroll(container as HTMLElement);
    });
    
    // Set up mutation observer for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Fix newly added product cards
            if (element.dataset.productCard !== undefined) {
              this.fixElementOverflow(element, { horizontal: true, imageContain: true });
            }
            
            // Fix newly added horizontal scrolls
            if (element.classList.contains('horizontal-scroll')) {
              this.fixHorizontalScroll(element);
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return observer;
  }
}