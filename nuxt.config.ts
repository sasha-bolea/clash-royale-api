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
        { name: 'theme-color', content: '#082d4d' },
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
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
      orientation: 'portrait',
      lang: 'it',
      background_color: '#082d4d',
      theme_color: '#082d4d',
      icons: [
        { src: '/images/ui/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/images/ui/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/images/ui/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2,ttf}'],
    },
    devOptions: { enabled: false },
  },
})
