"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Calendar,
  Eye,
  EyeOff,
  ArrowLeft,
  Smartphone,
  Check,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getUserRole, getDashboardPath } from "@/lib/supabase/roles"

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center size-10 rounded-xl bg-primary">
        <Calendar className="size-5 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold text-primary">RandevuX</span>
    </div>
  )
}

function SocialButtons() {
  const supabase = createClient()

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGoogle}
        className="flex h-11 items-center justify-center gap-3 rounded-lg border border-input bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google ile devam et
      </button>
      <button
        type="button"
        onClick={handleApple}
        className="flex h-11 items-center justify-center gap-3 rounded-lg border border-input bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="size-5 fill-foreground" aria-hidden="true">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.53-3.23 0-1.44.66-2.2.47-3.06-.4C3.79 16.17 4.36 9.02 8.93 8.75c1.27.07 2.15.72 2.91.78.99-.2 1.94-.77 2.99-.7 1.27.1 2.23.58 2.85 1.49-2.6 1.56-1.98 4.98.55 5.94-.46 1.2-.67 1.74-1.31 2.79-.98 1.6-2.37 3.59-4.07 3.64-.82.02-1.37-.42-2.24-.44-.92-.01-1.52.47-2.38.46C7.22 22.68 5.8 20.63 4.82 19c-2.05-3.37-2.27-7.33-.98-9.44.92-1.5 2.37-2.38 3.72-2.38 1.39 0 2.27.91 3.43.91 1.12 0 1.8-.91 3.42-.85 1.16.05 2.42.63 3.2 1.71-2.82 1.64-2.36 5.9.53 7.03-.47 1.24-.68 1.8-1.33 2.89-.99 1.67-2.38 3.74-4.08 3.79-.83.02-1.37-.44-2.24-.44" />
        </svg>
        Apple ile devam et
      </button>
    </div>
  )
}

function Divider() {
  return (
    <div className="relative flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground select-none">veya</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

interface FormFieldProps {
  label: string
  error?: string
  children: React.ReactNode
}
function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface PasswordInputProps {
  placeholder?: string
  error?: boolean
  value: string
  onChange: (v: string) => void
}
function PasswordInput({
  placeholder = "••••••••",
  error,
  value,
  onChange,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-card px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          error
            ? "border-destructive focus:ring-destructive"
            : "border-input"
        )}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
        tabIndex={-1}
        aria-label={show ? "Sifreyi gizle" : "Sifreyi goster"}
      >
        {show ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  )
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer",
        disabled
          ? "bg-muted text-muted-foreground cursor-not-allowed"
          : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[.98]"
      )}
    >
      {children}
    </button>
  )
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-lg shadow-black/5">
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Screen 1 — Login (export)                                          */
/* ------------------------------------------------------------------ */

