import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { PropsWithChildren } from "react"
import type { Session } from "@supabase/supabase-js"
import { useRouter, useSegments } from "expo-router"
import * as Notifications from "expo-notifications"
import { supabase } from "@/src/lib/supabase"

interface AuthContextValue {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, loading: true })

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    Notifications.requestPermissionsAsync().catch(() => undefined)

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === "(auth)"
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login")
    } else if (session && inAuthGroup) {
      router.replace("/(app)")
    }
  }, [loading, router, segments, session])

  const value = useMemo(() => ({ session, loading }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
