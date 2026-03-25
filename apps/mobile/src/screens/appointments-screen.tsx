import { useEffect, useState } from "react"
import type { AppointmentSummary } from "@randevux/shared"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { ScreenShell } from "@/src/components/screen-shell"
import { mobileApi } from "@/src/lib/api"

export function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])

  const load = async () => {
    const result = await mobileApi.dashboard()
    if (result.success && result.data) setAppointments(result.data.appointments)
  }

  useEffect(() => {
    load()
  }, [])

  const cancelAppointment = async (appointmentId: string) => {
    const result = await mobileApi.cancelAppointment(appointmentId, "Mobil uygulamadan iptal edildi")
    if (result.success) {
      Alert.alert("Başarılı", "Randevu iptal edildi.")
      load()
    } else {
      Alert.alert("İptal edilemedi", result.error?.message || "Bilinmeyen hata")
    }
  }

  return (
    <ScreenShell title="Randevularım" subtitle="İlk sürümde listeleme ve iptal akışı bağlandı.">
      {appointments.map((appointment) => (
        <View key={appointment.id} style={styles.card}>
          <Text style={styles.title}>{appointment.businessName}</Text>
          <Text style={styles.meta}>{appointment.services}</Text>
          <Text style={styles.meta}>{appointment.date}</Text>
          <Text style={styles.meta}>{appointment.time}</Text>
          <Pressable style={styles.button} onPress={() => cancelAppointment(appointment.id)}>
            <Text style={styles.buttonText}>İptal Et</Text>
          </Pressable>
        </View>
      ))}
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    gap: 6
  },
  title: { fontSize: 18, fontWeight: "700", color: "#192126" },
  meta: { color: "#5c676f" },
  button: {
    marginTop: 8,
    backgroundColor: "#efd6d1",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: { color: "#5a1b14", fontWeight: "700" }
})
