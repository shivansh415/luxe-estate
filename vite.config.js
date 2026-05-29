import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [
    react(),
    glsl(),
  ],
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag'],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: true,
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('three') ||
            id.includes('@react-three') ||
            id.includes('postprocessing')
          ) {
            return 'webgl-vendor'
          }

          if (
            id.includes('framer-motion') ||
            id.includes('gsap') ||
            id.includes('lenis')
          ) {
            return 'motion-vendor'
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
