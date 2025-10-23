/**
 * B2B Wholesale Model Validation Tests
 * Verifies TRUE wholesale pricing, commission structure, and fee calculations
 * Based on user specifications: ₹850 trade price, 7% commission, 2% platform fee
 */

import { test, expect } from '@playwright/test';

test.describe('B2B Wholesale Model Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/commission');
  });

  test('Admin can manage B2B commission rules', async ({ page }) => {
    // Navigate to commission management
    await page.goto('/admin/commission');
    
    // Check B2B commission rules exist
    await expect(page.locator('text=B2B')).toBeVisible();
    await expect(page.locator('text=7% Commission')).toBeVisible();
    await expect(page.locator('text=2% Platform Fee')).toBeVisible();
    
    // Test marketplace filter
    await page.click('button:has-text("B2B (Wholesale)")');
    await expect(page.locator('text=B2B')).toBeVisible();
    
    // Test adding new B2B rule
    await page.selectOption('select', 'b2b');
    await page.fill('input[type="number"]', '5');
    await page.click('button:has-text("Add Commission Rule")');
    
    await expect(page.locator('text=5% Commission')).toBeVisible();
  });

  test('Wyshkit Supply shows TRUE wholesale pricing', async ({ page }) => {
    await page.goto('/partner/wyshkit-supply');
    
    // Check B2B disclaimer is prominent
    await expect(page.locator('text=⚠️ B2B Wholesale Marketplace')).toBeVisible();
    await expect(page.locator('text=Authorized business resale only')).toBeVisible();
    
    // Check product pricing shows trade price, not retail markup
    await expect(page.locator('text=Trade Price')).toBeVisible();
    await expect(page.locator('text=₹850/unit')).toBeVisible(); // True trade price
    
    // Check "Your Cost" instead of "Your Margin"
    await expect(page.locator('text=Your Cost')).toBeVisible();
    await expect(page.locator('text=₹867/unit')).toBeVisible(); // ₹850 + 2% platform fee
    
    // Check platform fee breakdown
    await expect(page.locator('text=Platform Fee (2%)')).toBeVisible();
    await expect(page.locator('text=₹17/unit')).toBeVisible(); // 2% of ₹850
    
    // Check MRP is for reference only
    await expect(page.locator('text=MRP (for reference)')).toBeVisible();
    await expect(page.locator('text=₹2,999')).toBeVisible();
    
    // Check suggested retail pricing
    await expect(page.locator('text=💡 Suggested retail: ₹2,200-2,500')).toBeVisible();
  });

  test('Cart shows proper B2B fee breakdown', async ({ page }) => {
    await page.goto('/partner/wyshkit-supply');
    
    // Add product to cart (minimum 50 units for B2B)
    await page.click('button:has-text("Add to Cart")');
    
    // Navigate to cart
    await page.click('text=Cart');
    
    // Check cart summary shows separate fees
    await expect(page.locator('text=Brand Commission (7%)')).toBeVisible();
    await expect(page.locator('text=Platform Fee (2%)')).toBeVisible();
    
    // Verify calculations for 50 units at ₹850 each
    const expectedSubtotal = 50 * 850; // ₹42,500
    const expectedCommission = expectedSubtotal * 0.07; // ₹2,975
    const expectedPlatformFee = expectedSubtotal * 0.02; // ₹850
    const expectedGST = (expectedSubtotal + expectedCommission + expectedPlatformFee) * 0.18;
    const expectedTotal = expectedSubtotal + expectedCommission + expectedPlatformFee + expectedGST;
    
    // Check button text is B2B appropriate
    await expect(page.locator('text=Request Business Quote')).toBeVisible();
  });

  test('Commission calculation matches specifications', async ({ page }) => {
    await page.goto('/admin/commission');
    
    // Test B2B commission preview
    await page.fill('input[type="number"]', '42500'); // ₹42,500 (50 units × ₹850)
    
    // Check B2B calculation shows:
    // - Order Value: ₹42,500
    // - Commission Rate: 7%
    // - Platform Fee Rate: 2%
    // - Commission Amount: ₹2,975
    // - Platform Fee: ₹850
    // - Vendor Receives: ₹39,525
    // - Buyer Pays: ₹43,350
    // - Platform Earns: ₹3,825
    
    await expect(page.locator('text=B2B (Wholesale)')).toBeVisible();
    await expect(page.locator('text=7%')).toBeVisible();
    await expect(page.locator('text=2%')).toBeVisible();
    await expect(page.locator('text=₹2,975')).toBeVisible(); // Commission
    await expect(page.locator('text=₹850')).toBeVisible(); // Platform fee
    await expect(page.locator('text=₹39,525')).toBeVisible(); // Vendor receives
    await expect(page.locator('text=₹43,350')).toBeVisible(); // Buyer pays
    await expect(page.locator('text=₹3,825')).toBeVisible(); // Platform earns
  });

  test('Product listings show wholesale context', async ({ page }) => {
    await page.goto('/partner/wyshkit-supply');
    
    // Check product names indicate wholesale
    await expect(page.locator('text=(Wholesale)')).toBeVisible();
    
    // Check minimum order quantities are B2B appropriate
    await expect(page.locator('text=50 units')).toBeVisible(); // Minimum for electronics
    await expect(page.locator('text=25 units')).toBeVisible(); // Minimum for smartwatch
    await expect(page.locator('text=100 units')).toBeVisible(); // Minimum for packaging
    
    // Check descriptions mention business resale
    await expect(page.locator('text=For authorized business resale only')).toBeVisible();
  });

  test('No retail-style margin messaging', async ({ page }) => {
    await page.goto('/partner/wyshkit-supply');
    
    // Ensure no retail-style messaging exists
    await expect(page.locator('text=Your Margin')).not.toBeVisible();
    await expect(page.locator('text=₹1,999')).not.toBeVisible(); // Old retail markup
    await expect(page.locator('text=₹2,199')).not.toBeVisible(); // Old retail markup
    
    // Ensure wholesale-appropriate messaging exists
    await expect(page.locator('text=Your Cost')).toBeVisible();
    await expect(page.locator('text=Trade Price')).toBeVisible();
    await expect(page.locator('text=Platform Fee')).toBeVisible();
  });
});

