"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Search,
  X,
  CalendarPlus,
  MoreHorizontal,
  Check,
  XIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  CalendarIcon,
  Plus,
  CheckCircle,
  CheckCheck,
  UserX,
  XCircle,
  Loader2,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxInput, RxTextarea } from "./rx-input"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { updateAppointmentStatusAction } from "@/app/actions/appointment.actions"
import { checkoutAppointmentAction } from "@/app/actions/finance.actions"
import { addProductToAppointmentAction } from "@/app/actions/inventory.actions"
import { toast } from "sonner"

type AppointmentStatus = "Bekliyor" | "Onaylandı" | "Tamamlandı" | "İptal" | "Gelmedi"

interface AppointmentSvc {
  name: string
  duration: number
  price: number
}

interface Appointment {
  id: string
  code: string
  customer: string
  phone: string
  email: string
  services: AppointmentSvc[]
  date: string
  dateRaw: string
  time: string
  staff: string
  staffRole: string
  amount: number
  status: AppointmentStatus
  customerNote?: string
  totalDuration: number
  customerId?: string
}

// ─── Status Helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  switch (status) {
    case "Onaylandı": return <RxBadge variant="success">Onaylandı</RxBadge>
    case "Bekliyor": return <RxBadge variant="warning">Bekliyor</RxBadge>
    case "Tamamlandı": return <RxBadge variant="purple">Tamamlandı</RxBadge>
    case "İptal": return <RxBadge variant="gray">İptal Edildi</RxBadge>
    case "Gelmedi": return <RxBadge variant="danger">Gelmedi (No-Show)</RxBadge>
    default: return null
  }
}

// ─── Action Dropdown ────────────────────────────────────────────────────────────

