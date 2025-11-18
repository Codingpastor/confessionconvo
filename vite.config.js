import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // Set the base path for the root domain
  build: {
    outDir: 'dist' // Ensure the output directory is 'dist'
  }
});
