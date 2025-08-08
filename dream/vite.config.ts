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
    // Dev-only middleware plugin to proxy FLUX images through same-origin
    mode === 'development' && {
      name: 'flux-image-proxy',
      configureServer(server: import('vite').ViteDevServer) {
        server.middlewares.use('/api/flux-image', async (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const imageUrl = urlObj.searchParams.get('url');
            if (!imageUrl) {
              res.statusCode = 400;
              res.end('Missing url parameter');
              return;
            }
            const parsed = new URL(imageUrl);
            const host = parsed.host.toLowerCase();
            const isAllowed = host === 'bfl.ai' || host.endsWith('.bfl.ai');
            if (!isAllowed) {
              res.statusCode = 400;
              res.end('Invalid host for image proxy');
              return;
            }
            const upstream = await fetch(imageUrl, {
              headers: { Accept: 'image/png,image/jpeg,image/*' },
            });
            if (!upstream.ok) {
              res.statusCode = upstream.status;
              res.end(await upstream.text().catch(() => 'Failed to fetch image'));
              return;
            }
            const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            const arrayBuffer = await upstream.arrayBuffer();
            res.end(Buffer.from(arrayBuffer));
          } catch (e) {
            res.statusCode = 500;
            const message = (e as Error)?.message || 'Unknown error';
            res.end(`Proxy error: ${message}`);
          }
        });
      },
    },
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
