import type { PropsWithChildren } from "react"
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native"

export function ScreenShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5efe6" },
  content: { padding: 20, gap: 16 },
  header: { gap: 8, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: "800", color: "#192126" },
  subtitle: { fontSize: 15, lineHeight: 22, color: "#53636d" }
})
