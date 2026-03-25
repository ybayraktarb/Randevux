import { Tabs } from "expo-router"

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Ana Sayfa" }} />
      <Tabs.Screen name="appointments" options={{ title: "Randevular" }} />
      <Tabs.Screen name="businesses" options={{ title: "İşletmeler" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  )
}
