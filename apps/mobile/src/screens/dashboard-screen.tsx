import { useEffect, useState } from "react"
import type { CustomerDashboardData } from "@randesk/shared"
import { StyleSheet, Text, View } from "react-native"
import { ScreenShell } from "@/src/components/screen-shell"
import { mobileApi } from "@/src/lib/api"

export function DashboardScreen() {
  const [data, setData] = useState<CustomerDashboardData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setRefreshing(true)
    const result = await mobileApi.dashboard()
    if (result.success && result.data) setData(result.data)
    setRefreshing(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <ScreenShell
      title={data?.profile.name ? `Merhaba ${data.profile.name}` : "Randesk Mobile"}
      subtitle="Müşteri deneyimi için ortak domain katmanını kullanan ilk Expo sürümü."
    >
      <View>
        <StatCard label="Yaklaşan Randevu" value={String(data?.appointments.length || 0)} />
        <StatCard label="İşletmelerim" value={String(data?.businesses.length || 0)} />
        <StatCard label="Bildirimler" value={String(data?.notifications.length || 0)} />
        <Text style={styles.caption}>{refreshing ? "Yenileniyor..." : "Ana ekran verileri mobil API üstünden yükleniyor."}</Text>
      </View>
    </ScreenShell>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12
  },
  caption: { color: "#5c676f", marginTop: 8 },
  label: { color: "#69747d", fontSize: 14, marginBottom: 8 },
  value: { color: "#192126", fontSize: 28, fontWeight: "800" }
})
