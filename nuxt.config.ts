export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  modules: [// Sprawdź czy nie masz tu literówki!
  '@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Sąsiedzka Pożyczalnia',
      short_name: 'Pożyczalnia',
      description: 'Wypożyczaj narzędzia od sąsiadów',
      theme_color: '#16a34a', // Zielony Tailwind (green-600)
      background_color: '#f8fafc', // Slate-50
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/'
    },
    devOptions: {
      enabled: true // Pozwala testować PWA na localhost
    }
  },
  
  supabase: {
    redirect: false
  }
})