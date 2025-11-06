import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from '@/lib/error-boundary';
import { MobileOverflowFix } from '@/lib/mobile-overflow-fix';
import { mobilePerformanceOptimizer } from '@/lib/mobile-performance-optimizer';

// Initialize mobile fixes and performance optimization immediately
MobileOverflowFix.initialize();
mobilePerformanceOptimizer.initialize();

// Service Worker: Completely disabled in development mode
// In production, SW is registered only when explicitly needed
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail - SW registration is optional
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
