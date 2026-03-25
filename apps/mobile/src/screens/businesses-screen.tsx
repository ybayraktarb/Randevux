import { useEffect, useState } from "react"
import type { BusinessSummary } from "@randevux/shared"
import { StyleSheet, Text, View } from "react-native"
import { ScreenShell } from "@/src/components/screen-shell"
import { mobileApi } from "@/src/lib/api"

export function BusinessesScreen() {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([])

  useEffect(() => {
    mobileApi.dashboard().then((result) => {
      if (result.success && result.data) setBusinesses(result.data.businesses)
    })
  }, [])

  return (
    <ScreenShell title="İşletmelerim" subtitle="Keşif ve katılım verileri ortak customer repository üzerinden geliyor.">
      {businesses.map((business) => (
        <View key={business.id} style={styles.card}>
          <Text style={styles.name}>{business.name}</Text>
          <Text style={styles.category}>{business.category}</Text>
        </View>
      ))}
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>Randevu alma akışı</Text>
        <Text style={styles.placeholderText}>
          Business seçimi ve slot alma ekranı için veri katmanı hazırlandı; native booking UX bir sonraki iterasyonda genişletilecek.
        </Text>
      </View>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12
  },
  name: { fontSize: 17, fontWeight: "700", color: "#192126" },
  category: { color: "#5c676f", marginTop: 4 },
  placeholder: {
    backgroundColor: "#13232f",
    borderRadius: 20,
    padding: 18
  },
  placeholderTitle: { color: "#fff7ed", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  placeholderText: { color: "#d6ddd9", lineHeight: 22 }
})
