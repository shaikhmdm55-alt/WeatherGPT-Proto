import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
});
