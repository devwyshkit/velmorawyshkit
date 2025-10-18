/**
 * Credential Testing Suite - Playwright
 * 
 * Tests login credentials across all three interfaces:
 * - Customer
 * - Partner
 * - Admin
 * 
 * Run: npx playwright test tests/credentials.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

// Test credentials
const CREDENTIALS = {
  customer: {
    email: 'customer@wyshkit.com',
    password: 'customer123',
  },
  partner: {
    email: 'partner@wyshkit.com',
    password: 'partner123',
  },
  admin: {
    email: 'admin@wyshkit.com',
    password: 'admin123',
  },
};

test.describe('Customer Interface', () => {
  test('should navigate to customer login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/customer/login`);
    await expect(page).toHaveTitle(/Wyshkit/i);
    await expect(page.locator('text=Customer Login')).toBeVisible();
  });

  test('should login with customer credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/customer/login`);

    // Fill login form
    await page.fill('input[type="email"]', CREDENTIALS.customer.email);
    await page.fill('input[type="password"]', CREDENTIALS.customer.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/customer\/home/, { timeout: 5000 });

    // Verify logged in
    expect(page.url()).toContain('/customer/home');

    // Check no errors
    const errors = await page.locator('.text-red-500, .text-destructive').count();
    expect(errors).toBe(0);
  });

  test('should display customer home page after login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/customer/login`);
    await page.fill('input[type="email"]', CREDENTIALS.customer.email);
    await page.fill('input[type="password"]', CREDENTIALS.customer.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/customer\/home/);

    // Check home page elements
    await expect(page.locator('text=Bangalore')).toBeVisible(); // Location
    await expect(page.locator('img[alt*="Wyshkit"]')).toBeVisible(); // Logo
  });

  test('should navigate to cart', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/customer/login`);
    await page.fill('input[type="email"]', CREDENTIALS.customer.email);
    await page.fill('input[type="password"]', CREDENTIALS.customer.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/customer\/home/);

    // Navigate to cart
    await page.goto(`${BASE_URL}/customer/cart`);
    await expect(page.locator('text=Cart')).toBeVisible();
  });
});

test.describe('Partner Interface', () => {
  test('should navigate to partner login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/partner/login`);
    await expect(page.locator('text=Partner Login')).toBeVisible();
    await expect(page.locator('img[alt="Wyshkit"]')).toBeVisible(); // Business logo
  });

  test('should login with partner credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/partner/login`);

    // Fill login form
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation (should go to dashboard)
    await page.waitForURL(/\/partner\/dashboard/, { timeout: 5000 });

    // Verify logged in
    expect(page.url()).toContain('/partner/dashboard');
  });

  test('should display partner dashboard after login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    // Check dashboard elements
    await expect(page.locator('img[alt="Wyshkit"]')).toBeVisible(); // Business logo
    await expect(page.locator('text=Partner').or(page.locator('text=partner'))).toBeVisible(); // Partner badge
  });

  test('should access partner catalog page', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    // Navigate to catalog
    await page.goto(`${BASE_URL}/partner/catalog`);

    // Check catalog page loaded
    await expect(page.locator('text=Catalog Manager').or(page.locator('text=Catalog'))).toBeVisible();
  });

  test('should verify operating hours toggle exists', async ({ page }) => {
    // Login and go to home
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    // Check for operating hours toggle (Swiggy feature)
    const toggleExists = await page.locator('button[role="switch"]').count() > 0;
    expect(toggleExists).toBeTruthy();
  });

  test('should access orders page', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    // Navigate to orders
    await page.goto(`${BASE_URL}/partner/orders`);
    await expect(page.locator('text=Orders')).toBeVisible();
  });

  test('should access earnings page with tabs', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    // Navigate to earnings
    await page.goto(`${BASE_URL}/partner/earnings`);
    
    // Check tabs exist (Zomato pattern)
    await expect(page.locator('text=Today').or(page.locator('[role="tab"]'))).toBeVisible();
  });

  test('should access profile page', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    // Navigate to profile
    await page.goto(`${BASE_URL}/partner/profile`);
    await expect(page.locator('text=Profile').or(page.locator('text=Business'))).toBeVisible();
  });
});

test.describe('Admin Interface', () => {
  test('should login with admin credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/partner/login`); // Admin uses partner login

    // Fill login form
    await page.fill('input[type="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', CREDENTIALS.admin.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation (should go to admin overview)
    await page.waitForURL(/\/admin\/overview/, { timeout: 5000 });

    // Verify logged in to admin
    expect(page.url()).toContain('/admin/overview');
  });

  test('should display admin overview after login', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/overview/);

    // Check admin header
    await expect(page.locator('text=Admin')).toBeVisible(); // Admin badge
    await expect(page.locator('img[alt="Wyshkit"]')).toBeVisible(); // Main logo (not business)
  });

  test('should access partner approvals page', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/overview/);

    // Navigate to partner approvals
    await page.goto(`${BASE_URL}/admin/partners`);
    await expect(page.locator('text=Partner').and(page.locator('text=Approval'))).toBeVisible();
  });

  test('should access admin orders page', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/overview/);

    // Navigate to orders
    await page.goto(`${BASE_URL}/admin/orders`);
    await expect(page.locator('text=Orders')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should reject invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/customer/login`);

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error (not navigate away)
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('should redirect unauthenticated users', async ({ page }) => {
    // Try to access protected partner dashboard without login
    await page.goto(`${BASE_URL}/partner/dashboard`);

    // Should redirect to login
    await page.waitForURL(/\/partner\/login/, { timeout: 3000 });
    expect(page.url()).toContain('/partner/login');
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login as partner
    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    expect(page.url()).toContain('/partner/dashboard');
  });
});

test.describe('Console Errors', () => {
  test('customer pages should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/customer/login`);
    await page.fill('input[type="email"]', CREDENTIALS.customer.email);
    await page.fill('input[type="password"]', CREDENTIALS.customer.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/customer\/home/);

    // Wait a bit for any delayed errors
    await page.waitForTimeout(2000);

    // Filter out known benign errors (HMR, etc.)
    const criticalErrors = errors.filter(
      (err) => !err.includes('HMR') && !err.includes('[vite]')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('partner pages should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.partner.email);
    await page.fill('input[type="password"]', CREDENTIALS.partner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/partner\/dashboard/);

    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (err) => !err.includes('HMR') && !err.includes('[vite]')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('admin pages should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/partner/login`);
    await page.fill('input[type="email"]', CREDENTIALS.admin.email);
    await page.fill('input[type="password"]', CREDENTIALS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin\/overview/);

    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (err) => !err.includes('HMR') && !err.includes('[vite]')
    );

    expect(criticalErrors.length).toBe(0);
  });
});

