import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Define API keys using loaded environment variables, falling back to defaults
  // These keys will be injected into the application via the 'define' property
  const apiKey = env.API_KEY || env.VITE_API_KEY || "AIzaSyD8Z3UWYD6Djnim8WJjEC-42gPrHzvzhdA";
  const firebaseApiKey = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || "AIzaSyCHpiYrXfvAfT-C2y40Uk78GBNFeVj9iQo";

  return {
    plugins: [react()],

    // IMPORTANT: Set the base path to your GitHub repository name for correct asset loading on GitHub Pages.
    base: '/kpi_24/',

    // Configuration for the production build output
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false, // Turn off sourcemaps for cleaner production code
      emptyOutDir: true, // Clean the dist directory before building
    },

    // Inject environment variables as global constants in the application code
    define: {
      // Required for compatibility with some libraries that check for 'process.env'
      'process.env': {},
      // Injects the API keys with their defined values
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.FIREBASE_API_KEY': JSON.stringify(firebaseApiKey),
    }
  };
});
