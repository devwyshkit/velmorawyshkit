
import { Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { DeliveryProvider } from "@/contexts/DeliveryContext";
import { SkeletonComponents } from "@/components/ui/skeleton-screen";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OfflineBanner } from "@/components/system/OfflineBanner";
import { PreviewNotificationBanner } from "@/components/customer/shared/PreviewNotificationBanner";
import { NavigationInitializer } from "@/components/system/NavigationInitializer";

// Lazy Loaded Pages - Code Splitting
import * as LazyPages from "./components/LazyRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="wyshkit-ui-theme">
      <AuthProvider>
        <CartProvider>
          <DeliveryProvider>
            <TooltipProvider>
              <OfflineBanner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                {/* Initialize navigation service */}
                <NavigationInitializer />
                {/* Preview Notification Banner - Persistent across all pages (Fiverr 2025 pattern) */}
                <PreviewNotificationBanner />
                <Suspense fallback={<SkeletonComponents.Dashboard />}>
                  <Routes>
                    {/* Root is consumer home */}
                    <Route path="/" element={<LazyPages.Home />} />
                    
                    {/* Consumer Routes at root */}
                    <Route path="/login" element={<LazyPages.Login />} />
                    <Route path="/signup" element={<LazyPages.Signup />} />
                    <Route path="/search" element={<LazyPages.Search />} />
                    <Route path="/catalog/:storeId" element={<LazyPages.PartnerCatalog />} />
                    {/* Protected Consumer Routes */}
                    <Route path="/favorites" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Favorites />
                        </ProtectedRoute>
                      } />
                    <Route path="/order/:id/track" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Track />
                        </ProtectedRoute>
                      } />
                    {/* Preview Approval removed - now inline bottom sheet in Track page (Swiggy 2025 pattern) */}
                    <Route path="/order/:orderId/preview" element={<Navigate to="/orders" replace />} />
                    <Route path="/orders" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Orders />
                        </ProtectedRoute>
                      } />
                    <Route path="/account/addresses" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.AddressBook />
                        </ProtectedRoute>
                      } />
                    <Route path="/account/addresses/add" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.AddAddress />
                        </ProtectedRoute>
                      } />
                    <Route path="/help" element={<LazyPages.HelpCenter />} />
                    {/* Profile page removed - AccountSheet (bottom sheet) replaces it (Swiggy 2025 pattern) */}
                    <Route path="/profile" element={<Navigate to="/" replace />} />

                    {/* Legacy redirects from /customer/* */}
                    <Route path="/customer/home" element={<Navigate to="/" replace />} />
                    <Route path="/customer/search" element={<Navigate to="/search" replace />} />
                    <Route path="/customer/login" element={<Navigate to="/login" replace />} />
                    <Route path="/customer/signup" element={<Navigate to="/signup" replace />} />
                    <Route path="/customer/favorites" element={<Navigate to="/favorites" replace />} />
                    <Route path="/customer/saved" element={<Navigate to="/favorites" replace />} />
                    <Route path="/customer/checkout" element={<Navigate to="/" replace />} />
                    <Route path="/customer/profile" element={<Navigate to="/profile" replace />} />
                    <Route path="/customer/wishlist" element={<Navigate to="/favorites" replace />} />
                    <Route path="/saved" element={<Navigate to="/favorites" replace />} />
                    <Route path="/favourites" element={<Navigate to="/favorites" replace />} />

                    {/* Partner Routes - Business Dashboard */}
                    <Route path="/partner">
                      <Route index element={<Navigate to="login" replace />} />
                      <Route path="login" element={<LazyPages.PartnerLogin />} />
                      <Route path="signup" element={<LazyPages.PartnerSignup />} />
                      <Route path="verify-email" element={<LazyPages.PartnerVerifyEmail />} />
                      <Route path="onboarding" element={<LazyPages.PartnerOnboarding />} />
                      
                      {/* Protected Dashboard Routes - FULLY PROTECTED */}
                      <Route path="dashboard" element={
                        <ProtectedRoute requiredRole="seller">
                          <LazyPages.PartnerLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<LazyPages.PartnerHome />} />
                        <Route path="products" element={<LazyPages.PartnerProducts />} />
                        <Route path="products/create" element={<LazyPages.PartnerProductCreate />} />
                        <Route path="orders" element={<LazyPages.PartnerOrders />} />
                        <Route path="earnings" element={<LazyPages.PartnerEarnings />} />
                        <Route path="reviews" element={<LazyPages.PartnerReviews />} />
                        <Route path="help" element={<LazyPages.PartnerHelp />} />
                        <Route path="profile" element={<LazyPages.PartnerProfile />} />
                      </Route>
                    </Route>

                    {/* Admin Routes - Internal Console (Desktop-only) */}
                    <Route path="/admin">
                      <Route path="login" element={<LazyPages.AdminLogin />} />
                      <Route path="dashboard" element={
                        <ProtectedRoute requiredRole="admin">
                          <LazyPages.AdminLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<LazyPages.AdminDashboard />} />
                        <Route path="partners" element={<LazyPages.AdminPartners />} />
                        <Route path="product-approvals" element={<LazyPages.AdminProductApprovals />} />
                        <Route path="orders" element={<LazyPages.AdminOrders />} />
                        <Route path="disputes" element={<LazyPages.AdminDisputes />} />
                        <Route path="payouts" element={<LazyPages.AdminPayouts />} />
                        <Route path="analytics" element={<LazyPages.AdminAnalytics />} />
                        <Route path="content" element={<LazyPages.AdminContent />} />
                        <Route path="settings" element={<LazyPages.AdminSettings />} />
                        <Route path="users" element={<LazyPages.AdminUsers />} />
                        <Route path="audit" element={<LazyPages.AdminAudit />} />
                        <Route path="commission" element={<LazyPages.CommissionManagement />} />
                        <Route path="fees" element={<LazyPages.FeeManagement />} />
                        {/* Legacy route redirect */}
                        <Route path="partner-approvals" element={<Navigate to="/admin/partners" replace />} />
                      </Route>
                    </Route>

                    {/* Legal Routes - Note: Legal pages can be recreated if needed */}

                    {/* Utility Routes */}
                    <Route path="/unauthorized" element={<LazyPages.Unauthorized />} />
                    <Route path="*" element={<LazyPages.NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </DeliveryProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