function ActionDropdown({ onAction }: { onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const actions = [
    { key: "detail", label: "Detay Gor" },
    { key: "approve", label: "Onayla" },
    { key: "cancel", label: "Iptal Et" },
    { key: "noshow", label: "No-Show Isaretle" },
  ]

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted" aria-label="Islemler">
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
          {actions.map((a) => (
            <button key={a.key} type="button" onClick={() => { onAction(a.key); setOpen(false) }} className="flex w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary-light">
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tahsilat (Checkout) Modal ──────────────────────────────────────────────────

export function CheckoutModal({ open, onClose, appointment, businessId, onCheckoutSuccess }: { open: boolean; onClose: () => void; appointment: Appointment | null; businessId: string; onCheckoutSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(appointment?.amount.toString() || "0")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit_card" | "transfer" | "other">("credit_card")

  // Ürün Satış State'leri
  const [products, setProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product: any, quantity: number, staffId: string }>>([])
  const [staffList, setStaffList] = useState<{ id: string, name: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (appointment) {
      setAmount(appointment.amount.toString())
      setSelectedProducts([])
      setSearchQuery("")
    }
  }, [appointment])

  // Ürünleri ve personelleri getir
  useEffect(() => {
    if (!open || !businessId) return
    async function fetchData() {
      const { data: pData } = await supabase.from("products").select("id, name, selling_price, stock_quantity").eq("business_id", businessId).eq("is_active", true).gt("stock_quantity", 0)
      setProducts(pData || [])

      const { data: sData } = await supabase.from("staff_business").select("id, user:users(name)").eq("business_id", businessId).eq("is_active", true)
      const mappedStaff = (sData || []).map(s => {
        const u = Array.isArray(s.user) ? s.user[0] : s.user
        return { id: s.id, name: u?.name || "?" }
      })
      setStaffList(mappedStaff)
    }
    fetchData()
  }, [open, businessId, supabase])

  // Sepet tutarını güncelle
  useEffect(() => {
    if (!appointment) return
    const hwTotal = appointment.amount
    const productTotal = selectedProducts.reduce((acc, curr) => acc + (curr.product.selling_price * curr.quantity), 0)
    setAmount((hwTotal + productTotal).toString())
  }, [selectedProducts, appointment])

  if (!open || !appointment) return null

  const handleAddProduct = (p: any) => {
    if (selectedProducts.find(sp => sp.product.id === p.id)) return
    setSelectedProducts([...selectedProducts, { product: p, quantity: 1, staffId: staffList[0]?.id || "" }])
    setSearchQuery("")
  }

  const updateQuantity = (pid: string, val: number) => {
    setSelectedProducts(selectedProducts.map(sp => {
      if (sp.product.id === pid) {
        const maxQ = sp.product.stock_quantity
        const newQ = Math.max(1, Math.min(val, maxQ))
        return { ...sp, quantity: newQ }
      }
      return sp
    }))
  }

  const updateStaff = (pid: string, staffId: string) => {
    setSelectedProducts(selectedProducts.map(sp => sp.product.id === pid ? { ...sp, staffId } : sp))
  }

  const removeProduct = (pid: string) => setSelectedProducts(selectedProducts.filter(sp => sp.product.id !== pid))

  const handleCheckout = async () => {
    if (!appointment || !amount) return
    setLoading(true)

    // 1. Varsa ürünleri sepete / adisyona ekle
    try {
      for (const item of selectedProducts) {
        const res = await addProductToAppointmentAction({
          appointmentId: appointment.id,
          businessId: businessId,
          productId: item.product.id,
          quantity: item.quantity,
          staffBusinessId: item.staffId
        })
        if (!res.success) throw new Error(res.error || "Ürün eklenemedi")
      }
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
      return
    }

    // 2. Tahsilatı bitir
    try {
      const res = await checkoutAppointmentAction({
        appointmentId: appointment.id,
        businessId,
        amount: Number(amount),
        paymentMethod
      })
      if (res.success) {
        toast.success("Ödeme alındı ve randevu tamamlandı.")
        onCheckoutSuccess()
      } else {
        toast.error(res.error || "Ödeme alınamadı")
      }
    } catch (err) {
      toast.error("İşlem sırasında bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedProducts.some(sp => sp.product.id === p.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 sm:p-0">
      <div className="w-full max-w-xl rounded-xl bg-card shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Ödeme Al & Satış (POS)</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Randevu Özeti */}
          <div className="flex flex-col gap-2 rounded-lg bg-primary-light px-4 py-3 border border-primary/20">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-primary">{appointment.customer}</h3>
                <p className="text-xs text-primary/80 mt-1">{appointment.services.map(s => s.name).join(", ")}</p>
              </div>
              <span className="font-bold text-primary">₺{appointment.amount.toLocaleString("tr-TR")}</span>
            </div>
          </div>

          {/* Ürün Arama */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Sepete Ürün Ekle (Opsiyonel)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Stoktan ürün ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              {searchQuery && filteredProducts.length > 0 && (
                <div className="absolute top-11 left-0 right-0 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-10">
                  {filteredProducts.map(p => (
                    <button key={p.id} type="button" onClick={() => handleAddProduct(p)} className="w-full text-left px-4 py-2 hover:bg-muted/50 border-b border-border/50 last:border-0 flex justify-between items-center">
                      <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                      <span className="text-xs font-semibold shrink-0 ml-2">₺{p.selling_price} (Stok: {p.stock_quantity})</span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery && filteredProducts.length === 0 && (
                <div className="absolute top-11 left-0 right-0 p-3 bg-card border border-border rounded-lg shadow-lg z-10 text-center text-sm text-muted-foreground">Ürün bulunamadı veya stokta yok.</div>
              )}
            </div>
          </div>

          {/* Sepet */}
          {selectedProducts.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Adisyona Eklenecekler</h4>
              <div className="flex flex-col gap-3">
                {selectedProducts.map((item) => (
                  <div key={item.product.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-lg border border-border bg-muted/10 relative group">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium truncate pr-6">{item.product.name}</h5>
                      <span className="text-xs text-muted-foreground">Birim: ₺{item.product.selling_price}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <div className="flex flex-col gap-1 w-full sm:w-32">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">Satan Personel (Prim)</span>
                        <select value={item.staffId} onChange={e => updateStaff(item.product.id, e.target.value)} className="h-8 text-xs rounded border border-input bg-card px-2 w-full">
                          {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          {staffList.length === 0 && <option value="">Şube İçi</option>}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1 w-20">
                        <span className="text-[10px] text-muted-foreground">Miktar (Stok: {item.product.stock_quantity})</span>
                        <input type="number" min="1" max={item.product.stock_quantity} value={item.quantity} onChange={e => updateQuantity(item.product.id, parseInt(e.target.value))} className="h-8 text-sm rounded border border-input bg-card px-2 text-center w-full" />
                      </div>
                      <div className="text-right w-16">
                        <span className="text-sm font-semibold text-foreground">₺{(item.product.selling_price * item.quantity).toLocaleString("tr-TR")}</span>
                      </div>
                    </div>

                    <button type="button" onClick={() => removeProduct(item.product.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-foreground">Toplam Fatura:</span>
              <span className="text-2xl font-bold text-success">₺{Number(amount).toLocaleString("tr-TR")}</span>
            </div>

            <label className="mb-2 block text-sm font-medium text-foreground">Nasıl Alınacak?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button type="button" onClick={() => setPaymentMethod("credit_card")} className={cn("rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-center", paymentMethod === "credit_card" ? "border-primary bg-primary-light text-primary" : "border-border text-foreground hover:bg-muted")}>Kredi Kartı</button>
              <button type="button" onClick={() => setPaymentMethod("cash")} className={cn("rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-center", paymentMethod === "cash" ? "border-primary bg-primary-light text-primary" : "border-border text-foreground hover:bg-muted")}>Nakit</button>
              <button type="button" onClick={() => setPaymentMethod("transfer")} className={cn("rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-center", paymentMethod === "transfer" ? "border-primary bg-primary-light text-primary" : "border-border text-foreground hover:bg-muted")}>Havale/EFT</button>
              <button type="button" onClick={() => setPaymentMethod("other")} className={cn("rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-center", paymentMethod === "other" ? "border-primary bg-primary-light text-primary" : "border-border text-foreground hover:bg-muted")}>Diğer</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4 bg-muted/10">
          <RxButton variant="ghost" className="border border-border" onClick={onClose}>İptal</RxButton>
          <RxButton variant="primary" onClick={handleCheckout} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
            {loading ? " İşleniyor..." : " Tahsilatı Tamamla"}
          </RxButton>
        </div>
      </div>
    </div>
  )
}

// ─── Manuel Randevu Ekle Modal ──────────────────────────────────────────────────

export function AddAppointmentModal({ open, onClose, businessId, onAdded }: { open: boolean; onClose: () => void; businessId: string; onAdded: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [searchValue, setSearchValue] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string; base_duration_minutes: number; base_price: number }[]>([])
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([])
  const [selectedStaff, setSelectedStaff] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [saving, setSaving] = useState(false)

  // Guest Customer Logic
  const [isGuest, setIsGuest] = useState(false)
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (!open || !businessId) return
    async function fetchOptions() {
      const { data: svcData } = await supabase
        .from("services")
        .select("id, name, base_duration_minutes, base_price")
        .eq("business_id", businessId)
        .eq("is_active", true)
      setServices(svcData || [])

      const { data: staffData } = await supabase
        .from("staff_business")
        .select("id, user:users(name)")
        .eq("business_id", businessId)
        .eq("is_active", true)
      setStaffList((staffData || []).map((s) => {
        const u = Array.isArray(s.user) ? s.user[0] : s.user
        return { id: s.id, name: u?.name || "?" }
      }))
    }
    fetchOptions()
  }, [open, businessId, supabase])

  useEffect(() => {
    if (!searchValue || !businessId) { setCustomers([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, phone")
        .ilike("name", `%${searchValue}%`)
        .limit(5)
      setCustomers(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, businessId, supabase])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    if (open) { document.addEventListener("keydown", handleEsc); document.body.style.overflow = "hidden" }
    return () => { document.removeEventListener("keydown", handleEsc); document.body.style.overflow = "" }
  }, [open, onClose])

  if (!open) return null

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function handleSubmit() {
    const isCustomerValid = isGuest ? (guestName.trim() !== "" && guestPhone.trim() !== "") : !!selectedCustomer;
    if (!isCustomerValid || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime) return
    setSaving(true)
    try {
      const selectedSvcs = services.filter(s => selectedServices.includes(s.id))

      const { createManualAppointmentAction } = await import("@/app/actions/appointment.actions")
      const result = await createManualAppointmentAction({
        businessId,
        customerId: isGuest ? undefined : selectedCustomer?.id,
        guestName: isGuest ? guestName : undefined,
        guestPhone: isGuest ? guestPhone : undefined,
        staffId: selectedStaff,
        date: selectedDate,
        time: selectedTime,
        services: selectedSvcs.map(s => ({ id: s.id, base_price: Number(s.base_price), base_duration_minutes: s.base_duration_minutes }))
      })

      if (!result.success) {
        toast.error(result.error || "Randevu oluşturulamadı")
        return
      }

      toast.success("Randevu eklendi.")

      onAdded()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const totalDuration = services
    .filter(s => selectedServices.includes(s.id))
    .reduce((acc, curr) => acc + curr.base_duration_minutes, 0)

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={(e) => { if (e.target === overlayRef.current) onClose() }} role="dialog" aria-modal="true" aria-label="Manuel Randevu Ekle">
      <div className="w-full max-w-[650px] rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-50 px-8 py-6 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Manuel Randevu Ekle</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">İşletme Operasyon Paneli</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100 shadow-sm" aria-label="Kapat"><X className="size-5" /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-8 py-8 custom-scrollbar">
          <div className="flex flex-col gap-8">
            {/* Customer Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.15em]">Müşteri Bilgileri</h3>
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
                  <button type="button" onClick={() => setIsGuest(false)} className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", !isGuest ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}>Kayıtlı</button>
                  <button type="button" onClick={() => setIsGuest(true)} className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", isGuest ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}>Misafir</button>
                </div>
              </div>

              {!isGuest ? (
                <div className="relative">
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border-2 border-primary/20">
                      <div className="flex items-center gap-3">
                        <RxAvatar name={selectedCustomer.name} size="sm" className="rounded-xl" />
                        <span className="text-sm font-black text-gray-900">{selectedCustomer.name}</span>
                      </div>
                      <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs font-black text-primary hover:underline">DEĞİŞTİR</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <RxInput
                        icon={<Search className="size-4" />}
                        placeholder="Müşteri ismi veya telefonu..."
                        value={searchValue}
                        onChange={(e) => { setSearchValue(e.target.value); setShowDropdown(true) }}
                        onFocus={() => setShowDropdown(true)}
                        className="rounded-2xl border-2 border-gray-100 h-14 text-base"
                      />
                      {showDropdown && customers.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl max-h-48 overflow-y-auto animate-in slide-in-from-top-2">
                          {customers.map((c) => (
                            <button key={c.id} type="button" onClick={() => { setSelectedCustomer({ id: c.id, name: c.name }); setShowDropdown(false); setSearchValue("") }} className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-gray-50 border-b border-gray-50 last:border-0">
                              <RxAvatar name={c.name} size="sm" className="rounded-lg" />
                              <div className="flex flex-1 flex-col">
                                <span className="text-sm font-black text-gray-900">{c.name}</span>
                                <span className="text-[11px] font-bold text-gray-400">{c.phone}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RxInput placeholder="İsim Soyisim" value={guestName} onChange={e => setGuestName(e.target.value)} className="rounded-2xl border-2 border-gray-100 h-14" />
                  <RxInput placeholder="Telefon (05XX...)" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="rounded-2xl border-2 border-gray-100 h-14" />
                </div>
              )}
            </div>

            {/* Services & Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.15em]">Hizmet Seçimi</h3>
                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {services.map((svc) => {
                    const isSelected = selectedServices.includes(svc.id)
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleService(svc.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                          isSelected ? "border-primary bg-primary/5" : "border-gray-50 hover:border-gray-100 bg-gray-50/30"
                        )}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-gray-900">{svc.name}</p>
                          <p className="text-[10px] font-bold text-gray-400">{svc.base_duration_minutes} dk</p>
                        </div>
                        <p className="text-xs font-black text-gray-900">₺{svc.base_price}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.15em]">Personel & Tarih</h3>
                <div className="space-y-4">
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white px-4 font-bold text-sm text-gray-900 focus:outline-none focus:border-primary transition-all appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                  >
                    <option value="">Personel Seçin</option>
                    {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white px-4 font-bold text-sm text-gray-900 focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 15-Minute Slot Selector Integration */}
            {selectedStaff && selectedDate && selectedServices.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.15em]">Saat Seçimi</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                      Toplam: {totalDuration} dk
                    </span>
                  </div>
                </div>
                <SlotSelector
                  businessId={businessId}
                  staffId={selectedStaff}
                  date={selectedDate}
                  duration={totalDuration}
                  selectedTime={selectedTime}
                  onSelect={setSelectedTime}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-50 px-8 py-6 bg-gray-50/30">
          <RxButton variant="ghost" onClick={onClose} className="rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400">VAZGEÇ</RxButton>
          <RxButton
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || (isGuest ? (guestName.trim() === "" || guestPhone.trim() === "") : !selectedCustomer) || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime}
            className="rounded-2xl font-black text-[11px] uppercase tracking-widest px-10 shadow-xl shadow-primary/20"
          >
            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
            {saving ? "KAYDEDİLİYOR..." : "RANDEVU OLUŞTUR"}
          </RxButton>
        </div>
      </div>
    </div>
  )
}

function SlotSelector({
  businessId,
  staffId,
  date,
  duration,
  selectedTime,
  onSelect
}: {
  businessId: string;
  staffId: string;
  date: string;
  duration: number;
  selectedTime: string;
  onSelect: (t: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<{ time: string, isBusy: boolean, isSelectable: boolean }[]>([])
  const supabase = createClient()

  const generateAndCheckSlots = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch Business Hours for the day of week
      const dateObj = new Date(date)
      const dayOfWeek = dateObj.getDay() // 0 is Sunday, 1 is Monday...

      const { data: hoursData } = await supabase
        .from("business_hours")
        .select("open_time, close_time, is_open")
        .eq("business_id", businessId)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle()

      if (!hoursData?.is_open) {
        setSlots([])
        return
      }

      // 2. Fetch Busy Slots
      const { data: busyData } = await supabase
        .from("appointments")
        .select("start_time, end_time")
        .eq("staff_business_id", staffId)
        .eq("appointment_date", date)
        .neq("status", "İptal")

      const busyRanges = (busyData || []).map(b => ({
        start: timeToMinutes(b.start_time),
        end: timeToMinutes(b.end_time)
      }))

      // 3. Generate 15-min Intervals
      const startMin = timeToMinutes(hoursData.open_time)
      const endMin = timeToMinutes(hoursData.close_time)
      const interval = 15
      const generatedSlots = []

      for (let m = startMin; m < endMin; m += interval) {
        const timeStr = minutesToTime(m)
        const slotEnd = m + duration

        let isBusy = false
        // Check if this specific point is busy
        for (const range of busyRanges) {
          if (m >= range.start && m < range.end) {
            isBusy = true
            break
          }
        }

        // Check if the entire planned duration is selectable
        let isSelectable = true
        if (isBusy || slotEnd > endMin) {
          isSelectable = false
        } else {
          for (const range of busyRanges) {
            // Overlaps if [m, m+duration] intersects [range.start, range.end]
            if (m < range.end && slotEnd > range.start) {
              isSelectable = false
              break
            }
          }
        }

        generatedSlots.push({
          time: timeStr,
          isBusy,
          isSelectable
        })
      }

      setSlots(generatedSlots)
    } finally {
      setLoading(false)
    }
  }, [businessId, staffId, date, duration, supabase])

  useEffect(() => {
    generateAndCheckSlots()
  }, [generateAndCheckSlots])

  if (loading) return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 border-2 border-dashed border-gray-100 rounded-3xl p-8 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-primary col-span-full mx-auto" />
    </div>
  )

  if (slots.length === 0) return (
    <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center">
      <p className="text-sm font-bold text-rose-600">Bu tarihte çalışma saatleri bulunmamaktadır.</p>
    </div>
  )

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar p-2">
      {slots.map(s => (
        <button
          key={s.time}
          type="button"
          disabled={!s.isSelectable}
          onClick={() => onSelect(s.time)}
          className={cn(
            "h-12 flex items-center justify-center rounded-xl text-[11px] font-black transition-all border-2",
            selectedTime === s.time
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
              : s.isSelectable
                ? "bg-white border-gray-100 hover:border-primary text-gray-900"
                : s.isBusy
                  ? "bg-rose-50 border-rose-50 text-rose-300 cursor-not-allowed"
                  : "bg-gray-50 border-gray-50 text-gray-300 cursor-not-allowed"
          )}
        >
          {s.time}
        </button>
      ))}
    </div>
  )
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

// ─── Liste Gorunumu ─────────────────────────────────────────────────────────────

function ListeGorunumu({ appointments, statusCounts, loading, onRefresh, onStatusChange, onDetailView, businessId }: {
  appointments: Appointment[]
  statusCounts: Record<string, number>
  loading: boolean
  onRefresh: () => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onDetailView: (apt: Appointment) => void
  businessId: string
}) {
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus | "all">("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [checkoutApt, setCheckoutApt] = useState<Appointment | null>(null)

  const statusTabs: { key: AppointmentStatus | "all"; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "Bekliyor", label: "Bekliyor" },
    { key: "Onaylandı", label: "Onaylandı" },
    { key: "Tamamlandı", label: "Tamamlandı" },
    { key: "İptal", label: "İptal Edildi" },
    { key: "Gelmedi", label: "Gelmedi" },
  ]

  const filtered = appointments.filter(a => {
    const statusMatch = activeStatus === "all" || a.status === activeStatus
    const searchMatch = !searchQuery || a.customer.toLowerCase().includes(searchQuery.toLowerCase()) || a.services.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return statusMatch && searchMatch
  })

  const allSelected = filtered.length > 0 && filtered.every(a => selectedIds.includes(a.id))
  const toggleAll = () => { if (allSelected) setSelectedIds([]); else setSelectedIds(filtered.map(a => a.id)) }
  const toggleOne = (id: string) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]) }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">Randevular</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{statusCounts.all || 0} randevu bu ay</p>
        </div>
        <RxButton variant="primary" onClick={() => setModalOpen(true)}>
          <CalendarPlus className="size-4" /> Manuel Randevu Ekle
        </RxButton>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-end">
          <div className="w-full lg:w-[300px]">
            <RxInput icon={<Search className="size-4" />} placeholder="Musteri veya hizmet ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Status tabs */}
        <div className="overflow-x-auto border-b border-border px-5">
          <div className="flex items-center gap-0">
            {statusTabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveStatus(tab.key)} className={cn("flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors", activeStatus === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {tab.label}
                <span className={cn("inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold", activeStatus === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{statusCounts[tab.key] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-primary-foreground shadow-lg">
          <span className="text-sm font-medium">{selectedIds.length} randevu secildi</span>
          <RxButton variant="primary" size="sm" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90" onClick={() => { selectedIds.forEach(id => onStatusChange(id, "Onaylandı")); setSelectedIds([]) }}><Check className="size-3.5" /> Onayla</RxButton>
          <RxButton variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => { selectedIds.forEach(id => onStatusChange(id, "İptal")); setSelectedIds([]) }}><XIcon className="size-3.5" /> İptal Et</RxButton>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto rounded-lg p-1 text-primary-foreground/70 transition-colors hover:text-primary-foreground"><X className="size-4" /></button>
        </div>
      )}

      {/* Appointments Table */}
      <div className="overflow-hidden rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" className="size-4 rounded border-border accent-primary" checked={allSelected} onChange={toggleAll} aria-label="Tumunu sec" />
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Musteri</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Hizmet</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">{"Tarih & Saat"}</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Personel</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Tutar</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Durum</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">Randevu bulunamadi</td></tr>
              )}
              {filtered.map((apt) => {
                const isNoShow = apt.status === "Gelmedi"
                const isCancelled = apt.status === "İptal"
                const isPending = apt.status === "Bekliyor"

                return (
                  <tr key={apt.id} className={cn("border-b border-border transition-colors hover:bg-primary-light/50", isNoShow && "bg-badge-red-bg/40", isCancelled && "bg-muted/40")}>
                    <td className="w-10 px-4 py-3">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" checked={selectedIds.includes(apt.id)} onChange={() => toggleOne(apt.id)} aria-label={`${apt.customer} sec`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <RxAvatar name={apt.customer} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{apt.customer}</span>
                          <span className="text-xs text-muted-foreground">{apt.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {apt.services.map((s) => (
                            <span key={s.name} className="inline-flex rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">{s.name}</span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{apt.totalDuration} dk</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{apt.date}</span>
                        <span className="text-[13px] text-muted-foreground">{apt.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RxAvatar name={apt.staff} size="sm" />
                        <span className="text-[13px] text-foreground">{apt.staff}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-sm font-semibold", isCancelled ? "text-muted-foreground line-through" : "text-foreground")}>₺{apt.amount.toLocaleString("tr-TR")}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => onStatusChange(apt.id, "Onaylandı")} className="inline-flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-success/90">
                            <Check className="size-3" /> Onayla
                          </button>
                          <button type="button" onClick={() => onStatusChange(apt.id, "İptal")} className="inline-flex items-center gap-1 rounded-lg border border-destructive px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-badge-red-bg">
                            <XIcon className="size-3" /> Reddet
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {(!isCancelled && !isNoShow && apt.status !== "Tamamlandı") && (
                            <button type="button" onClick={() => setCheckoutApt(apt)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                              Ödeme Al
                            </button>
                          )}
                          <ActionDropdown onAction={(action) => {
                            if (action === "detail") onDetailView(apt)
                            else if (action === "approve") onStatusChange(apt.id, "Onaylandı")
                            else if (action === "cancel") onStatusChange(apt.id, "İptal")
                            else if (action === "noshow") onStatusChange(apt.id, "Gelmedi")
                          }} />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3 sm:flex-row">
          <span className="text-[13px] text-muted-foreground">{filtered.length} randevu gosteriliyor</span>
        </div>
      </div>

      <AddAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} businessId={businessId} onAdded={onRefresh} />
      <CheckoutModal open={!!checkoutApt} onClose={() => setCheckoutApt(null)} appointment={checkoutApt} businessId={businessId} onCheckoutSuccess={() => { onRefresh(); setCheckoutApt(null) }} />
    </div >
  )
}

// ─── Randevu Detayi ─────────────────────────────────────────────────────────────

function RandevuDetayi({ appointment, onBack, onStatusChange, businessId, onRefresh }: { appointment: Appointment; onBack: () => void; onStatusChange: (id: string, status: AppointmentStatus) => void; businessId: string; onRefresh: () => void }) {
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [staffNotes, setStaffNotes] = useState<{ staff: string; date: string; note: string }[]>([])
  const [customerStats, setCustomerStats] = useState({ totalAppointments: 0, totalNoShow: 0, totalSpent: 0 })
  const supabase = createClient()
  const apt = appointment

  useEffect(() => {
    if (!apt.customerId) return
    async function fetchCustomerData() {
      // Customer appointment stats
      const { data: custApts } = await supabase
        .from("appointments")
        .select("id, status, total_price")
        .eq("customer_user_id", apt.customerId!)

      const all = custApts || []
      setCustomerStats({
        totalAppointments: all.length,
        totalNoShow: all.filter(a => a.status === "Gelmedi").length,
        totalSpent: all.filter(a => a.status === "Tamamlandı").reduce((sum, a) => sum + (Number(a.total_price) || 0), 0),
      })

      // Customer notes
      const { data: notes } = await supabase
        .from("customer_notes")
        .select("note, created_at, staff:staff_business(user:users(name))")
        .eq("customer_user_id", apt.customerId!)
        .order("created_at", { ascending: false })
        .limit(5)

      setStaffNotes((notes || []).map(n => {
        const staffRow = Array.isArray(n.staff) ? n.staff[0] : n.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        return {
          staff: staffUser?.name || "?",
          date: new Date(n.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
          note: n.note,
        }
      }))
    }
    fetchCustomerData()
  }, [apt.customerId, supabase])

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-primary">
        <ChevronLeft className="size-3.5" />
        <span>{"Randevular"}</span>
        <span>{"→"}</span>
        <span className="font-medium text-foreground">{"#" + apt.code}</span>
      </button>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-3">
          {/* Randevu Bilgileri */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-foreground">{"#" + apt.code}</span>
                <StatusBadge status={apt.status} />
              </div>
            </div>

            <div className="px-5 py-4">
              {/* Services */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">Hizmetler</h3>
                {apt.services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.duration} dk</span>
                    </div>
                    <span className="text-sm text-foreground">₺{s.price}</span>
                  </div>
                ))}
                <div className="mt-1 border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Toplam</span>
                    <span className="text-sm font-bold text-foreground">₺{apt.amount.toLocaleString("tr-TR")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{"Tahmini Sure: ~" + apt.totalDuration + " dk"}</span>
                </div>
              </div>

              <div className="my-4 h-px bg-border" />

              {/* Date & Staff */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="size-4 text-primary" />
                  <span className="text-sm text-foreground">{apt.dateRaw + " · " + apt.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <RxAvatar name={apt.staff} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{apt.staff}</span>
                    <span className="text-xs text-muted-foreground">{apt.staffRole}</span>
                  </div>
                </div>
              </div>

              {apt.customerNote && (
                <>
                  <div className="my-4 h-px bg-border" />
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Musteri Notu</h3>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <p className="text-[13px] italic text-muted-foreground">{apt.customerNote}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Musteri Bilgileri */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Musteri Bilgileri</h2>
            </div>
            <div className="flex flex-col items-center px-5 py-5">
              <RxAvatar name={apt.customer} size="lg" />
              <span className="mt-2 text-base font-semibold text-foreground">{apt.customer}</span>

              <div className="my-4 h-px w-full bg-border" />

              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><span className="text-sm text-foreground">{apt.phone}</span></div>
                <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><span className="text-sm text-foreground">{apt.email}</span></div>
              </div>

              <div className="my-4 h-px w-full bg-border" />

              <div className="grid w-full grid-cols-3 gap-2">
                <div className="flex flex-col items-center rounded-lg bg-primary-light px-2 py-3">
                  <span className="text-lg font-semibold text-foreground">{customerStats.totalAppointments}</span>
                  <span className="text-[11px] text-muted-foreground">Randevu</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-primary-light px-2 py-3">
                  <span className="text-lg font-semibold text-foreground">{customerStats.totalNoShow}</span>
                  <span className="text-[11px] text-muted-foreground">No-Show</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-primary-light px-2 py-3">
                  <span className="text-lg font-semibold text-foreground">₺{customerStats.totalSpent.toLocaleString("tr-TR")}</span>
                  <span className="text-[11px] text-muted-foreground">Toplam</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dahili Notlar */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Personel Notlari</h2>
            </div>
            <div className="px-5 py-4">
              <p className="mb-4 text-xs italic text-muted-foreground">Bu notlar sadece isletme icinde gorulur.</p>

              {staffNotes.map((note, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3">
                    <RxAvatar name={note.staff} size="sm" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{note.staff}</span>
                        <span className="text-xs text-muted-foreground">{note.date}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground">{note.note}</p>
                    </div>
                  </div>
                  {i < staffNotes.length - 1 && <div className="my-3 h-px bg-border" />}
                </div>
              ))}

              <div className="mt-4 border-t border-border pt-4">
                <RxTextarea placeholder="Bu randevu icin not ekleyin..." className="min-h-[80px]" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <div className="mt-2 flex justify-end">
                  <RxButton variant="primary" size="sm">Not Kaydet</RxButton>
                </div>
              </div>
            </div>
          </div>

          {/* Islemler */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Islemler</h2>
            </div>
            <div className="flex flex-col gap-2.5 px-5 py-4">
              {apt.status === "Bekliyor" && (
                <RxButton variant="primary" className="w-full justify-center" onClick={() => onStatusChange(apt.id, "Onaylandı")}>
                  <CheckCircle className="size-4" /> Randevuyu Onayla
                </RxButton>
              )}
              {apt.status !== "Tamamlandı" && apt.status !== "İptal" && apt.status !== "Gelmedi" && (
                <RxButton variant="primary" className="w-full justify-center" onClick={() => setCheckoutOpen(true)}>
                  <CheckCheck className="size-4" /> Ödeme Al ve Tamamla
                </RxButton>
              )}
              <RxButton variant="ghost" className="w-full justify-center text-accent hover:bg-badge-red-bg hover:text-accent" onClick={() => onStatusChange(apt.id, "Gelmedi")}>
                <UserX className="size-4" /> No-Show İşaretle
              </RxButton>
              <RxButton variant="ghost" className="w-full justify-center text-accent hover:bg-badge-red-bg hover:text-accent" onClick={() => setShowCancelInput(!showCancelInput)}>
                <XCircle className="size-4" /> Randevuyu İptal Et
              </RxButton>

              {showCancelInput && (
                <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border p-3">
                  <RxTextarea placeholder="İptal Nedeni" className="min-h-[70px]" />
                  <div className="flex items-center gap-2">
                    <RxButton variant="danger" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { onStatusChange(apt.id, "İptal"); setShowCancelInput(false) }}>İptal Et</RxButton>
                    <RxButton variant="ghost" size="sm" onClick={() => setShowCancelInput(false)}>Vazgeç</RxButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} appointment={apt} businessId={businessId} onCheckoutSuccess={() => { onRefresh(); setCheckoutOpen(false); onBack() }} />
    </div>
  )
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export function AppointmentManagement() {
  const { user } = useCurrentUser()
  const [tab, setTab] = useState<"list" | "detail">("list")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ all: 0, Bekliyor: 0, Onaylandı: 0, Tamamlandı: 0, İptal: 0, Gelmedi: 0 })

  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    async function fetchBid() {
      const { data } = await supabase.from("business_owners").select("business_id").eq("user_id", user!.id).maybeSingle()
      if (data) setBusinessId(data.business_id)
    }
    fetchBid()
  }, [user, supabase])

  const fetchAppointments = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, total_price, total_duration_minutes, customer_note, customer_user_id, customer:users!appointments_customer_user_id_fkey(id, name, phone, email), services:appointment_services(service:services(name), price_snapshot, duration_snapshot), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .order("appointment_date", { ascending: false })
        .limit(50)

      const mapped: Appointment[] = (data || []).map((a, idx) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptServices = Array.isArray(a.services) ? a.services : []
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        const startParts = String(a.start_time).split(":")
        const endParts = String(a.end_time).split(":")
        const dateObj = new Date(a.appointment_date + "T00:00:00")

        return {
          id: a.id,
          code: `RDV-${String(idx + 1).padStart(4, "0")}`,
          customer: cust?.name || "?",
          phone: cust?.phone || "",
          email: cust?.email || "",
          customerId: cust?.id || a.customer_user_id,
          services: aptServices.map(as => {
            const svc = Array.isArray(as.service) ? as.service[0] : as.service
            return { name: svc?.name || "?", duration: as.duration_snapshot || 0, price: Number(as.price_snapshot) || 0 }
          }),
          date: dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
          dateRaw: dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }),
          time: `${startParts[0]?.padStart(2, "0")}:${startParts[1]?.padStart(2, "0")} - ${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
          staff: staffUser?.name || "?",
          staffRole: "",
          amount: Number(a.total_price) || 0,
          status: a.status as AppointmentStatus,
          customerNote: a.customer_note || undefined,
          totalDuration: a.total_duration_minutes || 0,
        }
      })

      setAppointments(mapped)

      // Count statuses
      const counts: Record<string, number> = { all: mapped.length, Bekliyor: 0, Onaylandı: 0, Tamamlandı: 0, İptal: 0, Gelmedi: 0 }
      mapped.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
      setStatusCounts(counts)
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    // Optimistic update
    const previousAppointments = appointments
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))

    try {
      const res = await updateAppointmentStatusAction(id, status as any, businessId!)
      if (!res.success) {
        setAppointments(previousAppointments)
        toast.error(res.error || "Hata oluştu.")
      } else {
        fetchAppointments()
      }
    } catch (err) {
      setAppointments(previousAppointments)
      toast.error("İşlem başarısız.")
    }
  }

  const handleDetailView = (apt: Appointment) => {
    setSelectedAppointment(apt)
    setTab("detail")
  }

  const tabs = [
    { key: "list" as const, label: "Liste Gorunumu" },
    { key: "detail" as const, label: "Randevu Detayi" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-0 border-b border-border">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("border-b-2 px-5 py-3 text-sm font-medium transition-colors", tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        <ListeGorunumu
          appointments={appointments}
          statusCounts={statusCounts}
          loading={loading}
          onRefresh={fetchAppointments}
          onStatusChange={handleStatusChange}
          onDetailView={handleDetailView}
          businessId={businessId || ""}
        />
      ) : (
        selectedAppointment && <RandevuDetayi appointment={selectedAppointment} onBack={() => setTab("list")} onStatusChange={handleStatusChange} businessId={businessId || ""} onRefresh={fetchAppointments} />
      )}
    </div>
  )
}
