import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chart-vendor';
            }
            if (id.includes('react') || id.includes('date-fns') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
          }
          return undefined;
        },
      },
    },
  },
})
