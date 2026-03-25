"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, X, UserCircle2, Sparkles, Check, Zap, Clock, Loader2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxButton } from "@/src/modules/core/components/rx-button"
// New modular action import!
import { createManualAppointmentAction } from "@/src/modules/appointments/actions/appointment.actions"

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

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function handleSubmit() {
    const isCustomerValid = isGuest ? (guestName.trim() !== "" && guestPhone.trim() !== "") : !!selectedCustomer;
    if (!isCustomerValid || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime) return
    setSaving(true)
    try {
      const selectedSvcs = services.filter(s => selectedServices.includes(s.id))

      const result = await createManualAppointmentAction({
        businessId,
        customerId: isGuest ? undefined : selectedCustomer?.id,
        guestName: isGuest ? guestName : undefined,
        guestPhone: isGuest ? guestPhone : undefined,
        staffId: selectedStaff,
        date: selectedDate,
        time: selectedTime,
        services: selectedSvcs.map(s => ({ id: s.id, base_price: Number(s.base_price), base_duration_minutes: s.base_duration_minutes, buffer_time_minutes: 0 }))
      })

      if (!result.success) {
        toast.error(result.error || "Randevu oluşturulamadı")
        return
      }

      toast.success("Randevu eklendi.")
      onAdded()
      onClose()
    } catch (error: any) {
        toast.error(error.message || "Bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  const totalDuration = services
    .filter(s => selectedServices.includes(s.id))
    .reduce((acc, curr) => acc + curr.base_duration_minutes, 0)

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-[750px] rounded-premium bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-10 py-8 border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group">
                <Plus className="size-6 transition-transform group-hover:rotate-90 duration-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Yeni Randevu</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5">MÜŞTERİ KAYDI & PLANLAMA</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 custom-scrollbar">
            {/* Step 1: Customer Selection */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <UserCircle2 className="size-4" /> 01. MÜŞTERİ SEÇİMİ
                </h3>
                <div className="flex items-center p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setIsGuest(false)}
                    className={cn(
                      "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                      !isGuest ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    KAYITLI
                  </button>
                  <button
                    onClick={() => setIsGuest(true)}
                    className={cn(
                      "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                      isGuest ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    MİSAFİR
                  </button>
                </div>
              </div>

              {!isGuest ? (
                <div className="relative">
                  {selectedCustomer ? (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between p-6 rounded-card bg-primary/5 border-2 border-primary/20"
                    >
                      <div className="flex items-center gap-4">
                        <RxAvatar name={selectedCustomer.name} size="md" className="rounded-2xl shadow-lg shadow-primary/10" />
                        <div>
                          <p className="text-base font-black text-gray-900">{selectedCustomer.name}</p>
                          <p className="text-[11px] font-bold text-gray-400">AKTİF MÜŞTERİ</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest"
                      >
                        DEĞİŞTİR
                      </button>
                    </motion.div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Müşteri adını veya telefonunu yazın..."
                        value={searchValue}
                        onChange={(e) => { setSearchValue(e.target.value); setShowDropdown(true) }}
                        onFocus={() => setShowDropdown(true)}
                        className="h-16 w-full rounded-[24px] border-2 border-gray-100 bg-gray-50/30 pl-14 pr-6 text-base font-bold placeholder:text-gray-300 focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
                      />
                      <AnimatePresence>
                        {showDropdown && (searchValue.length > 0 || customers.length > 0) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 z-20 mt-3 p-2 rounded-3xl bg-white shadow-2xl border border-gray-100 max-h-56 overflow-y-auto"
                          >
                            {customers.length === 0 ? (
                              <p className="p-6 text-center text-sm font-bold text-gray-400">Müşteri bulunamadı.</p>
                            ) : (
                              customers.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => { setSelectedCustomer({ id: c.id, name: c.name }); setShowDropdown(false); setSearchValue("") }}
                                  className="flex w-full items-center gap-4 px-6 py-4 rounded-2xl hover:bg-gray-50 transition-colors group"
                                >
                                  <RxAvatar name={c.name} size="sm" className="rounded-xl" />
                                  <div className="flex flex-1 flex-col text-left">
                                    <span className="text-sm font-black text-gray-900">{c.name}</span>
                                    <span className="text-[11px] font-bold text-gray-400">{c.phone}</span>
                                  </div>
                                  <Plus className="size-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">AD SOYAD</span>
                    <input
                      type="text"
                      placeholder="Misafir Adı"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="h-14 w-full rounded-2xl border-2 border-gray-100 bg-white px-6 text-sm font-bold focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">TELEFON</span>
                    <input
                      type="text"
                      placeholder="05XX XXX XX XX"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      className="h-14 w-full rounded-2xl border-2 border-gray-100 bg-white px-6 text-sm font-bold focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Services & Staff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles className="size-4" /> 02. HİZMET SEÇİMİ
                </h3>
                <div className="flex flex-col gap-3 min-h-[300px] max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {services.map((svc) => {
                    const isSelected = selectedServices.includes(svc.id)
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleService(svc.id)}
                        className={cn(
                          "group flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-102"
                            : "border-gray-50 hover:border-gray-100 bg-gray-50/20"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "size-10 rounded-xl flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary text-white" : "bg-white text-gray-300 group-hover:text-primary border border-gray-100"
                          )}>
                            {isSelected ? <Check className="size-4" /> : <Plus className="size-4" />}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-900 tracking-tight">{svc.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{svc.base_duration_minutes} Dakika</p>
                          </div>
                        </div>
                        <p className="text-[14px] font-black text-gray-900">₺{svc.base_price}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap className="size-4" /> 03. UZMAN & TARİH
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">GÖREVLİ PERSONEL</span>
                      <select
                        value={selectedStaff}
                        onChange={(e) => setSelectedStaff(e.target.value)}
                        className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white px-6 font-bold text-sm text-gray-900 focus:border-primary/20 transition-all appearance-none cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.2rem center', backgroundSize: '1.2rem' }}
                      >
                        <option value="">Personel Seçin</option>
                        {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">RANDEVU TARİHİ</span>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white px-6 font-bold text-sm text-gray-900 focus:border-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedStaff && selectedDate && selectedServices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 20 }}
                      className="space-y-6 pt-6 border-t border-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Clock className="size-4" /> 04. SAAT SEÇİMİ
                        </h3>
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                          TOPLAM: {totalDuration} DK
                        </span>
                      </div>
                      <SlotSelector
                        businessId={businessId}
                        staffId={selectedStaff}
                        date={selectedDate}
                        duration={totalDuration}
                        selectedTime={selectedTime}
                        onSelect={setSelectedTime}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-8 border-t border-gray-50 bg-gray-50/30 flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-8 py-4 rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
            >
              VAZGEÇ
            </button>
            <RxButton
              variant="primary"
              onClick={handleSubmit}
              disabled={saving || (isGuest ? (guestName.trim() === "" || guestPhone.trim() === "") : !selectedCustomer) || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime}
              className="flex-1 h-14 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              {saving ? <Loader2 className="size-5 animate-spin mr-2" /> : <CheckCircle className="size-5 mr-3" />}
              <span className="text-[14px] font-black uppercase tracking-widest whitespace-nowrap">
                {saving ? "KAYDEDİLİYOR..." : "RANDEVUYU OLUŞTUR"}
              </span>
            </RxButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
  if(!t) return 0;
  const [h, m] = t.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}
