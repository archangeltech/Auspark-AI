import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all environment variables from .env files
  // Fix: Use type assertion for process to access cwd() in environments where Node types might be missing or conflicting
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize shell environment variables, then .env file variables
  const apiKey = process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // This replaces every instance of process.env.API_KEY in the source code
      // with the actual string value at build time.
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
    },
    server: {
      port: 8080
    }
  };
});