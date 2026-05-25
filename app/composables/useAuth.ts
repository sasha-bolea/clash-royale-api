// Thin wrapper sopra @nuxtjs/supabase per uniformare uso.
export function useAuth() {
  const db = useSupabaseClient()
  const user = useSupabaseUser()

  async function signIn(email: string, password: string) {
    const { error } = await db.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string) {
    const { error } = await db.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await db.auth.signOut()
    if (error) throw error
  }

  return { user, signIn, signUp, signOut }
}
