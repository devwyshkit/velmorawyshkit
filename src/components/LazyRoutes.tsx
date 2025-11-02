import { lazy } from 'react';

// Lazy load customer pages for better performance
export const Login = lazy(() => import('../pages/customer/Login').then(m => ({ default: m.CustomerMobileLogin })));
export const Signup = lazy(() => import('../pages/customer/Signup').then(m => ({ default: m.CustomerMobileSignup })));
export const Home = lazy(() => import('../pages/customer/CustomerHome').then(m => ({ default: m.CustomerHome })));
export const PartnerCatalog = lazy(() => import('../pages/customer/PartnerCatalog').then(m => ({ default: m.PartnerCatalog })));
export const Saved = lazy(() => import('../pages/customer/Saved').then(m => ({ default: m.Saved })));
export const Track = lazy(() => import('../pages/customer/Track').then(m => ({ default: m.Track })));
export const PreviewApproval = lazy(() => import('../pages/customer/PreviewApproval').then(m => ({ default: m.PreviewApproval })));
export const Profile = lazy(() => import('../pages/customer/Profile').then(m => ({ default: m.Profile })));
export const Search = lazy(() => import('../pages/customer/Search').then(m => ({ default: m.CustomerMobileSearch })));
export const Orders = lazy(() => import('../pages/customer/Orders').then(m => ({ default: m.Orders })));
export const AddressBook = lazy(() => import('../pages/customer/AddressBook').then(m => ({ default: m.AddressBook })));
export const AddAddress = lazy(() => import('../pages/customer/AddAddress').then(m => ({ default: m.AddAddress })));
export const HelpCenter = lazy(() => import('../pages/customer/HelpCenter').then(m => ({ default: m.HelpCenter })));

// Primary export
export const Favorites = Saved;

// Partner Pages - Business Dashboard
export { PartnerLogin } from '../pages/partner/Login';
export { PartnerSignup } from '../pages/partner/Signup';
export { PartnerVerifyEmail } from '../pages/partner/VerifyEmail';
export { PartnerOnboarding } from '../pages/partner/Onboarding';
export { PartnerLayout } from '../components/partner/PartnerLayout';
export { PartnerHome } from '../pages/partner/Dashboard';
export { PartnerProducts } from '../pages/partner/Products';
export { PartnerOrders } from '../pages/partner/Orders';
export { PartnerEarnings } from '../pages/partner/Earnings';
export { ReviewsManagement as PartnerReviews } from '../pages/partner/ReviewsManagement';
export { CampaignManager as PartnerCampaigns } from '../pages/partner/CampaignManager';
export { ReferralProgram as PartnerReferrals } from '../pages/partner/ReferralProgram';
export { DisputeResolution as PartnerDisputes } from '../pages/partner/DisputeResolution';
export { Returns as PartnerReturns } from '../pages/partner/Returns';
export { HelpCenter as PartnerHelp } from '../pages/partner/HelpCenter';
export { PartnerProfile } from '../pages/partner/Profile';
export { PartnerBadges } from '../pages/partner/Badges';

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
