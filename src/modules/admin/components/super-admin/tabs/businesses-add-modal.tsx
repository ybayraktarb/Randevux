"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Loader2, X, Plus, Building2, UserCircle, Settings2, PackageCheck, FileText, CheckCircle2, Search
} from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxInput, RxTextarea } from "@/src/modules/core/components/rx-input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { atomicOnboardAction } from "@/src/modules/business/actions/business.actions"

interface Module {
    id: string
    display_name: string
}

export function BusinessesAddModal({ modulesList, onSuccess }: { modulesList: Module[], onSuccess: () => void }) {
    const supabase = createClient()
    const [open, setOpen] = useState(false)
    const [packages, setPackages] = useState<any[]>([])
    const [currentStep, setCurrentStep] = useState(1)

    // Form State
    const [newBiz, setNewBiz] = useState({
        name: "", city: "", phone: "", moduleId: "", packageId: "", description: "",
        ownerId: "", onboardingStatus: "live",
    })

    // Search State
    const [ownerSearchQuery, setOwnerSearchQuery] = useState("")
    const [ownerSearchResults, setOwnerSearchResults] = useState<any[]>([])
    const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false)
    const [selectedOwner, setSelectedOwner] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // New Owner State
    const [isNewOwner, setIsNewOwner] = useState(false)
    const [newOwnerData, setNewOwnerData] = useState({ name: "", email: "", password: "" })

    // Fetch Packages
    useEffect(() => {
        if (!open) return
        supabase.from("packages").select("id, name, price_monthly").eq("is_active", true).order("price_monthly")
            .then(({ data }) => { if (data) setPackages(data) })
    }, [open])

    // Owner search debounce
    useEffect(() => {
        if (ownerSearchQuery.length < 2) { setOwnerSearchResults([]); return }
        const t = setTimeout(async () => {
            const { data } = await supabase.from("users")
                .select("id, name, email")
                .ilike("name", `%${ownerSearchQuery}%`)
                .limit(5)
            if (data) setOwnerSearchResults(data)
        }, 300)
        return () => clearTimeout(t)
    }, [ownerSearchQuery])

    async function handleAddBusiness() {
        if (!newBiz.name || !newBiz.moduleId || !newBiz.packageId) {
            toast.error("Lütfen yıldızlı (*) zorunlu alanları doldurun.")
            return
        }

        if (isNewOwner) {
            if (!newOwnerData.name || !newOwnerData.email || !newOwnerData.password) {
                 toast.error("Lütfen yeni patron için gerekli tüm alanları doldurun.")
                 return
            }
        } else if (!newBiz.ownerId) {
            toast.error("Lütfen mevcut bir patron seçin veya yeni oluşturun.")
            return
        }

        setIsSubmitting(true)
        try {
            // 1. Unified Server Action Call
            const payload = {
                isNewOwner,
                ownerId: isNewOwner ? undefined : newBiz.ownerId,
                newOwnerData: isNewOwner ? newOwnerData : undefined,
                businessData: {
                    name: newBiz.name,
                    moduleId: newBiz.moduleId,
                    packageId: newBiz.packageId,
                    city: newBiz.city,
                    phone: newBiz.phone,
                    description: newBiz.description,
                    onboardingStatus: newBiz.onboardingStatus,
                }
            }

            const result = await atomicOnboardAction(payload)

            if (!result.success) {
                throw new Error(result.error?.message || "Onboarding başarısız.")
            }

            toast.success("İşletme başarıyla oluşturuldu!")
            
            // Temizlik
            setOpen(false)
            setNewBiz({ name: "", city: "", phone: "", moduleId: "", packageId: "", description: "", ownerId: "", onboardingStatus: "live" })
            setNewOwnerData({ name: "", email: "", password: "" })
            setIsNewOwner(false)
            setSelectedOwner(null)
            setCurrentStep(1)
            onSuccess()

        } catch (err: any) {
            toast.error(err.message || "Bilinmeyen bir hata oluştu.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <button type="button" onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow active:scale-95">
                <Plus className="size-4" />
                Yeni İşletme Ekle
            </button>

            <RxModal open={open} onClose={() => !isSubmitting && setOpen(false)} title="Yeni İşletme Kurulumu (Onboarding)" className="max-w-[750px]"
                footer={
                    <div className="flex w-full items-center justify-between">
                        <RxButton variant="ghost" onClick={() => { setOpen(false); setCurrentStep(1); }} disabled={isSubmitting}>İptal</RxButton>
                        <div className="flex items-center gap-2">
                            {currentStep > 1 && (
                                <RxButton variant="ghost" className="border border-border" onClick={() => setCurrentStep(p => p - 1)} disabled={isSubmitting}>Geri</RxButton>
                            )}
                            {currentStep < 3 ? (
                                <RxButton onClick={() => {
                                    if (currentStep === 1) {
                                        if (!newBiz.name || !newBiz.moduleId) {
                                            toast.error("Lütfen işletme adını ve sektörünü belirtin."); return;
                                        }
                                    }
                                    if (currentStep === 2) {
                                        if (!newBiz.packageId) {
                                            toast.error("Lütfen abonelik paketi seçin."); return;
                                        }
                                        if (isNewOwner && (!newOwnerData.name || !newOwnerData.email || !newOwnerData.password)) {
                                            toast.error("Yeni patron hesabı için gerekli alanları doldurun."); return;
                                        }
                                        if (!isNewOwner && !newBiz.ownerId) {
                                            toast.error("Lütfen mevcut patronu seçin."); return;
                                        }
                                    }
                                    setCurrentStep(p => p + 1)
                                }}>
                                    İleri
                                </RxButton>
                            ) : (
                                <RxButton onClick={handleAddBusiness} disabled={isSubmitting} className="min-w-[120px]">
                                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "İşletmeyi Kur"}
                                </RxButton>
                            )}
                        </div>
                    </div>
                }
            >
                {/* Stepper UI */}
                <div className="mb-8 mt-2 px-4">
                    <div className="relative flex items-center justify-between w-full">
                        {/* Connecting Line (Background) */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded-full" />
                        {/* Connecting Line (Active Progress) */}
                        <div className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
                             style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }} />

                        {[
                            { step: 1, label: "İşletme Kimliği" },
                            { step: 2, label: "Ticari Ayarlar" },
                            { step: 3, label: "Özet ve Onay" }
                        ].map((s) => (
                            <div key={s.step} className="flex flex-col items-center gap-2 bg-card px-2">
                                <div className={cn(
                                    "flex size-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                                    currentStep > s.step ? "bg-primary text-primary-foreground shadow-md scale-105" :
                                    currentStep === s.step ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110" :
                                    "bg-card border-2 border-border text-muted-foreground"
                                )}>
                                    {currentStep > s.step ? <CheckCircle2 className="size-5" /> : s.step}
                                </div>
                                <span className={cn(
                                    "text-xs font-semibold whitespace-nowrap",
                                    currentStep >= s.step ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {currentStep === 1 && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* --- ADIM 1 (KİMLİK BİLGİLERİ) --- */}
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Building2 className="size-4" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">İşletme Kimliği</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RxInput label="İşletme Adı (*)" placeholder="Örn: Elegance Güzellik Merkezi" 
                                value={newBiz.name} onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })} />

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-foreground">Sektör / Modül (*)</label>
                                <select value={newBiz.moduleId} onChange={(e) => setNewBiz({ ...newBiz, moduleId: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                                    <option value="" disabled>Lütfen Modül Seçin</option>
                                    {modulesList.map((m) => (
                                        <option key={m.id} value={m.id}>{m.display_name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground ml-1">İşletme ilk kurulduğunda bu sektörün varsayılan değerleri otomatik yüklenecektir.</p>
                            </div>

                            <RxInput label="Telefon" placeholder="+90 555..." 
                                value={newBiz.phone} onChange={(e) => setNewBiz({ ...newBiz, phone: e.target.value })} />
                            <RxInput label="Şehir/İlçe" placeholder="Örn: Beşiktaş" 
                                value={newBiz.city} onChange={(e) => setNewBiz({ ...newBiz, city: e.target.value })} />
                        </div>

                        <RxTextarea label="Kısa Açıklama (Opsiyonel)" placeholder="İşletmeye dair yönetici notları..." 
                            value={newBiz.description} onChange={(e) => setNewBiz({ ...newBiz, description: e.target.value })} 
                            className="resize-none h-20" />
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* --- ADIM 2 (TİCARİ AYARLAR) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Sol: Patron Seçimi */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 border-b border-border pb-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                        <UserCircle className="size-4" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-foreground">Sistem Sahibi (Patron)</h4>
                                </div>

                                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewOwner(false)}
                                        className={cn(
                                            "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                                            !isNewOwner
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        Kayıtlı Patron Seç
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewOwner(true)}
                                        className={cn(
                                            "flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
                                            isNewOwner
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        Yeni Patron Hesap
                                    </button>
                                </div>
                                
                                {!isNewOwner ? (
                                    <div className="flex flex-col gap-1.5 relative w-full pt-1">
                                        <label className="text-[13px] font-semibold text-foreground">Kayıtlı Kullanıcı Seç (*)</label>
                                        <div className={cn(
                                            "flex items-center w-full min-h-10 border rounded-lg px-3 bg-card cursor-text transition-colors",
                                            selectedOwner ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-input"
                                        )} onClick={() => !selectedOwner && setIsOwnerDropdownOpen(true)}>
                                            {selectedOwner ? (
                                                <div className="flex items-center justify-between w-full py-1.5">
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="text-sm font-semibold text-foreground">{selectedOwner.name}</span>
                                                        <span className="text-[11px] text-muted-foreground font-mono mt-0.5">{selectedOwner.email}</span>
                                                    </div>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedOwner(null); setNewBiz({ ...newBiz, ownerId: "" }) }}
                                                            className="p-1 hover:bg-destructive/10 rounded-md group">
                                                        <X className="size-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <input type="text" placeholder="İsim ile abone arayın..." 
                                                    className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground py-2"
                                                    value={ownerSearchQuery} onChange={(e) => setOwnerSearchQuery(e.target.value)} onFocus={() => setIsOwnerDropdownOpen(true)} />
                                            )}
                                        </div>
                                        {isOwnerDropdownOpen && !selectedOwner && (
                                            <div className="absolute top-[4.5rem] left-0 w-full z-10 bg-card border border-border shadow-xl rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                                                {ownerSearchResults.length > 0 ? (
                                                    ownerSearchResults.map(u => (
                                                        <div key={u.id} className="flex flex-col p-2.5 hover:bg-muted/60 cursor-pointer transition-colors border-b border-border last:border-0"
                                                            onClick={() => { setSelectedOwner(u); setNewBiz({ ...newBiz, ownerId: u.id }); setIsOwnerDropdownOpen(false); setOwnerSearchQuery("") }}>
                                                            <span className="text-sm font-medium text-foreground">{u.name}</span>
                                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
                                                        <Search className="size-4 opacity-50" />
                                                        {ownerSearchQuery.length > 1 ? "Kullanıcı bulunamadı." : "Sistemdeki üyeler arasında arama yapın."}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 pt-2">
                                        <RxInput label="Ad Soyad (*)" placeholder="Örn: Ahmet Yılmaz" 
                                            value={newOwnerData.name} onChange={(e) => setNewOwnerData({ ...newOwnerData, name: e.target.value })} />
                                        <RxInput label="E-posta Adresi (*)" type="email" placeholder="Örn: ahmet@kuafor.com" 
                                            value={newOwnerData.email} onChange={(e) => setNewOwnerData({ ...newOwnerData, email: e.target.value })} />
                                        <RxInput label="Sistem Şifresi (*)" type="password" placeholder="En az 6 karakter" 
                                            value={newOwnerData.password} onChange={(e) => setNewOwnerData({ ...newOwnerData, password: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            {/* Sağ: Abonelik & Pipeline */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 border-b border-border pb-2">
                                    <div className="flex size-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                        <Settings2 className="size-4" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-foreground">Sözleşme Detayı</h4>
                                </div>

                                <div className="flex flex-col gap-1.5 mt-2">
                                    <label className="text-[13px] font-semibold text-foreground">Abonelik Paketi (*)</label>
                                    <select value={newBiz.packageId} onChange={(e) => setNewBiz({ ...newBiz, packageId: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                                        <option value="" disabled>Lütfen Paket Seçin</option>
                                        {packages.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} — ₺{p.price_monthly}/Ay</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1.5 mt-2">
                                    <label className="text-[13px] font-semibold text-foreground">Kurulum Aşaması (Pipeline) (*)</label>
                                    <select value={newBiz.onboardingStatus} onChange={(e) => setNewBiz({ ...newBiz, onboardingStatus: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all">
                                        <option value="contract_pending">📝 Sözleşme Bekliyor</option>
                                        <option value="payment_pending">💳 Ödeme Bekliyor</option>
                                        <option value="setup">⚙️ Kurulum Aşamasında</option>
                                        <option value="live">✅ Canlıda (Aktif)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* --- ADIM 3 (ÖZET) --- */}
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="size-4" />
                            </div>
                            <h4 className="text-sm font-semibold text-foreground">Kurulum Özeti</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/20 p-4">
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">İşletme Adı</span>
                                <span className="text-sm font-semibold text-foreground">{newBiz.name}</span>
                            </div>
                            <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/20 p-4">
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sektör / Modül</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {modulesList.find(m => m.id === newBiz.moduleId)?.display_name || "-"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/20 p-4">
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Patron Bilgisi</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {isNewOwner ? newOwnerData.name + " (Yeni Hesap)" : selectedOwner?.name || "-"}
                                </span>
                                {isNewOwner && <span className="text-xs text-muted-foreground mt-1">{newOwnerData.email}</span>}
                            </div>
                            <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/20 p-4">
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Abonelik & Durum</span>
                                <span className="text-sm font-semibold text-primary">
                                    {packages.find(p => p.id === newBiz.packageId)?.name || "-"}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">{
                                    newBiz.onboardingStatus === 'live' ? "✅ Canlıda" :
                                    newBiz.onboardingStatus === 'setup' ? "⚙️ Kurulum Aşamasında" :
                                    newBiz.onboardingStatus === 'payment_pending' ? "💳 Ödeme Bekliyor" :
                                    "📝 Sözleşme Bekliyor"
                                }</span>
                            </div>
                        </div>

                        {/* Bilgi Kartı */}
                        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 mt-2">
                            <PackageCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                            <div className="flex flex-col gap-1 text-[12px] text-foreground/80 leading-relaxed">
                                <p><strong>⚡ Hızlı Kurulum Modu:</strong> Bu işlem tek adımda işletmeyi oluşturur, patronu atar, seçili paketi yükler ve temel saatleri tanımlar.</p>
                                <p>İleri düzey fiyatlandırma veya kontrat bitiş tarihi atamalarını kurulum sonrası sağ menüden yapabilirsiniz.</p>
                            </div>
                        </div>
                    </div>
                )}
            </RxModal>
        </>
    )
}
