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
  build: {
    rollupOptions: {
      output: {
        // Firebase and React change only when package.json does, so they get
        // their own files. A deploy that touches app code then leaves them
        // cached in the browser instead of re-downloading all of it.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(@firebase|firebase|idb)\//.test(id)) {
            return 'firebase';
          }
          if (
            /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(
              id
            )
          ) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
});
