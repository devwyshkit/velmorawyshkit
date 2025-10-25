
import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { DeliveryProvider } from "@/contexts/DeliveryContext";
import { SkeletonComponents } from "@/components/ui/skeleton-screen";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense fallback={<SkeletonComponents.Dashboard />}>
                  <Routes>
                    {/* Root redirect to customer home */}
                    <Route path="/" element={<Navigate to="/customer/home" replace />} />
                    
                    {/* Customer Routes - Mobile-First UI */}
                    <Route path="/customer">
                      <Route index element={<Navigate to="home" replace />} />
                      <Route path="login" element={<LazyPages.Login />} />
                      <Route path="signup" element={<LazyPages.Signup />} />
                      <Route path="home" element={<LazyPages.Home />} />
                      <Route path="search" element={<LazyPages.Search />} />
                      <Route path="partners/:id" element={<LazyPages.Partner />} />
                      <Route path="items/:id" element={<LazyPages.ItemDetails />} />
                      
                      {/* Protected Customer Routes */}
                      <Route path="cart" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Cart />
                        </ProtectedRoute>
                      } />
                      <Route path="wishlist" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Wishlist />
                        </ProtectedRoute>
                      } />
                      <Route path="checkout" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Checkout />
                        </ProtectedRoute>
                      } />
                      <Route path="confirmation" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Confirmation />
                        </ProtectedRoute>
                      } />
                      <Route path="track/:orderId?" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Track />
                        </ProtectedRoute>
                      } />
                      <Route path="profile" element={
                        <ProtectedRoute requiredRole="customer">
                          <LazyPages.Profile />
                        </ProtectedRoute>
                      } />
                    </Route>

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
                        <Route path="orders" element={<LazyPages.PartnerOrders />} />
                        <Route path="earnings" element={<LazyPages.PartnerEarnings />} />
                        <Route path="reviews" element={<LazyPages.PartnerReviews />} />
                        <Route path="campaigns" element={<LazyPages.PartnerCampaigns />} />
                        <Route path="referrals" element={<LazyPages.PartnerReferrals />} />
                        <Route path="badges" element={<LazyPages.PartnerBadges />} />
                        <Route path="disputes" element={<LazyPages.PartnerDisputes />} />
                        <Route path="returns" element={<LazyPages.PartnerReturns />} />
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
