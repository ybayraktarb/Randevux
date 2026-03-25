import { Stack } from "expo-router"
import { AuthProvider } from "@/src/providers/auth-provider"

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
