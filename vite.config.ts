// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), ''); 
  
  // ❌ PROBLEM: Remove the hardcoded fallback values (e.g., || "AIzaSy...").
  // Relying only on env variables is secure, but you might want to check for their existence.
  // CRITICAL: Ensure all variables for the client are prefixed with VITE_.
  const apiKey = env.VITE_API_KEY || 'AIzaSyCHpiYrXfvAfT-C2y40Uk78GBNFeVj9iQo'; // Use an empty string or throw an error if missing
  const firebaseApiKey = env.VITE_FIREBASE_API_KEY || 'AIzaSyCHpiYrXfvAfT-C2y40Uk78GBNFeVj9iQo'; 

  return {
    plugins: [react()],
    base: './', 
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      emptyOutDir: true,
    },
    // CRITICAL: Ensure you define the VITE_ prefixed variables for the client.
    define: {
      'process.env.VITE_API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
      // Vite typically uses import.meta.env for client-side variables, 
      // but defining them as process.env.* works here since you are forcing 
      // the use of process.env in the next line.
      'process.env': {}, // Keeping this is helpful for older code expecting process.env
    }
  };
});