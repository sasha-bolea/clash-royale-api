import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Plugin client-only: crea client Supabase e lo espone via useNuxtApp().$db
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const db: SupabaseClient = createClient(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
  )
  return {
    provide: { db },
  }
})

declare module '#app' {
  interface NuxtApp {
    $db: SupabaseClient
  }
}
