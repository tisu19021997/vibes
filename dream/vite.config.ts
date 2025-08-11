import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// @ts-ignore types may not resolve in config for dotenv
import dotenv from "dotenv";

// Load local .env for dev server (server-only, not exposed to client)
dotenv.config();

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
    // Dev-only middleware to upload images to Cloudinary without exposing secrets to the browser
    mode === 'development' && {
      name: 'cloudinary-upload-dev',
      configureServer(server: import('vite').ViteDevServer) {
        server.middlewares.use('/api/upload-image', async (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.end();
            return;
          }
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Allow', 'POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end('Method Not Allowed');
            return;
          }
          try {
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve, reject) => {
              req.on('data', (c: Buffer) => chunks.push(c));
              req.on('end', () => resolve());
              req.on('error', (e) => reject(e));
            });
            const bodyStr = Buffer.concat(chunks).toString('utf-8');
            const { dataUrl, folder = 'oneiroi/dreams', publicId, context } = JSON.parse(bodyStr || '{}');
            if (!dataUrl || typeof dataUrl !== 'string') {
              res.statusCode = 400;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ error: 'Missing or invalid dataUrl' }));
              return;
            }
            // @ts-ignore cloudinary types may not be available in Vite config typecheck; runtime is fine
            const { v2: cloudinary } = await import('cloudinary');
            cloudinary.config({
              cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
              api_key: process.env.CLOUDINARY_API_KEY,
              api_secret: process.env.CLOUDINARY_API_SECRET,
              secure: true,
            });
            const toStringValue = (val: unknown): string => {
              if (val === null || val === undefined) return '';
              if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val);
              try { return JSON.stringify(val); } catch { return String(val as any); }
            };

            const maxLen = 255;
            const allowedContextKeys = ['userId', 'sessionId', 'title', 'theme', 'dream'];
            const mergedContext = context && typeof context === 'object'
              ? Object.fromEntries(
                  Object.entries(context as Record<string, unknown>)
                    .filter(([k]) => allowedContextKeys.includes(k as string))
                    .map(([k, v]) => [k, toStringValue(v).slice(0, maxLen)])
                ) as Record<string, string>
              : {} as Record<string, string>;

            const result = await cloudinary.uploader.upload(dataUrl, {
              folder,
              public_id: publicId,
              resource_type: 'image',
              overwrite: true,
              format: 'png',
              context: Object.keys(mergedContext).length ? mergedContext : undefined,
            });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              secureUrl: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              context: result.context,
              metadata: result.metadata,
            }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            const message = (e as Error)?.message || 'Unknown error';
            res.end(JSON.stringify({ error: message }));
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
