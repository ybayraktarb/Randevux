import { createClient } from "@supabase/supabase-js"

export async function createMobileRequestContext(request: Request) {
  const authHeader = request.headers.get("authorization")
  const accessToken = authHeader?.replace(/^Bearer\s+/i, "")

  if (!accessToken) {
    return { supabase: null, user: null as null }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) {
    return { supabase: null, user: null as null }
  }

  return { supabase, user: data.user }
}
