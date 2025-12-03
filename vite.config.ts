import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const apiKey = env.API_KEY || env.VITE_API_KEY || "AIzaSyD8Z3UWYD6Djnim8WJjEC-42gPrHzvzhdA";
  const firebaseApiKey = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || "AIzaSyCHpiYrXfvAfT-C2y40Uk78GBNFeVj9iQo";

  return {
    plugins: [react()],
    base: './', 
    resolve: {
      alias: {
        '@': process.cwd(),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      emptyOutDir: true,
    },
    define: {
      'process.env': {}, 
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
    }
  };
});