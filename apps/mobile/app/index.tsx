import { Redirect } from "expo-router"
import { useAuth } from "@/src/providers/auth-provider"

export default function IndexScreen() {
  const { session, loading } = useAuth()

  if (loading) return null

  return <Redirect href={session ? "/(app)" : "/(auth)/login"} />
}
