"use client"

import { useState, useEffect } from "react"
import { Calendar, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/* ── Shared sub-components (same design language as auth-screens) ── */

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

function AuthCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-lg shadow-black/5">
            {children}
        </div>
    )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}

function PasswordInput({
    placeholder = "••••••••",
    error,
    value,
    onChange,
}: {
    placeholder?: string
    error?: boolean
    value: string
    onChange: (v: string) => void
}) {
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
                    error ? "border-destructive focus:ring-destructive" : "border-input"
                )}
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                tabIndex={-1}
                aria-label={show ? "Sifreyi gizle" : "Sifreyi goster"}
            >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    )
}

/* ── Page Component ── */

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // Supabase will auto-detect the recovery token from the URL hash
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                // User arrived via password reset link — ready to set new password
            }
        })
        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const passwordError = submitted && password.length < 6 ? "Sifre en az 6 karakter olmali" : undefined
    const mismatchError = submitted && password !== passwordConfirm ? "Sifreler eslemiyor" : undefined

    const handleUpdate = async () => {
        setSubmitted(true)
        setError(null)
        if (password.length < 6 || password !== passwordConfirm) return

        setLoading(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            })
            if (updateError) {
                setError(updateError.message)
                return
            }
            setSuccess(true)
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login")
            }, 3000)
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
                                Yeni Sifre Belirleyin
                            </h1>
                            <p className="text-sm text-muted-foreground text-center">
                                Hesabiniz icin yeni bir sifre olusturun
                            </p>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="flex items-center justify-center size-16 rounded-full bg-emerald-100">
                                    <CheckCircle2 className="size-8 text-emerald-600" />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <h2 className="text-lg font-semibold text-foreground">Sifreniz guncellendi!</h2>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Giris sayfasina yonlendiriliyorsunuz...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col gap-4">
                                    <FormField label="Yeni Sifre" error={passwordError}>
                                        <PasswordInput
                                            value={password}
                                            onChange={setPassword}
                                            error={!!passwordError}
                                        />
                                    </FormField>

                                    <FormField label="Sifre Tekrar" error={mismatchError}>
                                        <PasswordInput
                                            value={passwordConfirm}
                                            onChange={setPasswordConfirm}
                                            error={!!mismatchError}
                                        />
                                    </FormField>
                                </div>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleUpdate}
                                    className={cn(
                                        "flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer",
                                        loading
                                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                                            : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[.98]"
                                    )}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            Guncelleniyor...
                                        </span>
                                    ) : (
                                        "Sifreyi Guncelle"
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </AuthCard>
            </main>
        </div>
    )
}
