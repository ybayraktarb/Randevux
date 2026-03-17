"use client"

import { useState } from "react"
import { Building2, Save, Loader2, Copy, QrCode, Download, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import type { Business } from "../types"
import { updateBusinessProfileAction, refreshInviteCodeAction } from "../actions/business.actions"
import { RxButton } from "@/src/modules/core/components/rx-button"
import QRCode from "react-qr-code"

interface BusinessProfileFormProps {
  business: Business
}

export function BusinessProfileForm({ business }: Readonly<BusinessProfileFormProps>) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: business.name,
    address: business.address || "",
    phone: business.phone || "",
    description: business.description || "",
    logoUrl: business.logo_url || "",
    qrCode: business.qr_code || "",
  })
  const [inviteCode, setInviteCode] = useState(business.invite_code || "")

  const handleSave = async () => {
    setLoading(true)
    const res = await updateBusinessProfileAction({
      id: business.id,
      ...formData
    })
    setLoading(false)
    if (res.success) toast.success("Randevu politikaları güncellendi!")
    else toast.error(res.error?.message || "Hata oluştu.")
  }

  const handleRefreshInvite = async () => {
    const res = await refreshInviteCodeAction(business.id)
    if (res.success && res.data?.newCode) {
      setInviteCode(res.data.newCode)
      toast.success("Davet kodu yenilendi!")
    }
  }

  const downloadQRCode = () => {
    const svg = document.getElementById("BusinessQRCode") as unknown as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${formData.name || "business"}_qrcode.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Genel Bilgiler
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="biz_name" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İşletme Adı</label>
                <input
                  id="biz_name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="biz_phone" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İletişim Telefonu</label>
                <input
                  id="biz_phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="biz_addr" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Adres</label>
                <input
                  id="biz_addr"
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="biz_desc" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Hakkımızda / Açıklama</label>
                <textarea
                  id="biz_desc"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="min-h-[120px] rounded-2xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary rounded-[32px] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h2 className="text-lg font-black mb-6 flex items-center gap-2">
              <QrCode className="size-5" />
              Dijital Erişim
            </h2>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="biz_url" className="text-[10px] font-black uppercase tracking-widest opacity-70">Özel Kod (URL)</label>
                <div className="flex gap-2">
                  <input
                    id="biz_url"
                    type="text"
                    value={formData.qrCode}
                    onChange={e => setFormData(p => ({ ...p, qrCode: e.target.value.replace(/\s+/g, '').toUpperCase() }))}
                    className="h-12 flex-1 rounded-2xl bg-white/10 border border-white/20 px-4 text-sm font-black uppercase tracking-widest outline-none focus:bg-white/20 transition-all placeholder:text-white/40"
                    placeholder="URL KODU..."
                  />
                  <button onClick={() => { navigator.clipboard.writeText(formData.qrCode); toast.success("Kopyalandı!") }} className="size-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/20">
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>

              {formData.qrCode && (
                <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 text-gray-900 shadow-lg">
                  <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100">
                    <QRCode id="BusinessQRCode" value={formData.qrCode} size={140} level="M" />
                  </div>
                  <button onClick={downloadQRCode} className="w-full h-11 rounded-2xl bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                    <Download className="size-4" />
                    QR İndir
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-3">Sistem Davet Kodu</span>
                <div className="flex items-center justify-between gap-4 bg-white/10 rounded-2xl p-3 border border-white/10">
                  <code className="text-xs font-black tracking-widest">{inviteCode}</code>
                  <button onClick={handleRefreshInvite} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <RefreshCw className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <RxButton onClick={handleSave} disabled={loading} className="h-14 px-12 rounded-[20px] shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02]">
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5 mr-1" />} Değişiklikleri Kaydet
        </RxButton>
      </div>
    </div>
  )
}
