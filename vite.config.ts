import { defineConfig } from 'vite'

export default defineConfig({
  base: '/BMoreCrimeMaps/',
  optimizeDeps: {
    include: ['leaflet', 'leaflet.heat'],
  },
})
