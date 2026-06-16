import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/securebackoffice/',

  build: {
    chunkSizeWarningLimit: 2000,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }

            // Graphiques
            if (id.includes('chart.js')) {
              return 'charts';
            }

            // Export (Excel / PDF / download)
            if (
              id.includes('xlsx') ||
              id.includes('file-saver') ||
              id.includes('jspdf')
            ) {
              return 'export';
            }

            // Tout le reste des dépendances externes
            return 'vendor';
          }
        }
      }
    }
  }
})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// export default defineConfig({
//   plugins: [react()],
//   base: '/securebackoffice/',
// })