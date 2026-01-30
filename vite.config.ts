import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all environment variables from .env files
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize shell environment variables, then .env file variables
  const apiKey = process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || '';
  const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';

  return {
    plugins: [react()],
    define: {
      // These will be replaced with actual strings during build/dev
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', '@google/genai', '@supabase/supabase-js']
          }
        }
      }
    },
    server: {
      port: 8080
    }
  };
});