import { useEffect, useState } from "react"
import type { CustomerProfile } from "@randesk/shared"
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native"
import { ScreenShell } from "@/src/components/screen-shell"
import { mobileApi } from "@/src/lib/api"
import { supabase } from "@/src/lib/supabase"

const defaultProfile: CustomerProfile = {
  name: "",
  phone: "",
  notification_settings: {
    email: true,
    push: true,
    sms: false
  }
}

export function ProfileScreen() {
  const [profile, setProfile] = useState<CustomerProfile>(defaultProfile)

  useEffect(() => {
    mobileApi.profile().then((result) => {
      if (result.success && result.data) setProfile(result.data)
    })
  }, [])

  const save = async () => {
    const result = await mobileApi.updateProfile(profile)
    if (result.success) Alert.alert("Kaydedildi", "Profil güncellendi.")
    else Alert.alert("Hata", result.error?.message || "Güncelleme başarısız.")
  }

  return (
    <ScreenShell title="Profil" subtitle="Paylaşılan customer profile sözleşmesi web ve mobile birlikte kullanılıyor.">
      <TextInput style={styles.input} placeholder="Ad Soyad" value={profile.name} onChangeText={(name) => setProfile((prev) => ({ ...prev, name }))} />
      <TextInput style={styles.input} placeholder="Telefon" value={profile.phone} onChangeText={(phone) => setProfile((prev) => ({ ...prev, phone }))} />

      <NotificationSwitch
        label="Push bildirimleri"
        value={profile.notification_settings.push}
        onValueChange={(push) => setProfile((prev) => ({ ...prev, notification_settings: { ...prev.notification_settings, push } }))}
      />
      <NotificationSwitch
        label="E-posta bildirimleri"
        value={profile.notification_settings.email}
        onValueChange={(email) => setProfile((prev) => ({ ...prev, notification_settings: { ...prev.notification_settings, email } }))}
      />
      <NotificationSwitch
        label="SMS bildirimleri"
        value={profile.notification_settings.sms}
        onValueChange={(sms) => setProfile((prev) => ({ ...prev, notification_settings: { ...prev.notification_settings, sms } }))}
      />

      <Pressable style={styles.primaryButton} onPress={save}>
        <Text style={styles.primaryButtonText}>Profili Kaydet</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.secondaryButtonText}>Çıkış Yap</Text>
      </Pressable>
    </ScreenShell>
  )
}

function NotificationSwitch({
  label,
  value,
  onValueChange
}: {
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12
  },
  switchRow: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  switchLabel: { fontSize: 16, color: "#192126" },
  primaryButton: {
    backgroundColor: "#13232f",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6
  },
  primaryButtonText: { color: "#fff7ed", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#efe6d6",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12
  },
  secondaryButtonText: { color: "#5f3c16", fontWeight: "700" }
})
