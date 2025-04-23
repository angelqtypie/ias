/// <reference types="vitest" />

import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react'; // Use default import

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // Now calling the plugin correctly
    legacy(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
