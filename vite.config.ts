import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build:{
    target:"esnext",
    outDir: 'dist',
    minify: mode === 'production',
    sourcemap: mode === 'development',
    rollupOptions:{
      input:{
        sidebar: "./index.html",
        serviceWorker: './public/service-worker.js'
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]', 
      },
    },
    esbuild: {
      minify: true, // Minifies the code to reduce bundle size
    },
    server: {
      hmr: mode === 'development',
    },
    define: {
      __DEV__: mode === 'development',
    },
    base: './',
  },
}))

