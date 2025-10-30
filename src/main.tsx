import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from '@/lib/error-boundary';
import { MobileOverflowFix } from '@/lib/mobile-overflow-fix';
import { mobilePerformanceOptimizer } from '@/lib/mobile-performance-optimizer';

// Initialize mobile fixes and performance optimization immediately
MobileOverflowFix.initialize();
mobilePerformanceOptimizer.initialize();

// Register service worker only in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
