import { lazy } from 'react';

// Lazy load customer pages for better performance
export const Login = lazy(() => import('../pages/customer/Login').then(m => ({ default: m.CustomerMobileLogin })));
export const Signup = lazy(() => import('../pages/customer/Signup').then(m => ({ default: m.CustomerMobileSignup })));
export const Home = lazy(() => import('../pages/customer/CustomerHome').then(m => ({ default: m.CustomerHome })));
export const Partner = lazy(() => import('../pages/customer/Partner').then(m => ({ default: m.Partner })));
export const ItemDetails = lazy(() => import('../pages/customer/ItemDetailsNew').then(m => ({ default: m.ItemDetailsNew })));
export const Cart = lazy(() => import('../pages/customer/Cart').then(m => ({ default: m.Cart })));
export const Wishlist = lazy(() => import('../pages/customer/Wishlist').then(m => ({ default: m.Wishlist })));
export const Checkout = lazy(() => import('../pages/customer/Checkout').then(m => ({ default: m.Checkout })));
export const Confirmation = lazy(() => import('../pages/customer/Confirmation').then(m => ({ default: m.Confirmation })));
export const Track = lazy(() => import('../pages/customer/Track').then(m => ({ default: m.Track })));
export const Profile = lazy(() => import('../pages/customer/Profile').then(m => ({ default: m.Profile })));
export const Search = lazy(() => import('../pages/customer/Search').then(m => ({ default: m.CustomerMobileSearch })));

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
export { ComponentMarketplace } from '../pages/partner/ComponentMarketplace';
export { WyshkitSupply } from '../pages/partner/WyshkitSupply';

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
// TODO: Recreate legal pages if needed

// Utility Pages
export { default as NotFound } from '../pages/NotFound';
export { default as Unauthorized } from '../pages/Unauthorized';
