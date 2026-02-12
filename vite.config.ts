import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for "__dirname is not defined" in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Polyfill process.env for code that might rely on it
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        }
      },
      build: {
        target: 'esnext',
        outDir: 'build', // Matches vercel.json "outputDirectory"
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Split vendor code into separate files
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