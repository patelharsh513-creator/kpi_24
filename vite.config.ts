
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioritize keys in this order
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || '';
  const firebaseApiKey = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '';

  return {
    plugins: [react()],
    base: './', // CRITICAL: Ensures assets load correctly on GitHub Pages (relative paths)
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      emptyOutDir: true,
    },
    define: {
      // CRITICAL: Prevent "process is not defined" error in browser
      'process.env': {}, 
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
    }
  };
});
