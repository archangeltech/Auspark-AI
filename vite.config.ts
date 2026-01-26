import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  // Load all environment variables (including those without VITE_ prefix)
  // process.cwd() is used here to get the project root for .env loading
  const env = loadEnv(mode, process.cwd(), '');
  
  // Vercel sets the variables in the environment during build.
  // We prioritize the loaded env, then fall back to process.env.
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', '@google/genai']
          }
        }
      }
    }
  };
});