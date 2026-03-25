import { useState } from "react"
import { Link } from "expo-router"
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { ScreenShell } from "@/src/components/screen-shell"
import { supabase } from "@/src/lib/supabase"

type Mode = "login" | "register" | "forgot-password" | "reset-password"

export function AuthScreen({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const submit = async () => {
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) Alert.alert("Giriş yapılamadı", error.message)
      return
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      })
      if (error) Alert.alert("Kayıt oluşturulamadı", error.message)
      return
    }

    if (mode === "forgot-password") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "randevux://reset-password"
      })
      if (error) Alert.alert("İşlem başarısız", error.message)
      else Alert.alert("Mail gönderildi", "Şifre sıfırlama bağlantısı gönderildi.")
      return
    }

    Alert.alert("Bilgi", "Şifre yenileme oturumu deep link ile tamamlanacak.")
  }

  const titles: Record<Mode, { title: string; subtitle: string; cta: string }> = {
    login: { title: "Hoş geldiniz", subtitle: "Müşteri hesabınızla giriş yapın.", cta: "Giriş Yap" },
    register: { title: "Hesap oluştur", subtitle: "Mobil müşteri deneyimi için yeni hesap oluşturun.", cta: "Kayıt Ol" },
    "forgot-password": { title: "Şifre sıfırla", subtitle: "Bağlantıyı e-posta adresinize gönderelim.", cta: "Mail Gönder" },
    "reset-password": { title: "Yeni şifre", subtitle: "Deep link dönüşünde yeni şifre akışını tamamlayın.", cta: "Bilgiyi Gör" }
  }

  const content = titles[mode]

  return (
    <ScreenShell title={content.title} subtitle={content.subtitle}>
      <View style={styles.form}>
        {mode === "register" ? (
          <TextInput style={styles.input} placeholder="Ad Soyad" value={name} onChangeText={setName} />
        ) : null}
        {mode !== "reset-password" ? (
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        ) : null}
        {mode === "login" || mode === "register" ? (
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        ) : null}
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>{content.cta}</Text>
        </Pressable>
        {mode === "login" ? (
          <View style={styles.links}>
            <Link href="/(auth)/register">Kayıt ol</Link>
            <Link href="/(auth)/forgot-password">Şifremi unuttum</Link>
          </View>
        ) : null}
      </View>
    </ScreenShell>
  )
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d8d5cc",
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  button: {
    backgroundColor: "#13232f",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center"
  },
  buttonText: { color: "#fff7ed", fontSize: 16, fontWeight: "700" },
  links: { flexDirection: "row", justifyContent: "space-between" }
})
