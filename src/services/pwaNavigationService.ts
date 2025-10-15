import { NavigateFunction } from 'react-router-dom';

/**
 * PWA Navigation Service - Optimized for mobile-first experience
 * Replaces all window.location.href usage with proper React Router navigation
 */

export class PWANavigationService {
  private navigate: NavigateFunction | null = null;

  setNavigate(navigateFunction: NavigateFunction) {
    this.navigate = navigateFunction;
  }

  // Product navigation
  navigateToProduct(productId: string) {
    if (this.navigate) {
      this.navigate(`/product/${productId}`);
    }
  }

  // Search navigation
  navigateToSearch(params?: { occasion?: string; category?: string; query?: string }) {
    if (this.navigate) {
      const searchParams = new URLSearchParams();
      if (params?.occasion) searchParams.set('occasion', params.occasion);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.query) searchParams.set('q', params.query);
      
      const searchString = searchParams.toString();
      this.navigate(`/search${searchString ? `?${searchString}` : ''}`);
    }
  }

  // Order navigation
  navigateToOrders() {
    if (this.navigate) {
      this.navigate('/orders');
    }
  }

  // Home navigation
  navigateToHome() {
    if (this.navigate) {
      this.navigate('/');
    }
  }

  // General navigation
  navigateTo(path: string) {
    if (this.navigate) {
      this.navigate(path);
    }
  }

  // Vendor navigation
  navigateToVendor(vendorId: string) {
    if (this.navigate) {
      this.navigate(`/vendor/${vendorId}`);
    }
  }

  // Settings navigation
  navigateToSettings() {
    if (this.navigate) {
      this.navigate('/settings');
    }
  }

  // Help navigation
  navigateToHelp() {
    if (this.navigate) {
      this.navigate('/help');
    }
  }
}

export const pwaNavigationService = new PWANavigationService();