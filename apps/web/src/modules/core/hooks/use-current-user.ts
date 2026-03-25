"use client"

// DEĞİŞTİRİLDİ — useCurrentUser artık AuthContext'ten geliyor.
// Tüm 15 çağrı noktası değişmeden çalışmaya devam eder.
export { useAuth as useCurrentUser } from "@/contexts/auth-context"

// Tip export'ları geri uyum için korunuyor
export type { UserProfile, AuthState as UseCurrentUserReturn } from "@/contexts/auth-context"
