import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react-router')) return 'router';
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('@radix-ui') || id.includes('vaul')) return 'radix';
          if (id.includes('motion') || id.includes('canvas-confetti')) return 'motion';
          if (id.includes('recharts') || id.includes('embla-carousel-react') || id.includes('react-day-picker')) return 'charts-and-ui';
          if (id.includes('lucide-react')) return 'icons';
          return 'vendor';
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
