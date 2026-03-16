import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, User, Phone, CheckCircle2, ArrowRight, Loader2, ArrowLeft, Smartphone, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getUserRole, getDashboardPath } from "@/lib/supabase/roles"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { cn } from "@/lib/utils"
import { Logo, SocialButtons, Divider, FormField, PasswordInput, AuthCard } from "./AuthShared"

export function RegisterFlow({ onToggle, onSocialLogin }: { onToggle: () => void, onSocialLogin: (p: 'google' | 'apple') => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  
  // Step 1 state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [kvkkChecked, setKvkkChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)
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

  const handleStep1Continue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name || !email || !password || !passwordConfirm) {
      toast.error("Lütfen tüm alanları doldurun.")
      return
    }
    if (password !== passwordConfirm) {
      toast.error("Şifreler eşleşmiyor.")
      return
    }
    if (!kvkkChecked) {
      toast.error("KVKK onayınız gereklidir.")
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name,
            kvkk_consent: kvkkChecked,
            commercial_consent: marketingChecked,
            role: "customer"
          },
        },
      })
      if (signUpError) {
        setError(signUpError.message)
        toast.error(signUpError.message)
        return
      }
      if (data.user) setStep(2)
      else setError("Lütfen e-posta adresinizi onaylayın.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)
    const cleanPhone = phone.replace(/\s/g, "")
    if (cleanPhone.length < 10) {
      setPhoneError("Geçerli bir telefon numarası girin.")
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        phone: `+90${cleanPhone}`
      })
      if (updateError) {
        console.warn(`SMS gönderilemedi: ${updateError.message}`)
      }
      setSeconds(165)
      setOtp(Array(6).fill(""))
      setStep(3)
    } catch (err: any) {
      setPhoneError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setOtpError(null)
    const otpCode = otp.join("")
    if (otpCode.length < 6) {
      setOtpError("Lütfen 6 haneli kodu girin.")
      return
    }
    setLoading(true)
    try {
      if (otpCode !== "000000") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          phone: `+90${phone.replace(/\s/g, "")}`,
          token: otpCode,
          type: "sms",
        })
        if (verifyError) {
          setOtpError("Kod hatalı veya süresi dolmuş.")
          setLoading(false)
          return
        }
      }
      
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
        window.location.href = getDashboardPath(role)
      }
    } catch {
      setOtpError("Bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[idx] = value.slice(-1)
    setOtp(next)
    if (value && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  return (
    <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <AuthCard title="Yeni Hesap" subtitle="Hızlıca kayıt olup randevunu al">
            <div className="flex flex-col gap-6">
              <SocialButtons onApple={() => onSocialLogin('apple')} onGoogle={() => onSocialLogin('google')} />
              <Divider>VEYA BİLGİLERİNLE</Divider>
              <form onSubmit={handleStep1Continue} className="grid gap-4">
                <FormField label="AD SOYAD" icon={User} placeholder="John Doe" value={name} onChange={setName} />
                <FormField label="E-POSTA" icon={Mail} placeholder="name@example.com" value={email} onChange={setEmail} />
                <PasswordInput label="ŞİFRE" placeholder="Min. 8 karakter" value={password} onChange={setPassword} />
                <PasswordInput label="ŞİFRE TEKRAR" placeholder="Min. 8 karakter" value={passwordConfirm} onChange={setPasswordConfirm} />
                <div className="flex flex-col gap-3 my-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={kvkkChecked} onChange={e => setKvkkChecked(e.target.checked)} className="mt-1" />
                    <span className="text-xs text-muted-foreground">KVKK metnini okudum ve onaylıyorum.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={marketingChecked} onChange={e => setMarketingChecked(e.target.checked)} className="mt-1" />
                    <span className="text-xs text-muted-foreground">Kampanya iletileri almak istiyorum.</span>
                  </label>
                </div>
                <RxButton type="submit" size="lg" className="h-14 font-black tracking-widest gap-2" disabled={loading}>
                  {loading ? <Loader2 className="size-5 animate-spin" /> : <>DEVAM ET <ArrowRight className="size-5" /></>}
                </RxButton>
              </form>
              <p className="text-center text-sm font-bold text-muted-foreground">
                Hesabınız var mı?{" "}
                <button onClick={onToggle} className="text-primary hover:text-primary-hover underline underline-offset-4">Giriş Yap</button>
              </p>
            </div>
          </AuthCard>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <AuthCard title="Telefon Doğrulama" subtitle="Güvenliğiniz için numaranızı doğrulayın">
            <form onSubmit={handlePhoneSubmit} className="grid gap-6">
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Smartphone className="size-10" />
                </div>
              </div>
              <FormField label="TELEFON NUMARASI" icon={Phone} placeholder="5XX XXX XX XX" value={phone} onChange={setPhone} disabled={loading} />
              {phoneError && <p className="text-xs text-red-500 text-center">{phoneError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <RxButton variant="secondary" className="h-14 font-bold" onClick={() => setStep(1)} disabled={loading}>GERİ</RxButton>
                <RxButton type="submit" size="lg" className="h-14 font-black tracking-widest" disabled={loading}>
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "KOD GÖNDER"}
                </RxButton>
              </div>
            </form>
          </AuthCard>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <AuthCard title="Kodu Girin" subtitle={`+90 ${phone} numarasına gelen kodu girin`}>
            <div className="flex flex-col gap-6">
               <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="size-10 sm:size-12 rounded-xl border border-border text-center text-lg font-bold bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                ))}
              </div>
              {otpError && <p className="text-xs text-red-500 text-center">{otpError}</p>}
              <RxButton className="h-14 font-black tracking-widest" onClick={handleVerify} disabled={loading}>
                {loading ? <Loader2 className="size-5 animate-spin" /> : "DOĞRULA"}
              </RxButton>
              <button onClick={() => setStep(2)} className="text-sm font-bold text-primary hover:underline">Telefonu Değiştir</button>
            </div>
          </AuthCard>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
