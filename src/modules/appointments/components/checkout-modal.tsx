"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Plus, Sparkles, Zap, Clock, Info, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { FeatureGate } from "@/src/modules/admin/components/feature-gate"
import { RxButton } from "@/src/modules/core/components/rx-button"

// Need to import actions and types
import { checkoutAppointmentAction } from "@/src/modules/finance/actions/finance.actions"
import { addProductToAppointmentAction } from "@/src/modules/inventory/actions/inventory.actions"
import { AppointmentCardProps } from "./appointment-card"

export function CheckoutModal({
  open,
  onClose,
  appointment,
  businessId,
  onCheckoutSuccess
}: {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentCardProps | null;
  businessId: string;
  onCheckoutSuccess: () => void
}) {
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

    try {
      for (const item of selectedProducts) {
        const res = await addProductToAppointmentAction({
          appointmentId: appointment.id,
          businessId: businessId,
          productId: item.product.id,
          quantity: item.quantity,
          staffBusinessId: item.staffId
        })
        if (!res.success) throw new Error((res as any).error || "Ürün eklenemedi")
      }
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
      return
    }

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-xl rounded-[40px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 bg-gray-50/50">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Ödeme & POS</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">RANDEVU KAPATMA</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-white hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
            <div className="p-6 rounded-3xl bg-indigo-600 text-white relative overflow-hidden group">
              <Sparkles className="absolute -right-4 -top-4 size-24 text-white/10 -rotate-12 transition-transform group-hover:rotate-0 duration-700" />
              <div className="relative">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">RANDEVU TUTARI</p>
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <h3 className="text-xl font-black">{appointment.customer}</h3>
                    <p className="text-[12px] font-bold text-white/80">{appointment.services.map(s => s.name).join(", ")}</p>
                  </div>
                  <span className="text-2xl font-black">₺{appointment.amount.toLocaleString("tr-TR")}</span>
                </div>
              </div>
            </div>

            <FeatureGate featureKey="inventory_module" businessId={businessId} minimal>
              <>
                <div className="space-y-3">
                  <label htmlFor="product-search" className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">ÜRÜN EKLE (OPSİYONEL)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      id="product-search"
                      type="text"
                      placeholder="Ürün adı veya barkod..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-14 w-full rounded-2xl border-2 border-gray-50 bg-gray-50/30 pl-12 pr-4 text-[14px] font-bold focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    />

                    <AnimatePresence>
                      {searchQuery && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 z-10 mt-2 p-2 rounded-2xl bg-white shadow-2xl border border-gray-100 max-h-48 overflow-y-auto"
                        >
                          {filteredProducts.length === 0 ? (
                            <p className="p-4 text-center text-[12px] font-bold text-gray-400">Ürün bulunamadı.</p>
                          ) : (
                            filteredProducts.map(p => (
                              <button
                                key={p.id}
                                onClick={() => handleAddProduct(p)}
                                className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                              >
                                <span className="text-[13px] font-black text-gray-900">{p.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">₺{p.selling_price}</span>
                                  <Plus className="size-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">SEPETTEKİ ÜRÜNLER</h4>
                    <div className="space-y-3">
                      {selectedProducts.map((item) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={item.product.id}
                          className="group flex flex-col p-4 rounded-2xl border border-gray-100 bg-white relative"
                        >
                          <button
                            onClick={() => removeProduct(item.product.id)}
                            className="absolute top-4 right-4 p-1 text-gray-300 hover:text-rose-500 transition-colors"
                          >
                            <X className="size-4" />
                          </button>

                          <div className="flex items-start justify-between pr-8">
                            <div>
                              <h5 className="text-[14px] font-black text-gray-900">{item.product.name}</h5>
                              <span className="text-[11px] font-bold text-gray-400">Birim: ₺{item.product.selling_price}</span>
                            </div>
                            <span className="text-[15px] font-black text-gray-900">₺{(item.product.selling_price * item.quantity).toLocaleString("tr-TR")}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SATIŞ PER.</span>
                              <select
                                value={item.staffId}
                                onChange={e => updateStaff(item.product.id, e.target.value)}
                                className="w-full h-10 rounded-xl bg-gray-50 border-none text-[12px] font-bold px-3 focus:ring-2 focus:ring-indigo-500/10"
                              >
                                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                {staffList.length === 0 && <option value="">Şube İçi</option>}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MİKTAR</span>
                              <div className="flex items-center h-10 rounded-xl bg-gray-50 px-2">
                                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1 text-gray-400 hover:text-gray-900">-</button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={e => updateQuantity(item.product.id, Number.parseInt(e.target.value))}
                                  className="w-full bg-transparent border-none text-center text-[12px] font-black focus:ring-0"
                                />
                                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1 text-gray-400 hover:text-gray-900">+</button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            </FeatureGate>

            <div className="pt-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-xl font-black text-gray-900 tracking-tight text-right">Toplam Ödenecek</h4>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right mt-1">HİZMET + ÜRÜN TOPLAMI</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-indigo-600">₺{Number(amount).toLocaleString("tr-TR")}</span>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">ÖDEME YÖNTEMİ</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'credit_card', label: 'Kredi Kartı', icon: <Sparkles className="size-4" /> },
                    { id: 'cash', label: 'Nakit', icon: <Zap className="size-4" /> },
                    { id: 'transfer', label: 'Havale / EFT', icon: <Clock className="size-4" /> },
                    { id: 'other', label: 'Diğer', icon: <Info className="size-4" /> }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                        paymentMethod === m.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-600/5 scale-[1.02]"
                          : "border-gray-50 hover:border-gray-100 bg-white text-gray-400"
                      )}
                    >
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center transition-colors",
                        paymentMethod === m.id ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                      )}>
                        {m.icon}
                      </div>
                      <span className="text-[13px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/50 flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-2xl text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
            >
              İPTAL
            </button>
            <RxButton
              variant="primary"
              onClick={handleCheckout}
              loading={loading}
              disabled={loading || !amount}
              className="flex-1 h-14 rounded-2xl shadow-xl shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700"
            >
              <CheckCheck className="size-5 mr-2" />
              <span className="text-[14px] font-black uppercase tracking-widest">TAHSİLATII TAMAMLA</span>
            </RxButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