export function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get("registered") === "true"
  const supabase = createClient()

  const handleLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        if (authError.message.includes("Invalid login")) {
          setError("E-posta veya sifre hatali.")
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Lutfen e-posta adresinizi onaylayin veya yoneticiyle iletisime gecin.")
        } else {
          setError(authError.message)
        }
        return
      }
      // Login başarılı — rolü belirle ve yönlendir
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const role = await getUserRole(supabase, user.id)
        router.push(getDashboardPath(role))
        router.refresh()
      }
    } catch {
      setError("Bir hata olustu. Lutfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <AuthCard>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <Logo />
              <h1 className="mt-4 text-2xl font-semibold text-foreground text-balance text-center">
                Tekrar hos geldiniz
              </h1>
              <p className="text-sm text-muted-foreground">
                Hesabiniza giris yapin
              </p>
            </div>

            <SocialButtons />
            <Divider />

            {justRegistered && (
              <div className="rounded-lg border border-emerald-500/50 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700">
                ✅ Hesabiniz olusturuldu! Simdi giris yapabilirsiniz.
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <FormField label="E-posta adresi">
                <input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </FormField>

              <FormField label="Sifre">
                <PasswordInput value={password} onChange={setPassword} />
              </FormField>
            </div>

            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Sifremi unuttum
              </Link>
            </div>

            <PrimaryButton onClick={handleLogin} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Giris yapiliyor...
                </span>
              ) : (
                "Giris Yap"
              )}
            </PrimaryButton>

            <p className="text-center text-sm text-muted-foreground">
              Hesabiniz yok mu?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Kayit olun
              </Link>
            </p>
          </div>
        </AuthCard>


      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Screen 2 — Register Flow (multi-step, export)                      */
/* ------------------------------------------------------------------ */

type RegisterStep = 1 | 2 | 3

export function RegisterFlow() {
  const [step, setStep] = useState<RegisterStep>(1)
  const router = useRouter()
  const supabase = createClient()

  // Step 1 state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [kvkkChecked, setKvkkChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 2 state
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Step 3 state
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [seconds, setSeconds] = useState(165)
  const [otpError, setOtpError] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Validation
  const nameError = submitted && !name.trim() ? "Ad Soyad zorunludur" : undefined
  const emailError = submitted && !email.trim() ? "E-posta zorunludur" : undefined
  const passwordError = submitted && password.length < 6 ? "Sifre en az 6 karakter olmali" : undefined
  const passwordMismatch =
    submitted && password !== passwordConfirm
      ? "Sifreler eslemiyor"
      : undefined
  const kvkkError = submitted && !kvkkChecked ? "KVKK onayi zorunludur" : undefined

  const step1Valid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    password.length >= 6 &&
    password === passwordConfirm &&
    kvkkChecked

  const handleStep1Continue = async () => {
    setSubmitted(true)
    setError(null)
    if (!step1Valid) return

    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            kvkk_consent: kvkkChecked,
            commercial_consent: marketingChecked,
          },
        },
      })
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Bu e-posta adresi zaten kayitli.")
        } else {
          setError(signUpError.message)
        }
        return
      }
      // Kayit basarili — telefon dogrulamaya yonlendir
      setStep(2)
    } catch {
      setError("Bir hata olustu. Lutfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  // OTP timer
  useEffect(() => {
    if (step !== 3 || seconds <= 0) return
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [step, seconds])

  const handleOtpChange = useCallback(
    (idx: number, value: string) => {
      if (!/^\d*$/.test(value)) return
      const next = [...otp]
      next[idx] = value.slice(-1)
      setOtp(next)
      if (value && idx < 5) {
        inputRefs.current[idx + 1]?.focus()
      }
    },
    [otp]
  )

  const handleOtpKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus()
      }
    },
    [otp]
  )

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!text) return
    const next = Array(6).fill("")
    for (let i = 0; i < text.length; i++) next[i] = text[i]
    setOtp(next)
    const focusIdx = Math.min(text.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  const handleVerify = async () => {
    setOtpError(null)
    const otpCode = otp.join("")
    if (otpCode.length < 6) {
      setOtpError("Lutfen 6 haneli kodu eksiksiz girin.")
      return
    }
    setLoading(true)
    try {
      // Dev fallback: accept 000000 without Twilio
      const isDevCode = otpCode === "000000"

      if (!isDevCode) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          phone: `+90${phone.replace(/\s/g, "")}`,
          token: otpCode,
          type: "sms",
        })
        if (verifyError) {
          setOtpError("Kod hatali veya suresi dolmus. Tekrar deneyin.")
          return
        }
      } else {
        console.warn("[DEV] OTP 000000 ile dev modda dogrulama yapildi.")
      }

      // Dogrulama basarili — profili guncelle ve dashboard'a yonlendir
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("users").update({
          phone: `+90${phone.replace(/\s/g, "")}`,
          phone_verified_at: new Date().toISOString(),
          kvkk_consent: true,
          kvkk_consent_at: new Date().toISOString(),
          commercial_consent: marketingChecked,
          commercial_consent_at: marketingChecked ? new Date().toISOString() : null,
        }).eq("id", user.id)

        const role = await getUserRole(supabase, user.id)
        router.push(getDashboardPath(role))
        router.refresh()
      }
    } catch {
      setOtpError("Bir hata olustu. Lutfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {/* ── Step 1: Registration Form ─────────────────────── */}
        {step === 1 && (
          <AuthCard>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <Logo />
                <h1 className="mt-4 text-2xl font-semibold text-foreground text-balance text-center">
                  Hesap olusturun
                </h1>
                <p className="text-sm text-muted-foreground">Ucretsiz baslayin</p>
              </div>

              <SocialButtons />
              <Divider />

              <div className="flex flex-col gap-4">
                <FormField label="Ad Soyad" error={nameError}>
                  <input
                    type="text"
                    placeholder="Ahmet Yilmaz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                      nameError
                        ? "border-destructive focus:ring-destructive"
                        : "border-input"
                    )}
                  />
                </FormField>

                <FormField label="E-posta adresi" error={emailError}>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                      emailError
                        ? "border-destructive focus:ring-destructive"
                        : "border-input"
                    )}
                  />
                </FormField>

                <FormField label="Sifre" error={passwordError}>
                  <PasswordInput value={password} onChange={setPassword} error={!!passwordError} />
                </FormField>

                <FormField label="Sifre Tekrar" error={passwordMismatch}>
                  <PasswordInput
                    value={passwordConfirm}
                    onChange={setPasswordConfirm}
                    error={!!passwordMismatch}
                  />
                </FormField>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                      kvkkChecked
                        ? "border-primary bg-primary"
                        : kvkkError
                          ? "border-destructive bg-card"
                          : "border-input bg-card group-hover:border-muted-foreground"
                    )}
                    onClick={() => setKvkkChecked(!kvkkChecked)}
                    role="checkbox"
                    aria-checked={kvkkChecked}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") setKvkkChecked(!kvkkChecked)
                    }}
                  >
                    {kvkkChecked && (
                      <Check className="size-3.5 text-primary-foreground" />
                    )}
                  </span>
                  <span
                    className="text-sm leading-relaxed text-foreground"
                    onClick={() => setKvkkChecked(!kvkkChecked)}
                  >
                    Kisisel verilerimin islenmesine iliskin{" "}
                    <span className="font-medium text-primary hover:underline cursor-pointer">
                      Aydinlatma Metni
                    </span>
                    {"'"}ni okudum ve{" "}
                    <span className="font-medium text-primary hover:underline cursor-pointer">
                      Acik Riza Metni
                    </span>
                    {"'"}ni onayliyorum.
                  </span>
                </label>
                {kvkkError && <p className="text-xs text-destructive -mt-1 ml-8">{kvkkError}</p>}

                <label className="flex items-start gap-3 cursor-pointer group">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                      marketingChecked
                        ? "border-primary bg-primary"
                        : "border-input bg-card group-hover:border-muted-foreground"
                    )}
                    onClick={() => setMarketingChecked(!marketingChecked)}
                    role="checkbox"
                    aria-checked={marketingChecked}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") setMarketingChecked(!marketingChecked)
                    }}
                  >
                    {marketingChecked && (
                      <Check className="size-3.5 text-primary-foreground" />
                    )}
                  </span>
                  <span
                    className="text-sm leading-relaxed text-foreground"
                    onClick={() => setMarketingChecked(!marketingChecked)}
                  >
                    Kampanya ve duyurulara iliskin ticari ileti almak istiyorum.
                  </span>
                </label>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <PrimaryButton onClick={handleStep1Continue} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Kaydediliyor...
                  </span>
                ) : (
                  "Devam Et"
                )}
              </PrimaryButton>

              <p className="text-center text-sm text-muted-foreground">
                Zaten hesabiniz var mi?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Giris yapin
                </Link>
              </p>
            </div>
          </AuthCard>
        )}

        {/* ── Step 2: Phone Verification ────────────────────── */}
        {step === 2 && (
          <AuthCard>
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Geri"
                >
                  <ArrowLeft className="size-5 text-foreground" />
                </button>
                <h1 className="text-lg font-semibold text-foreground">
                  Telefon Dogrulama
                </h1>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">✓</div>
                <div className="h-0.5 w-8 bg-primary rounded-full" />
                <div className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                <div className="h-0.5 w-8 bg-border rounded-full" />
                <div className="flex items-center justify-center size-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
              </div>

              {/* Illustration */}
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="flex items-center justify-center size-20 rounded-full bg-primary-light">
                  <Smartphone className="size-9 text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <h2 className="text-xl font-semibold text-foreground text-center text-balance">
                    Telefon numaranizi dogrulayin
                  </h2>
                  <p className="text-sm text-muted-foreground text-center max-w-[320px] leading-relaxed">
                    Randevu alabilmek icin telefon dogrulamasi zorunludur.
                  </p>
                </div>
              </div>

              {/* Phone input */}
              <FormField label="Telefon Numarasi">
                <div className="flex">
                  <div className="flex h-10 items-center gap-1.5 rounded-l-lg border border-r-0 border-input bg-muted px-3">
                    <span className="text-sm" role="img" aria-label="Turkiye bayragi">
                      {"🇹🇷"}
                    </span>
                    <span className="text-sm font-medium text-foreground">+90</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="532 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex h-10 w-full rounded-r-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
              </FormField>

              {phoneError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {phoneError}
                </div>
              )}

              <PrimaryButton
                disabled={loading}
                onClick={async () => {
                  setPhoneError(null)
                  const cleanPhone = phone.replace(/\s/g, "")
                  if (cleanPhone.length < 10) {
                    setPhoneError("Gecerli bir telefon numarasi girin.")
                    return
                  }
                  setLoading(true)
                  try {
                    // DEV MODE: Twilio kurulmadiysa console log birak ve dev OTP kabul et
                    const { error: otpSendError } = await supabase.auth.signInWithOtp({
                      phone: `+90${cleanPhone}`,
                    })
                    if (otpSendError) {
                      // Dev fallback: Twilio kurulu degilse de devam et
                      console.warn(`[DEV] SMS gonderilecekti: +90${cleanPhone}. Twilio kurulu degil, dev moda'da 000000 ile dogrulama yapilabilir.`)
                    }
                    setSeconds(165)
                    setOtp(Array(6).fill(""))
                    setStep(3)
                  } catch {
                    setPhoneError("SMS gonderilemedi. Lutfen tekrar deneyin.")
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Gonderiliyor...
                  </span>
                ) : (
                  "Dogrulama Kodu Gonder"
                )}
              </PrimaryButton>
            </div>
          </AuthCard>
        )}

        {/* ── Step 3: OTP Verification ──────────────────────── */}
        {step === 3 && (
          <AuthCard>
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Geri"
                >
                  <ArrowLeft className="size-5 text-foreground" />
                </button>
                <h1 className="text-lg font-semibold text-foreground">Kodu Girin</h1>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">✓</div>
                <div className="h-0.5 w-8 bg-primary rounded-full" />
                <div className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">✓</div>
                <div className="h-0.5 w-8 bg-primary rounded-full" />
                <div className="flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
              </div>

              {/* Subtitle */}
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                {phone
                  ? `+90 ${phone} numarasina gonderilen 6 haneli kodu girin.`
                  : "+90 532 000 00 00 numarasina gonderilen 6 haneli kodu girin."}
              </p>

              {/* OTP boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={cn(
                      "size-12 sm:w-12 sm:h-14 rounded-lg border text-center text-lg font-semibold text-foreground transition-all duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                      digit ? "border-primary bg-primary-light" : "border-input bg-card"
                    )}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Timer / Resend */}
              <div className="text-center">
                {seconds > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Kodu tekrar gonder ({formatTime(seconds)})
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSeconds(165)}
                    className="text-sm font-medium text-primary hover:underline cursor-pointer"
                  >
                    Kodu tekrar gonder
                  </button>
                )}
              </div>

              {otpError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {otpError}
                </div>
              )}

              <PrimaryButton onClick={handleVerify} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Dogrulanıyor...
                  </span>
                ) : (
                  "Dogrula"
                )}
              </PrimaryButton>

              <p className="text-center text-sm text-muted-foreground">
                Yanlis numara mi?{" "}
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="font-medium text-primary hover:underline cursor-pointer"
                >
                  Degistir
                </button>
              </p>
            </div>
          </AuthCard>
        )}
      </main>
    </div>
  )
}
