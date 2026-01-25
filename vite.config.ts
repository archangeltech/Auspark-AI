
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import process from node:process to provide proper types for the Node.js environment within vite.config.ts
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env vars regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Ensure the service worker and other assets are handled correctly
      rollupOptions: {
        input: {
          main: './index.html',
        }
      }
    },
    server: {
      port: 8080
    }
  };
});
