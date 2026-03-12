"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Store, 
  User, 
  Briefcase, 
  CreditCard,
  Loader2,
  Calendar,
  Globe,
  Smartphone,
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

import { RxInput } from "./rx-input"
import { RxButton } from "./rx-button"

/* ------------------------------------------------------------------ */
/*  UI Components                                                      */
/* ------------------------------------------------------------------ */

function StepIndicator({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) {
  const steps = [
    { id: 1, name: "Kimlik", icon: User },
    { id: 2, name: "İşletme", icon: Store },
    { id: 3, name: "Üyelik", icon: CreditCard },
    { id: 4, name: "Kurulum", icon: CheckCircle2 },
  ]

  return (
    <div className="relative flex justify-between w-full max-w-md mx-auto mb-12">
      <div className="absolute top-1/2 left-0 w-full h-px bg-border -translate-y-1/2 z-0" />
      <div 
        className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(108,99,255,0.5)]" 
        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
      />
      
      {steps.map((step) => {
        const Icon = step.icon
        const isActive = currentStep >= step.id
        const isCurrent = currentStep === step.id
        
        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
            <div className={cn(
              "flex items-center justify-center size-10 rounded-xl border-2 transition-all duration-500",
              isActive ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-card border-border text-muted-foreground",
              isCurrent && "ring-4 ring-primary/10 scale-110"
            )}>
              {isActive && currentStep > step.id ? <Check className="size-5" /> : <Icon className="size-5" />}
            </div>
            <span className={cn(
              "text-[10px] uppercase tracking-widest font-bold transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {step.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Steps                                                              */
/* ------------------------------------------------------------------ */

export function BusinessOnboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Data from DB
  const [sectors, setSectors] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    sectorId: "",
    packageId: "",
    phone: "",
    metadata: { theme: "light" }
  })

  useEffect(() => {
    async function fetchData() {
      const { data: modData } = await supabase.from('modules').select('*').eq('is_active', true)
      const { data: pkgData } = await supabase.from('packages').select('*').eq('is_active', true).order('price_monthly', { ascending: true })
      
      if (modData) setSectors(modData)
      if (pkgData) setPackages(pkgData)
    }
    fetchData()
  }, [])

  const nextStep = () => setStep(s => Math.min(s + 1, 4))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleOnboard = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { name: formData.name } }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("Kullanıcı oluşturulamadı.")

      // 2. Onboard Business RPC
      const { data: bizId, error: rpcError } = await supabase.rpc('onboard_business', {
        p_owner_user_id: authData.user.id,
        p_business_name: formData.businessName,
        p_sector_id: formData.sectorId,
        p_package_id: formData.packageId,
        p_metadata: formData.metadata
      })

      if (rpcError) throw rpcError

      // Success
      nextStep()
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 min-h-[700px] flex flex-col justify-center">
      <div className="flex flex-col items-center mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center size-12 rounded-2xl bg-primary shadow-[0_0_20px_rgba(108,99,255,0.3)]">
            <Calendar className="size-7 text-primary-foreground" />
          </div>
          <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary-hover to-accent tracking-tighter">RandevuX</span>
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-5xl">Geleceğin Randevu Sistemine Hoş Geldiniz</h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-xl">İşletmenizi dijital dünyaya taşıyacak en güçlü adımı atmak üzeresiniz.</p>
      </div>

      <StepIndicator currentStep={step} totalSteps={4} />

      <div className="flex-1 bg-card/80 border border-border/50 rounded-[2.5rem] p-10 shadow-2xl shadow-primary/5 relative overflow-hidden backdrop-blur-xl transition-all duration-500">
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="size-2 rounded-full bg-destructive animate-pulse" />
            {error}
          </div>
        )}

        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="grid md:grid-cols-2 gap-8">
              <RxInput 
                label="Ad Soyad"
                placeholder="Ahmet Yılmaz"
                icon={<User className="size-4" />}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <RxInput 
                label="E-posta Adresi"
                type="email"
                placeholder="ahmet@isletme.com"
                icon={<Globe className="size-4" />}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <RxInput 
              label="Şifre"
              type="password"
              placeholder="••••••••"
              icon={<User className="size-4" />}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
            
            <div className="pt-8">
              <RxButton 
                onClick={nextStep} 
                disabled={!formData.name || !formData.email || !formData.password} 
                size="lg"
                className="w-full group rounded-2xl"
              >
                Devam Et <ChevronRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </RxButton>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Kaydolarak <span className="text-primary font-medium hover:underline cursor-pointer">Kullanım Koşulları</span>'nı kabul etmiş sayılırsınız.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Business */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <RxInput 
              label="İşletme Adı"
              placeholder="RandevuX Güzellik Salonu"
              icon={<Store className="size-4" />}
              value={formData.businessName}
              onChange={e => setFormData({...formData, businessName: e.target.value})}
            />
            
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-foreground/80 lowercase tracking-wider pl-1">Sektör Seçimi</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sectors.map(sector => (
                  <button 
                    key={sector.id}
                    onClick={() => setFormData({...formData, sectorId: sector.id})}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-300 group relative overflow-hidden",
                      formData.sectorId === sector.id 
                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]" 
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "size-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                      formData.sectorId === sector.id 
                        ? "bg-primary text-primary-foreground rotate-6 scale-110" 
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <Briefcase className="size-7" />
                    </div>
                    <span className="text-sm font-bold text-center leading-tight">{sector.display_name}</span>
                    {formData.sectorId === sector.id && (
                      <div className="absolute top-2 right-2 size-4 bg-primary rounded-full flex items-center justify-center animate-in zoom-in-50">
                        <Check className="size-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-8">
              <RxButton variant="ghost" onClick={prevStep} size="lg" className="flex-1 rounded-2xl">Geri</RxButton>
              <RxButton onClick={nextStep} disabled={!formData.businessName || !formData.sectorId} size="lg" className="flex-[2] group rounded-2xl">
                Paket Seçimine Geç <ChevronRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </RxButton>
            </div>
          </div>
        )}

        {/* Step 3: Package */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <div 
                  key={pkg.id}
                  onClick={() => setFormData({...formData, packageId: pkg.id})}
                  className={cn(
                    "relative flex flex-col p-6 rounded-3xl border-2 transition-all cursor-pointer",
                    formData.packageId === pkg.id 
                      ? "border-primary bg-primary/5 ring-4 ring-primary/5" 
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {pkg.name === 'Profesyonel' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Popüler
                    </div>
                  )}
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold">{pkg.price_monthly}₺</span>
                    <span className="text-muted-foreground text-sm ml-1">/ay</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    <li className="flex items-center text-sm gap-2">
                      <Check className="size-4 text-success" /> <span>{pkg.max_staff} Personel</span>
                    </li>
                    <li className="flex items-center text-sm gap-2">
                      <Check className="size-4 text-success" /> <span>{pkg.max_services} Hizmet</span>
                    </li>
                    <li className="flex items-center text-sm gap-2">
                      <Check className="size-4 text-success" /> <span>Limitli Randevu</span>
                    </li>
                  </ul>
                  <button className={cn(
                    "mt-8 w-full py-3 rounded-xl text-sm font-bold transition-all",
                    formData.packageId === pkg.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-border"
                  )}>
                    {formData.packageId === pkg.id ? 'Seçildi' : 'Seç'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={prevStep} className="rx-button bg-muted text-foreground border-border hover:bg-muted/80 flex-1">Geri</button>
              <button 
                onClick={handleOnboard} 
                disabled={!formData.packageId || loading} 
                className="rx-button flex-[2] bg-primary-hover shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="size-5 animate-spin mx-auto" /> : 'Sistemi Kur ve Başla'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 fade-in duration-700">
            <div className="size-24 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-bounce">
              <Check className="size-12 text-success" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Tebrikler, {formData.businessName}!</h2>
            <p className="text-muted-foreground max-w-sm">İşletmeniz başarıyla oluşturuldu. Sektörünüze özel varsayılan hizmetler eklendi ve sisteminiz kullanıma hazır.</p>
            
            <div className="mt-10 grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Plan</p>
                <p className="font-bold">{packages.find(p => p.id === formData.packageId)?.name}</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Durum</p>
                <p className="font-bold text-success">Aktif</p>
              </div>
            </div>

            <button 
              onClick={() => router.push('/patron')} 
              className="rx-button mt-10 w-full max-w-md group bg-gradient-to-r from-primary to-primary-hover border-none"
            >
              Paneli Keşfet <ArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Zaten bir hesabınız var mı? <Link href="/login" className="text-primary font-bold hover:underline">Giriş Yapın</Link>
      </p>
    </div>
  )
}
