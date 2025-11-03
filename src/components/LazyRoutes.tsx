import { lazy } from 'react';

// Lazy load customer pages for better performance
export const Login = lazy(() => import('../pages/customer/Login').then(m => ({ default: m.CustomerMobileLogin })));
export const Signup = lazy(() => import('../pages/customer/Signup').then(m => ({ default: m.CustomerMobileSignup })));
export const Home = lazy(() => import('../pages/customer/CustomerHome').then(m => ({ default: m.CustomerHome })));
export const PartnerCatalog = lazy(() => import('../pages/customer/PartnerCatalog').then(m => ({ default: m.PartnerCatalog })));
export const Saved = lazy(() => import('../pages/customer/Saved').then(m => ({ default: m.Saved })));
export const Track = lazy(() => import('../pages/customer/Track').then(m => ({ default: m.Track })));
// PreviewApproval removed - functionality moved to inline bottom sheet in Track.tsx (Swiggy 2025 pattern)
// Profile removed - functionality moved to AccountSheet bottom sheet (Swiggy 2025 pattern)
export const Search = lazy(() => import('../pages/customer/Search').then(m => ({ default: m.CustomerMobileSearch })));
export const Orders = lazy(() => import('../pages/customer/Orders').then(m => ({ default: m.Orders })));
export const AddressBook = lazy(() => import('../pages/customer/AddressBook').then(m => ({ default: m.AddressBook })));
export const AddAddress = lazy(() => import('../pages/customer/AddAddress').then(m => ({ default: m.AddAddress })));
export const HelpCenter = lazy(() => import('../pages/customer/HelpCenter').then(m => ({ default: m.HelpCenter })));

// Primary export
export const Favorites = Saved;

// Partner Pages - Business Dashboard (Lazy loaded for code splitting)
export const PartnerLogin = lazy(() => import('../pages/partner/Login').then(m => ({ default: m.PartnerLogin })));
export const PartnerSignup = lazy(() => import('../pages/partner/Signup').then(m => ({ default: m.PartnerSignup })));
export const PartnerVerifyEmail = lazy(() => import('../pages/partner/VerifyEmail').then(m => ({ default: m.PartnerVerifyEmail })));
export const PartnerOnboarding = lazy(() => import('../pages/partner/Onboarding').then(m => ({ default: m.PartnerOnboarding })));
export const PartnerLayout = lazy(() => import('../components/partner/PartnerLayout').then(m => ({ default: m.PartnerLayout })));
export const PartnerHome = lazy(() => import('../pages/partner/Dashboard').then(m => ({ default: m.PartnerHome })));
export const PartnerProducts = lazy(() => import('../pages/partner/Products').then(m => ({ default: m.PartnerProducts })));
export const PartnerProductCreate = lazy(() => import('../pages/partner/ProductCreate').then(m => ({ default: m.ProductCreate })));
export const PartnerOrders = lazy(() => import('../pages/partner/Orders').then(m => ({ default: m.PartnerOrders })));
export const PartnerEarnings = lazy(() => import('../pages/partner/Earnings').then(m => ({ default: m.PartnerEarnings })));
export const PartnerReviews = lazy(() => import('../pages/partner/ReviewsManagement').then(m => ({ default: m.ReviewsManagement })));
export const PartnerHelp = lazy(() => import('../pages/partner/HelpCenter').then(m => ({ default: m.HelpCenter })));
export const PartnerProfile = lazy(() => import('../pages/partner/Profile').then(m => ({ default: m.PartnerProfile })));

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
// Legacy
export { AdminPartnerApprovals } from '../pages/admin/PartnerApprovals';

// Legal Pages - Placeholder exports (files deleted)
// Note: Legal pages can be recreated if needed

// Utility Pages
export { default as NotFound } from '../pages/NotFound';
export { default as Unauthorized } from '../pages/Unauthorized';