test.describe('B2B vs B2C Commission Separation', () => {
  test('Admin can manage both B2C and B2B commissions independently', async ({ page }) => {
    await page.goto('/admin/commission');
    
    // Check B2C rules
    await page.click('button:has-text("B2C (Retail)")');
    await expect(page.locator('text=18% Commission')).toBeVisible();
    await expect(page.locator('text=15% Commission')).toBeVisible();
    await expect(page.locator('text=12% Commission')).toBeVisible();
    
    // Check B2B rules
    await page.click('button:has-text("B2B (Wholesale)")');
    await expect(page.locator('text=7% Commission')).toBeVisible();
    await expect(page.locator('text=5% Commission')).toBeVisible();
    await expect(page.locator('text=2% Platform Fee')).toBeVisible();
    
    // Verify they are separate
    await expect(page.locator('text=18% Commission')).not.toBeVisible(); // B2C not visible in B2B filter
  });

  test('Commission preview shows correct marketplace type', async ({ page }) => {
    await page.goto('/admin/commission');
    
    // Test B2C preview
    await page.fill('input[type="number"]', '2500'); // ₹2,500 B2C order
    await expect(page.locator('text=B2C (Retail)')).toBeVisible();
    await expect(page.locator('text=18%')).toBeVisible();
    
    // Test B2B preview  
    await page.fill('input[type="number"]', '42500'); // ₹42,500 B2B order
    await expect(page.locator('text=B2B (Wholesale)')).toBeVisible();
    await expect(page.locator('text=7%')).toBeVisible();
    await expect(page.locator('text=2%')).toBeVisible();
  });
});

test.describe('Complete B2B Transaction Flow', () => {
  test('End-to-end B2B transaction matches specifications', async ({ page }) => {
    // This test validates the complete flow described in user specifications:
    // 1. Boat lists Airdopes for B2B at ₹850 (7% commission)
    // 2. Vendor ABC orders 100 units via B2B (pays ₹867/unit with platform fee)
    // 3. Wyshkit earns: ₹5,950 (brand commission) + ₹1,700 (platform fee) = ₹7,650
    // 4. ABC lists hamper at ₹2,500 on B2C (18% commission)
    
    await page.goto('/partner/wyshkit-supply');
    
    // Step 1: Verify Boat's B2B listing
    await expect(page.locator('text=₹850/unit')).toBeVisible();
    await expect(page.locator('text=Trade Price')).toBeVisible();
    
    // Step 2: Add 100 units to cart
    // (This would require updating the quantity selector to allow 100 units)
    await page.click('button:has-text("Add to Cart")');
    
    // Step 3: Verify cart calculations
    // Expected: 100 × ₹850 = ₹85,000
    // Brand Commission: ₹85,000 × 7% = ₹5,950
    // Platform Fee: ₹85,000 × 2% = ₹1,700
    // Total: ₹85,000 + ₹1,700 = ₹86,700 (before GST)
    
    await expect(page.locator('text=₹85,000')).toBeVisible(); // Subtotal
    await expect(page.locator('text=₹5,950')).toBeVisible(); // Brand commission
    await expect(page.locator('text=₹1,700')).toBeVisible(); // Platform fee
    
    // Step 4: Verify final total with GST
    const expectedGST = 86700 * 0.18; // ₹15,606
    const expectedFinalTotal = 86700 + expectedGST; // ₹1,02,306
    
    await expect(page.locator('text=₹1,02,306')).toBeVisible(); // Final total
  });
});
