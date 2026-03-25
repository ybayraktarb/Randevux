"use client"

import { useState } from "react"
import { User, Lock, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { createClient } from "@/lib/supabase/client"

interface ProfileFormProps {
  user: any
  initialData: {
    name: string
    phone: string
    email: string
  }
}

export function ProfileForm({ user, initialData }: ProfileFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(initialData)
  
  const [passwords, setPasswords] = useState({
    new: "",
    confirm: ""
  })
  const [changingPw, setChangingPw] = useState(false)

  const handleUpdateProfile = async () => {
    setLoading(true)
    const { error } = await supabase.from("users").update({ 
      name: formData.name, 
      phone: formData.phone || null 
    }).eq("id", user.id)
    setLoading(false)
    if (error) toast.error("Profil güncellenemedi.")
    else toast.success("Profil güncellendi!")
  }

  const handleChangePassword = async () => {
    if (passwords.new.length < 8) {
      toast.error("Şifre en az 8 karakter olmalı.")
      return
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Şifreler uyuşmuyor.")
      return
    }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    setChangingPw(false)
    if (error) toast.error("Şifre değiştirilemedi.")
    else {
      toast.success("Şifre başarıyla değiştirildi!")
      setPasswords({ new: "", confirm: "" })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <User className="size-5 text-primary" />
          Profil Bilgileri
        </h2>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="full_name" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Ad Soyad</label>
            <input id="full_name" type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Telefon</label>
            <input id="phone" type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
          </div>
          <div className="flex flex-col gap-2">
            <label id="email-label" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">E-posta</label>
            <div aria-labelledby="email-label" className="h-12 rounded-2xl border border-gray-100 bg-gray-100/50 px-4 flex items-center text-sm font-bold text-gray-500 cursor-not-allowed">
              {formData.email}
            </div>
          </div>
          <RxButton onClick={handleUpdateProfile} disabled={loading} className="w-full h-12 rounded-2xl shadow-md font-black uppercase tracking-widest text-[11px] transition-all mt-4">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 mr-1" />} Profili Güncelle
          </RxButton>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Lock className="size-5 text-primary" />
          Güvenlik
        </h2>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="new_password" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Yeni Şifre</label>
            <input id="new_password" type="password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="••••••••" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm_password" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Şifre Tekrar</label>
            <input id="confirm_password" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="••••••••" />
          </div>
          <RxButton onClick={handleChangePassword} disabled={changingPw} className="w-full h-12 rounded-2xl shadow-md font-black uppercase tracking-widest text-[11px] transition-all bg-gray-900 hover:bg-gray-800 text-white mt-4">
            {changingPw ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4 mr-1" />} Şifreyi Değiştir
          </RxButton>
        </div>
      </div>
    </div>
  )
}
