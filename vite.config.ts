import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for "__dirname is not defined" in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: 'src',
          filename: 'sw.ts',
          registerType: 'autoUpdate',
          includeAssets: [
            'favicon.ico', 
            'apple-touch-icon.png', 
            'maskable-icon-512x512.png'
          ],
          manifest: {
            name: 'Dyesabel Philippines, Inc.',
            short_name: 'Dyesabel',
            description: 'Empowering communities through sustainable development and education.',
            id: '/',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            display_override: ['standalone', 'minimal-ui', 'browser'],
            orientation: 'portrait',
            theme_color: '#051923', // Your ocean-deep color
            background_color: '#00080a', // Your ocean-dark color
            lang: 'en',
            categories: ['non-profit', 'community', 'education'],
            icons: [
              {
                src: '/icons/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: '/icons/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: '/icons/maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
            screenshots: [
              {
                src: '/screenshots/home-portrait.png',
                sizes: '750x1334',
                type: 'image/png',
                form_factor: 'narrow',
                label: 'Homepage',
              },
              {
                src: '/screenshots/home-landscape.png',
                sizes: '1280x720',
                type: 'image/png',
                form_factor: 'wide',
                label: 'Desktop overview',
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        target: 'esnext',
        outDir: 'build', 
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'vendor-react';
                if (id.includes('lucide')) return 'vendor-icons';
                return 'vendor-libs';
              }
            },
          },
        },
      },
    };
});