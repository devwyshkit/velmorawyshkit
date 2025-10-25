import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
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
    }
  }
}));
