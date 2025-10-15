import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from '@/lib/error-boundary';
import { MobileOverflowFix } from '@/lib/mobile-overflow-fix';
import { mobilePerformanceOptimizer } from '@/lib/mobile-performance-optimizer';

// Initialize mobile fixes and performance optimization immediately
MobileOverflowFix.initialize();
mobilePerformanceOptimizer.initialize();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(() => {
        // SW registration failed - development only logging
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
