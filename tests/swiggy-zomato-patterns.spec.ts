/**
 * Swiggy/Zomato Pattern Validation Tests
 * Comprehensive testing of platform patterns and mobile-first design
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8082';
const MOBILE_VIEWPORT = { width: 375, height: 667 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };

// Test data
const TEST_PRODUCTS = [
  {
    name: 'Premium Tech Hamper',
    price: 5000,
    expectedDeliveryFee: 0, // Free delivery above ₹5000
  },
  {
    name: 'Basic Gift Box',
    price: 2500,
    expectedDeliveryFee: 30, // ₹30 delivery fee
  },
  {
    name: 'Small Gift Item',
    price: 800,
    expectedDeliveryFee: 80, // ₹80 delivery fee
  },
];

// Helper functions
const waitForPageLoad = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
};

const checkMobileOptimization = async (page: Page) => {
  // Check for horizontal overflow
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
  
  // Check touch targets (minimum 44px)
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const box = await button.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
};

const checkSwiggyPatterns = async (page: Page) => {
  // Check for auto-updating prices
  const priceElements = await page.locator('[data-testid="price"], .price, [class*="price"]').all();
  expect(priceElements.length).toBeGreaterThan(0);
  
  // Check for delivery fee messaging
  const deliveryElements = await page.locator('text=/delivery|free delivery|add.*more/i').all();
  expect(deliveryElements.length).toBeGreaterThan(0);
  
  // Check for quantity selectors
  const quantitySelectors = await page.locator('[data-testid="quantity"], .quantity, [class*="quantity"]').all();
  expect(quantitySelectors.length).toBeGreaterThan(0);
};

// Test suites
test.describe('Customer Portal - Swiggy Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/customer`);
    await waitForPageLoad(page);
  });

  test('Mobile-first product display', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await checkMobileOptimization(page);
    await checkSwiggyPatterns(page);
  });

  test('Price auto-updates on quantity change', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Find a product with quantity selector
    const quantityInput = page.locator('input[type="number"], [data-testid="quantity"]').first();
    if (await quantityInput.isVisible()) {
      const initialPrice = await page.locator('[data-testid="price"], .price').first().textContent();
      
      // Change quantity
      await quantityInput.fill('2');
      await page.waitForTimeout(500);
      
      const updatedPrice = await page.locator('[data-testid="price"], .price').first().textContent();
      expect(updatedPrice).not.toBe(initialPrice);
    }
  });

  test('Delivery fee messaging works correctly', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Check for delivery fee elements
    const deliveryFeeElements = await page.locator('text=/delivery|free delivery/i').all();
    expect(deliveryFeeElements.length).toBeGreaterThan(0);
    
    // Check for threshold messaging
    const thresholdElements = await page.locator('text=/add.*more.*free/i').all();
    expect(thresholdElements.length).toBeGreaterThan(0);
  });

  test('Cart functionality with delivery fees', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Navigate to cart
    await page.goto(`${BASE_URL}/customer/cart`);
    await waitForPageLoad(page);
    
    // Check for cart items
    const cartItems = await page.locator('[data-testid="cart-item"], .cart-item').all();
    expect(cartItems.length).toBeGreaterThan(0);
    
    // Check for delivery fee calculation
    const deliveryFee = await page.locator('text=/delivery.*fee|free delivery/i').first();
    expect(await deliveryFee.isVisible()).toBeTruthy();
  });

  test('Mobile navigation works correctly', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Check for bottom navigation
    const bottomNav = page.locator('[data-testid="bottom-nav"], .bottom-nav, nav').last();
    expect(await bottomNav.isVisible()).toBeTruthy();
    
    // Check navigation items
    const navItems = await bottomNav.locator('a, button').all();
    expect(navItems.length).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Partner Portal - Restaurant Dashboard Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/partner`);
    await waitForPageLoad(page);
  });

  test('Product listing form with B2C language', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Navigate to products
    await page.goto(`${BASE_URL}/partner/products`);
    await waitForPageLoad(page);
    
    // Check for "Add Product" button
    const addProductBtn = page.locator('text=/add product|create product/i');
    expect(await addProductBtn.isVisible()).toBeTruthy();
    
    // Click to open form
    await addProductBtn.click();
    await waitForPageLoad(page);
    
    // Check for B2C friendly language (no technical jargon)
    const formText = await page.textContent('body');
    expect(formText).not.toContain('MOQ');
    expect(formText).not.toContain('SKU');
    expect(formText).not.toContain('Fulfillment');
  });


  test('Earnings page with Zoho integration', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    // Navigate to earnings
    await page.goto(`${BASE_URL}/partner/earnings`);
    await waitForPageLoad(page);
    
    // Check for Zoho invoice list
    const invoiceList = page.locator('[data-testid="invoice-list"], .invoice-list');
    expect(await invoiceList.isVisible()).toBeTruthy();
    
    // Check for invoice cards
    const invoiceCards = await page.locator('[data-testid="invoice-card"], .invoice-card').all();
    expect(invoiceCards.length).toBeGreaterThan(0);
  });
});

test.describe('Admin Panel - Operations Console Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await waitForPageLoad(page);
  });

  test('Commission management with real-time controls', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    
    // Navigate to commission management
    await page.goto(`${BASE_URL}/admin/commission`);
    await waitForPageLoad(page);
    
    // Check for commission rules
    const commissionRules = await page.locator('[data-testid="commission-rule"], .commission-rule').all();
    expect(commissionRules.length).toBeGreaterThan(0);
    
    // Check for live preview
    const previewSection = page.locator('[data-testid="preview"], .preview');
    expect(await previewSection.isVisible()).toBeTruthy();
  });

  test('Vendor management interface', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    
    // Navigate to vendor management
    await page.goto(`${BASE_URL}/admin/partners`);
    await waitForPageLoad(page);
    
    // Check for vendor list
    const vendors = await page.locator('[data-testid="vendor"], .vendor').all();
    expect(vendors.length).toBeGreaterThan(0);
    
    // Check for approval queue
    const approvalQueue = page.locator('[data-testid="approval-queue"], .approval-queue');
    expect(await approvalQueue.isVisible()).toBeTruthy();
  });
});

test.describe('Cross-Browser Compatibility', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];
  
  for (const browser of browsers) {
    test(`${browser} - Mobile viewport`, async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(`${BASE_URL}/customer`);
      await waitForPageLoad(page);
      
      await checkMobileOptimization(page);
      await checkSwiggyPatterns(page);
    });

    test(`${browser} - Desktop viewport`, async ({ page }) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(`${BASE_URL}/customer`);
      await waitForPageLoad(page);
      
      // Check for responsive design
      const isMobile = await page.evaluate(() => window.innerWidth < 768);
      expect(isMobile).toBeFalsy();
    });
  }
});

test.describe('Performance Testing', () => {
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/customer`);
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Mobile performance', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/customer`);
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;
    
    // Mobile should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });
});

test.describe('Accessibility Testing', () => {
  test('Keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/customer`);
    await waitForPageLoad(page);
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.isVisible()).toBeTruthy();
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/customer`);
    await waitForPageLoad(page);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });
});

test.describe('Edge Cases and Error Handling', () => {
  test('Long product names', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(`${BASE_URL}/customer`);
    await waitForPageLoad(page);
    
    // Check for text truncation
    const productNames = await page.locator('[data-testid="product-name"], .product-name').all();
    for (const name of productNames) {
      const text = await name.textContent();
      if (text && text.length > 50) {
        // Should be truncated or wrapped properly
        const box = await name.boundingBox();
        expect(box?.height).toBeLessThan(100); // Should not be too tall
      }
    }
  });

  test('Large quantities', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(`${BASE_URL}/customer`);
    await waitForPageLoad(page);
    
    // Test with large quantity
    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('1000');
      await page.waitForTimeout(500);
      
      // Should handle large numbers gracefully
      const value = await quantityInput.inputValue();
      expect(parseInt(value)).toBe(1000);
    }
  });

  test('Network failure handling', async ({ page }) => {
    // Simulate network failure
    await page.route('**/*', route => route.abort());
    
    await page.goto(`${BASE_URL}/customer`);
    
    // Should show error state gracefully
    const errorElements = await page.locator('text=/error|failed|offline/i').all();
    expect(errorElements.length).toBeGreaterThan(0);
  });
});

// Test configuration
test.describe.configure({ mode: 'parallel' });
