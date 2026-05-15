export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  
  modules: [// Sprawdź czy nie masz tu literówki!
  '@nuxtjs/supabase', '@nuxtjs/tailwindcss'],

  supabase: {
    redirect: false
  }
})