import { lazy, type LazyExoticComponent } from 'react';
import type React from 'react';
import { logger } from '@/lib/logger';

// Error recovery wrapper for lazy loading
const withErrorRecovery = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> => {
  return lazy(() =>
    importFn().catch((error) => {
      logger.error('Failed to load module', error instanceof Error ? error : new Error(String(error)));
      // Return a fallback component
      return {
        default: (() => (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Failed to Load</h2>
              <p className="text-muted-foreground mb-4">
                Please refresh the page or clear your browser cache.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )) as T,
      };
    })
  );
};

// Lazy load customer pages for better performance
export const Login = withErrorRecovery(() => import('../pages/customer/Login').then(m => ({ default: m.CustomerMobileLogin })));
export const Signup = withErrorRecovery(() => import('../pages/customer/Signup').then(m => ({ default: m.CustomerMobileSignup })));
export const Home = withErrorRecovery(() => import('../pages/customer/CustomerHome').then(m => ({ default: m.CustomerHome })));
export const PartnerCatalog = withErrorRecovery(() => import('../pages/customer/PartnerCatalog').then(m => ({ default: m.PartnerCatalog })));
export const Track = withErrorRecovery(() => import('../pages/customer/Track').then(m => ({ default: m.Track })));
// PreviewApproval removed - functionality moved to inline bottom sheet in Track.tsx (Swiggy 2025 pattern)
// Profile removed - functionality moved to AccountSheet bottom sheet (Swiggy 2025 pattern)
// AddressBook and AddAddress removed - functionality moved to AddressBookSheet and AddAddressSheet (Swiggy 2025 pattern)
export const Search = withErrorRecovery(() => import('../pages/customer/Search').then(m => ({ default: m.CustomerMobileSearch })));
export const Orders = withErrorRecovery(() => import('../pages/customer/Orders').then(m => ({ default: m.Orders })));
export const HelpCenter = withErrorRecovery(() => import('../pages/customer/HelpCenter').then(m => ({ default: m.HelpCenter })));
export const Favorites = withErrorRecovery(() => import('../pages/customer/Favorites').then(m => ({ default: m.Favorites })));
export const OrderDetails = withErrorRecovery(() => import('../pages/customer/OrderDetails').then(m => ({ default: m.OrderDetails })));
export const OrderCancellation = withErrorRecovery(() => import('../pages/customer/OrderCancellation').then(m => ({ default: m.OrderCancellation })));
export const ReturnRequest = withErrorRecovery(() => import('../pages/customer/ReturnRequest').then(m => ({ default: m.ReturnRequest })));
export const PaymentMethods = withErrorRecovery(() => import('../pages/customer/PaymentMethods').then(m => ({ default: m.PaymentMethods })));
export const Settings = withErrorRecovery(() => import('../pages/customer/Settings').then(m => ({ default: m.Settings })));
export const SupportChat = withErrorRecovery(() => import('../pages/customer/SupportChat').then(m => ({ default: m.SupportChat })));
export const MyReviews = withErrorRecovery(() => import('../pages/customer/MyReviews').then(m => ({ default: m.MyReviews })));

// Partner Pages - Business Dashboard (Lazy loaded for code splitting)
export const PartnerLogin = withErrorRecovery(() => import('../pages/partner/Login').then(m => ({ default: m.PartnerLogin })));
export const PartnerSignup = withErrorRecovery(() => import('../pages/partner/Signup').then(m => ({ default: m.PartnerSignup })));
export const PartnerVerifyEmail = withErrorRecovery(() => import('../pages/partner/VerifyEmail').then(m => ({ default: m.PartnerVerifyEmail })));
export const PartnerOnboarding = withErrorRecovery(() => import('../pages/partner/Onboarding').then(m => ({ default: m.PartnerOnboarding })));
export const PartnerLayout = withErrorRecovery(() => import('../components/partner/PartnerLayout').then(m => ({ default: m.PartnerLayout })));
export const PartnerHome = withErrorRecovery(() => import('../pages/partner/Dashboard').then(m => ({ default: m.PartnerHome })));
export const PartnerProducts = withErrorRecovery(() => import('../pages/partner/Products').then(m => ({ default: m.PartnerProducts })));
export const PartnerProductCreate = withErrorRecovery(() => import('../pages/partner/ProductCreate').then(m => ({ default: m.ProductCreate })));
export const PartnerOrders = withErrorRecovery(() => import('../pages/partner/Orders').then(m => ({ default: m.PartnerOrders })));
export const PartnerEarnings = withErrorRecovery(() => import('../pages/partner/Earnings').then(m => ({ default: m.PartnerEarnings })));
export const PartnerReviews = withErrorRecovery(() => import('../pages/partner/ReviewsManagement').then(m => ({ default: m.ReviewsManagement })));
export const PartnerHelp = withErrorRecovery(() => import('../pages/partner/HelpCenter').then(m => ({ default: m.HelpCenter })));
export const PartnerProfile = withErrorRecovery(() => import('../pages/partner/Profile').then(m => ({ default: m.PartnerProfile })));
export const PartnerPromotions = withErrorRecovery(() => import('../pages/partner/Promotions').then(m => ({ default: m.PartnerPromotions })));
export const PartnerAdvertising = withErrorRecovery(() => import('../pages/partner/Advertising').then(m => ({ default: m.PartnerAdvertising })));

// Admin Pages - Internal Console
export { AdminLogin } from '../pages/admin/Login';
export { AdminLayout } from '../components/admin/AdminLayout';
export { AdminDashboard } from '../pages/admin/Dashboard';
export { AdminPartners } from '../pages/admin/Partners';
export { AdminProductApprovals } from '../pages/admin/ProductApprovals';
export { AdminOrders } from '../pages/admin/Orders';
export { AdminDisputes } from '../pages/admin/Disputes';
export { AdminPayouts } from '../pages/admin/Payouts';
export { AdminAnalytics } from '../pages/admin/Analytics';
export { AdminContent } from '../pages/admin/ContentManagement';
export { AdminSettings } from '../pages/admin/Settings';
export { AdminUsers } from '../pages/admin/AdminUsers';
export { AdminAudit } from '../pages/admin/AuditLogs';
export { CommissionManagement } from '../pages/admin/CommissionManagement';
export { FeeManagement } from '../pages/admin/FeeManagement';
export { AdminPromotionalOffers } from '../pages/admin/PromotionalOffers';

export { AdminAdvertisingManagement } from '../pages/admin/AdvertisingManagement';
export { AdminLocationManagement } from '../pages/admin/LocationManagement';
export { AdminCategoryManagement } from '../pages/admin/CategoryManagement';
export { AdminNotificationManagement } from '../pages/admin/NotificationManagement';
export { AdminPreviewMonitoring } from '../pages/admin/PreviewMonitoring';
export { AdminLogisticsManagement } from '../pages/admin/LogisticsManagement';
// Legacy
export { AdminPartnerApprovals } from '../pages/admin/PartnerApprovals';

// Legal Pages - Placeholder exports (files deleted)
// Note: Legal pages can be recreated if needed

// Utility Pages
export { default as NotFound } from '../pages/NotFound';
export { default as Unauthorized } from '../pages/Unauthorized';
