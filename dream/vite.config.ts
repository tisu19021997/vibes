import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    proxy: {
      '/api/flux': {
        target: 'https://api.bfl.ai/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flux/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add any custom headers if needed
            proxyReq.setHeader('Origin', 'https://api.bfl.ai');
          });
        }
      },
      '/api/flux-images': {
        target: 'https://delivery-us1.bfl.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flux-images/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying image request:', req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message);
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
