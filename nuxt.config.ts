// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  // SPA mode: pagine client-only (Supabase chiamato dal browser).
  // Server routes Nitro (/api/cr/*) restano disponibili come serverless.
  ssr: false,

  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],

  css: ['~/assets/css/style.css'],

  runtimeConfig: {
    // server-only — proxy CR API
    crApiKey: process.env.CR_API_KEY ?? '',
    crProxyUrl: process.env.CR_PROXY_URL ?? 'https://proxy.royaleapi.dev/v1',
    public: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    },
  },

  app: {
    head: {
      title: 'Royal Arena',
      htmlAttrs: { lang: 'it' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', content: '#0a0f2e' },
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/images/ui/icon.png' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Lilita+One&display=swap',
        },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: ['@supabase/supabase-js', 'chart.js'],
    },
  },

  pwa: {
    registerType: 'prompt',
    manifest: {
      name: 'Royal Arena',
      short_name: 'Royal Arena',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0a0f2e',
      theme_color: '#0a0f2e',
      icons: [
        { src: '/images/ui/icon.png', sizes: '192x192', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2,ttf}'],
    },
    devOptions: { enabled: false },
  },
})
