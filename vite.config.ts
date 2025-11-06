import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
      // Auto-detect browser port for HMR (handles proxy/port forwarding)
      clientPort: undefined,
    },
    watch: {
      usePolling: false,
    },
    strictPort: false,
    // Aggressive cache prevention for development
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    },
    // Middleware to force no-cache on all module requests in dev mode
    ...(mode === 'development' && {
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          // Block service worker file in development
          if (req.url === '/sw.js') {
            res.statusCode = 404;
            res.end('Service worker disabled in development mode');
            return;
          }
          // Force no-cache on all module requests
          if (req.url?.includes('/src/') || 
              req.url?.includes('/node_modules/') || 
              req.url?.includes('.ts') || 
              req.url?.includes('.tsx') || 
              req.url?.includes('.js') || 
              req.url?.includes('.jsx') ||
              req.url?.includes('/@vite/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
          next();
        });
      },
    }),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "scheduler"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-tooltip",
    ],
    exclude: [],
    force: true,
    esbuildOptions: {
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    // Clear cache on every restart
    entries: [
      'src/main.tsx',
      'src/App.tsx',
    ],
  },
  // Development-specific cache-busting
  ...(mode === 'development' && {
    // Force module reload on every request
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      // Add timestamp to module imports to force cache invalidation
      define: {
        '__VITE_BUILD_TIME__': JSON.stringify(Date.now()),
      },
    },
  }),
  // Clear build cache to prevent stale module issues
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React and React DOM must be in the same chunk to avoid multiple instances
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }
          if (id.includes('src/pages/admin/')) {
            return 'admin';
          }
          if (id.includes('src/pages/partner/')) {
            return 'partner';
          }
          if (id.includes('src/pages/customer/')) {
            return 'customer';
          }
        }
      }
    },
    // Ensure React is externalized correctly
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
}));
