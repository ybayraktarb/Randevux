"use client"

import { useState } from "react"
import { Calendar, Loader2, ArrowLeft, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
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

/* ── Page Component ── */

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)
    const supabase = createClient()

    const handleReset = async () => {
        setError(null)
        if (!email.trim()) {
            setError("E-posta adresi zorunludur.")
            return
        }
        setLoading(true)
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + "/reset-password",
            })
            if (resetError) {
                setError(resetError.message)
                return
            }
            setSent(true)
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
                                Sifremi Unuttum
                            </h1>
                            <p className="text-sm text-muted-foreground text-center">
                                E-posta adresinize sifre sifirlama linki gonderecegiz
                            </p>
                        </div>

                        {sent ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="flex items-center justify-center size-16 rounded-full bg-emerald-100">
                                    <Mail className="size-8 text-emerald-600" />
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <h2 className="text-lg font-semibold text-foreground">E-postanizi kontrol edin</h2>
                                    <p className="text-sm text-muted-foreground text-center max-w-[320px] leading-relaxed">
                                        <strong className="text-foreground">{email}</strong> adresine sifre sifirlama linki gonderdik.
                                        Gelen kutunuzu kontrol edin.
                                    </p>
                                </div>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                >
                                    <ArrowLeft className="size-4" />
                                    Giris sayfasina don
                                </Link>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}

                                <FormField label="E-posta adresi">
                                    <input
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                    />
                                </FormField>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleReset}
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
                                            Gonderiliyor...
                                        </span>
                                    ) : (
                                        "Sifirlama Linki Gonder"
                                    )}
                                </button>

                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
                                >
                                    <ArrowLeft className="size-4" />
                                    Giris sayfasina don
                                </Link>
                            </>
                        )}
                    </div>
                </AuthCard>
            </main>
        </div>
    )
}
