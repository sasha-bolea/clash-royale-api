import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Plugin client-only: crea client Supabase con anon key e lo espone via useNuxtApp().$db.
// Nessuna auth: si usa solo come client per DB con RLS aperta + RPC.
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
