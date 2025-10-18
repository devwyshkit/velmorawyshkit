import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";

// Lazy Loaded Pages - Code Splitting
import * as LazyPages from "./components/LazyRoutes";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="wyshkit-ui-theme">
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
              <Route path="cart" element={<LazyPages.Cart />} />
              <Route path="wishlist" element={<LazyPages.Wishlist />} />
              <Route path="checkout" element={<LazyPages.Checkout />} />
              <Route path="confirmation" element={<LazyPages.Confirmation />} />
              <Route path="track/:orderId?" element={<LazyPages.Track />} />
              <Route path="profile" element={<LazyPages.Profile />} />
            </Route>

            {/* Partner Routes - Mobile-First UI (same design system) */}
            <Route path="/partner">
              <Route path="login" element={<LazyPages.PartnerLogin />} />
              <Route path="signup" element={<LazyPages.PartnerSignup />} />
              
              {/* Protected Partner Routes */}
              <Route element={<ProtectedRoute requireAuth={true}><LazyPages.PartnerDashboard /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<LazyPages.PartnerHome />} />
                <Route path="catalog" element={<LazyPages.PartnerCatalog />} />
                <Route path="orders" element={<LazyPages.PartnerOrders />} />
                <Route path="earnings" element={<LazyPages.PartnerEarnings />} />
                <Route path="profile" element={<LazyPages.PartnerProfile />} />
              </Route>
              <Route path="onboarding" element={<ProtectedRoute requireAuth={true}><LazyPages.PartnerOnboarding /></ProtectedRoute>} />
              <Route path="pending" element={<ProtectedRoute requireAuth={true}><LazyPages.PartnerPending /></ProtectedRoute>} />
            </Route>

            {/* Admin Routes - Requires login + admin role */}
            <Route path="/admin">
              <Route element={<ProtectedRoute requireAuth={true} allowedRoles={['admin']}><LazyPages.AdminDashboard /></ProtectedRoute>}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<LazyPages.AdminOverview />} />
                <Route path="partners" element={<LazyPages.AdminPartnerApprovals />} />
                <Route path="orders" element={<LazyPages.AdminOrders />} />
              </Route>
            </Route>

            {/* Utility Routes */}
            <Route path="/unauthorized" element={<LazyPages.Unauthorized />} />
            <Route path="*" element={<LazyPages.NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LocationProvider>
    </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
