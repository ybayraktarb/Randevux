import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { Logo, SocialButtons, Divider, FormField, PasswordInput, AuthCard } from "./AuthShared"

export function LoginScreen({ 
  onToggle, 
  onForgotPassword,
  onSocialLogin 
}: { 
  onToggle: () => void, 
  onForgotPassword: () => void,
  onSocialLogin: (p: 'google' | 'apple') => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Lütfen tüm alanları doldurun.")
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "E-posta veya şifre hatalı." : error.message)
        setLoading(false)
      } else if (data.user) {
        // Oturum açıldı. Middleware'in rolümüze göre doğru dashboard'a yönlendirmesini tetikliyoruz.
        window.location.href = "/login"
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || "Bilinmeyen bir hata oluştu.")
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <AuthCard title="Hoş Geldiniz" subtitle="Hesabınıza giriş yaparak devam edin">
        <div className="flex flex-col gap-6">
          <SocialButtons
            onApple={() => onSocialLogin('apple')}
            onGoogle={() => onSocialLogin('google')}
          />

          <Divider>VEYA E-POSTA İLE</Divider>

          <form onSubmit={handleLogin} className="grid gap-4">
            <FormField
              label="E-POSTA ADRESİ"
              icon={Mail}
              placeholder="name@example.com"
              value={email}
              onChange={setEmail}
              disabled={loading}
            />
            <div className="grid gap-2">
              <PasswordInput
                label="ŞİFRE"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                disabled={loading}
              />
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-right text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-hover"
              >
                Şifremi Unuttum
              </button>
            </div>

            <RxButton type="submit" size="lg" className="h-14 font-black tracking-widest" disabled={loading}>
              {loading ? <Loader2 className="size-5 animate-spin" /> : "GİRİŞ YAP"}
            </RxButton>
          </form>

          <p className="text-center text-sm font-bold text-muted-foreground">
            Hesabınız yok mu?{" "}
            <button
              onClick={onToggle}
              className="text-primary hover:text-primary-hover underline underline-offset-4"
            >
              Kayıt Ol
            </button>
          </p>
        </div>
      </AuthCard>
    </motion.div>
  )
}
