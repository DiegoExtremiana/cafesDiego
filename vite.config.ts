import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// base './' + HashRouter: la app funciona en GitHub Pages bajo cualquier ruta de repositorio.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Recharts + React 19 se basa en nombres de función/clase para reconocer sus propios
  // componentes (p. ej. CategoricalChart) en tiempo de ejecución; esbuild los renombra al
  // minificar y eso deja ejes, cuadrícula y tooltip sin renderizar solo en producción.
  esbuild: {
    keepNames: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          recharts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
