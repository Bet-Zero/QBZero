// Force redeploy - Firebase config updated
// Updated: August 21, 2025
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hello-pangea/dnd': path.resolve(
        __dirname,
        'node_modules/@hello-pangea/dnd/dist/index.js'
      ),
    },
  },
});
