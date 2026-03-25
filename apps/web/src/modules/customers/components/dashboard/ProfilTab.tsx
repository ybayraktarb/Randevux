import { useState } from "react"
import { TrendingUp, Loader2, Users, X, Plus, Trash2, User, Bell, Smartphone, Mail, Phone, CheckCircle2, Wallet, Calendar, Camera, Lock, ShieldCheck, MapPin, Home, Briefcase, CreditCard, Globe, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { CustomerProfile, FamilyProfile, CustomerStats } from "./types"
import { NotificationSettings } from "@/src/modules/auth/types"
import { motion, AnimatePresence } from "framer-motion"

export function ProfilTab({
  profile,
  onUpdate,
  familyProfiles,
  onAddFamily,
  onDeleteFamily,
  loadingFamily,
  stats,
  loadingStats
}: {
  profile: CustomerProfile,
  onUpdate: (name: string, phone: string, settings: NotificationSettings) => Promise<void>,
  familyProfiles: FamilyProfile[],
  onAddFamily: (name: string, rel: string) => Promise<void>,
  onDeleteFamily: (id: string) => Promise<void>,
  loadingFamily: boolean,
  stats: CustomerStats | null,
  loadingStats: boolean
}) {
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone)
  const [settings, setSettings] = useState(profile.notification_settings)
  const [isSaving, setIsSaving] = useState(false)

  const [showAddFamily, setShowAddFamily] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState("")
  const [newFamilyRel, setNewFamilyRel] = useState("Çocuk")
  
  const [showAddAddress, setShowAddAddress] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onUpdate(name, phone, settings)
    setIsSaving(false)
  }

  const handleAddSubmit = async () => {
    if (!newFamilyName) return
    await onAddFamily(newFamilyName, newFamilyRel)
    setNewFamilyName("")
    setShowAddFamily(false)
  }

  return (
    <div className="flex flex-col gap-10 pb-20 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Section - Elite Style */}
      <section className="relative">
          <div className="absolute -top-10 -left-10 size-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="size-5 text-primary" />
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">İstatistiklerim</h3>
          </div>

          {loadingStats ? (
            <div className="flex justify-center py-12 bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/60 shadow-xl shadow-primary/5">
                <Loader2 className="size-8 animate-spin text-primary/40" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <motion.div 
                 whileHover={{ y: -4 }}
                 className="p-6 rounded-[32px] bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-primary/5 flex items-center gap-5 transition-all"
               >
                  <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <Wallet className="size-6" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Toplam Harcama</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tighter">{stats.totalSpent.toLocaleString('tr-TR')} TL</span>
                  </div>
               </motion.div>

               <motion.div 
                 whileHover={{ y: -4 }}
                 className="p-6 rounded-[32px] bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-primary/5 flex items-center gap-5 transition-all"
               >
                  <div className="size-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                      <Calendar className="size-6" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Randevu Sayısı</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tighter">{stats.appointmentCount}</span>
                  </div>
               </motion.div>

              {stats.topServices?.length > 0 && (
                <div className="col-span-1 sm:col-span-2 mt-2 px-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="size-3 text-primary/40" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Sık Alınan Hizmetler</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stats.topServices.map((s, i) => (
                      <span key={i} className="px-4 py-1.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-widest shadow-sm">
                        {s.name} • <span className="text-primary">{s.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Henüz istatistik bulunmuyor.</p>
            </div>
          )}
      </section>

      {/* Family Profiles Section */}
      <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Aile Profilleri</h3>
            </div>
            <RxButton 
                size="sm" 
                variant="secondary" 
                className="rounded-full size-10 p-0 flex items-center justify-center shadow-lg shadow-primary/5 border-white bg-white/60 backdrop-blur-md hover:bg-primary hover:text-white transition-all duration-300"
                onClick={() => setShowAddFamily(!showAddFamily)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                    key={showAddFamily ? 'close' : 'add'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {showAddFamily ? <X className="size-5" /> : <Plus className="size-5" />}
                </motion.div>
              </AnimatePresence>
            </RxButton>
          </div>

          <AnimatePresence>
            {showAddFamily && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 shadow-inner">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Ad Soyad</label>
                                <input
                                    className="flex h-12 w-full rounded-2xl border border-white/20 bg-white/60 px-4 py-1 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white"
                                    placeholder="Örn: Mehmet Yılmaz"
                                    value={newFamilyName}
                                    onChange={(e) => setNewFamilyName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Yakınlık</label>
                                <select
                                    className="flex h-12 w-full rounded-2xl border border-white/20 bg-white/60 px-4 py-1 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                    value={newFamilyRel}
                                    onChange={(e) => setNewFamilyRel(e.target.value)}
                                >
                                    <option>Çocuk</option>
                                    <option>Eş</option>
                                    <option>Ebeveyn</option>
                                    <option>Diğer</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2 pt-2">
                                <RxButton 
                                    className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px]" 
                                    onClick={handleAddSubmit}
                                >
                                    PROFİL OLUŞTUR
                                </RxButton>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loadingFamily ? (
              <div className="col-span-2 flex justify-center py-8"><Loader2 className="size-6 animate-spin text-primary/40" /></div>
            ) : familyProfiles.length === 0 ? (
              <div className="col-span-2 p-10 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                   <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Henüz ekli aile profili yok.</p>
              </div>
            ) : (
              familyProfiles.map((p) => (
                <motion.div 
                    key={p.id} 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 rounded-[24px] bg-white/60 backdrop-blur-xl border border-white/60 shadow-lg shadow-gray-200/40 group"
                >
                  <div className="flex items-center gap-4">
                    <RxAvatar name={p.full_name} size="sm" className="rounded-xl ring-1 ring-black/5" />
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{p.full_name}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.relationship}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteFamily(p.id)} 
                    className="p-2 text-gray-300 hover:text-red-500 bg-gray-50/50 rounded-xl transition-all border border-transparent hover:border-red-100 hover:bg-red-50/50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
      </section>

      {/* Personal Info & Identity Section */}
      <section className="p-8 rounded-[40px] bg-white shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
              <User className="size-24 -mr-8 -mt-8" />
          </div>
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <User className="size-5 text-primary" />
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Kişisel Bilgiler</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 relative z-10">
              {/* Photo Upload Area */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="relative group/avatar cursor-pointer">
                      <RxAvatar name={profile.name} size="xl" className="rounded-[28px] shadow-lg ring-4 ring-white size-24 text-4xl" />
                      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm rounded-[28px] opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                          <Camera className="size-6 text-white mb-1" />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">Değiştir</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Soyad</label>
                  <input
                    className="flex h-12 w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/20"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefon</label>
                  <input
                    className="flex h-12 w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/20"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                  />
                </div>
              </div>
          </div>
      </section>

      {/* Security Suite Section */}
      <section className="p-8 rounded-[40px] bg-white shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-rose-500/5 group-hover:text-rose-500/10 transition-colors">
              <ShieldCheck className="size-24 -mr-8 -mt-8" />
          </div>
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <Lock className="size-5 text-rose-500" />
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Güvenlik & Şifre</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 mb-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Mevcut Şifreniz</label>
              <input
                type="password"
                className="flex h-12 w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white focus:border-rose-500/20"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Yeni Şifreniz</label>
              <input
                type="password"
                className="flex h-12 w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white focus:border-rose-500/20"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div className="flex justify-end relative z-10 border-t border-dashed border-gray-100 pt-6">
              <RxButton variant="secondary" className="h-11 px-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white transition-all shadow-none">
                  ŞİFREYİ GÜNCELLE
              </RxButton>
          </div>
      </section>

      {/* Address Book Section */}
      <section className="p-8 rounded-[40px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/20 group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Kayıtlı Adreslerim</h3>
            </div>
            <RxButton 
                size="sm" 
                variant="secondary" 
                className="rounded-full size-10 p-0 flex items-center justify-center shadow-lg shadow-primary/5 border-white bg-white/60 backdrop-blur-md hover:bg-primary hover:text-white transition-all duration-300"
                onClick={() => setShowAddAddress(!showAddAddress)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                    key={showAddAddress ? 'close' : 'add'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {showAddAddress ? <X className="size-5" /> : <Plus className="size-5" />}
                </motion.div>
              </AnimatePresence>
            </RxButton>
          </div>
          
          <AnimatePresence>
            {showAddAddress && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/10 shadow-inner">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Adres Başlığı (Örn: Ev, İş)</label>
                                <input
                                    className="flex h-12 w-full rounded-2xl border border-white/20 bg-white/60 px-4 py-1 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white"
                                    placeholder="Ev Adresi"
                                />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Açık Adres</label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-2xl border border-white/20 bg-white/60 px-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white resize-none"
                                    placeholder="Açık adresinizi buraya girin veya haritadan seçin"
                                />
                            </div>
                            
                            {/* Map Placeholder */}
                            <div className="sm:col-span-2 h-[160px] rounded-2xl bg-gray-200/50 border border-white/40 overflow-hidden relative group/map flex items-center justify-center border-dashed">
                                <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-50" />
                                <div className="relative z-10 flex flex-col items-center gap-2 cursor-pointer">
                                    <div className="p-3 bg-white rounded-full shadow-lg text-primary group-hover/map:-translate-y-1 transition-transform">
                                        <MapPin className="size-6" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-md">Haritadan Seç (Yakında)</span>
                                </div>
                            </div>

                            <div className="sm:col-span-2 pt-2">
                                <RxButton className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px]" onClick={() => setShowAddAddress(false)}>ADRESİ KAYDET</RxButton>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mock Home Address */}
              <div className="p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all group/address">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                      <Home className="size-5" />
                  </div>
                  <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-black text-gray-900">Ev Adresi</span>
                          <button className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="size-4" />
                          </button>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 leading-relaxed line-clamp-2">
                          Atatürk Mah. Cumhuriyet Cad. No: 124 Daire: 5 Ataşehir / İstanbul
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 w-fit">
                          <CheckCircle2 className="size-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Varsayılan</span>
                      </div>
                  </div>
              </div>

              {/* Mock Work Address */}
              <div className="p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all group/address">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 shrink-0">
                      <Briefcase className="size-5" />
                  </div>
                  <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-black text-gray-900">İş Adresi</span>
                          <button className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="size-4" />
                          </button>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 leading-relaxed line-clamp-2">
                          Levent Mah. Büyükdere Cad. Apa Giz Kat: 4 Şişli / İstanbul
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* Notification Section */}
      <section className="p-8 rounded-[40px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/20">
          <div className="flex items-center gap-2 mb-8">
            <Bell className="size-5 text-primary" />
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Bildirim Tercihleri</h3>
          </div>
          <div className="grid gap-6">
            {[
              { id: 'push', label: 'Push Bildirimleri', desc: 'Randevu güncellemelerini anlık al.', icon: <Smartphone className="size-4" /> },
              { id: 'email', label: 'E-posta', desc: 'Detaylı özetler e-postanıza gelsin.', icon: <Mail className="size-4" /> },
              { id: 'sms', label: 'SMS', desc: 'Önemli hatırlatmalar için kısa mesaj.', icon: <Phone className="size-4" /> },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-[24px] bg-white border border-gray-50 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400 group-hover:text-primary transition-colors">{item.icon}</div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-900 tracking-tight">{item.label}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.desc}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, [item.id as keyof NotificationSettings]: !settings[item.id as keyof NotificationSettings] })}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-500",
                    settings[item.id as keyof NotificationSettings] ? "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-all duration-300",
                    settings[item.id as keyof NotificationSettings] ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
      </section>

      {/* Payment Methods Section */}
      <section className="p-8 rounded-[40px] bg-white shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
              <CreditCard className="size-24 -mr-8 -mt-8" />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Ödeme Yöntemleri</h3>
            </div>
            <RxButton 
                size="sm" 
                variant="secondary" 
                className="rounded-full size-10 p-0 flex items-center justify-center shadow-lg shadow-primary/5 border-gray-100 bg-gray-50 hover:bg-primary hover:text-white transition-all duration-300"
            >
                <Plus className="size-5" />
            </RxButton>
          </div>
          
          <div className="grid grid-cols-1 gap-4 relative z-10">
              {/* Mock Credit Card */}
              <div className="p-5 rounded-[24px] bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl flex items-center justify-between group/card relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 size-32 bg-white/5 rounded-full blur-2xl transition-all group-hover/card:bg-white/10" />
                  <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-8 rounded bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                          <span className="text-xs font-black italic tracking-widest text-white/90">VISA</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-sm font-black tracking-widest mb-1 shadow-sm">•••• •••• •••• 4242</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Son Kullanma: 12/28</span>
                      </div>
                  </div>
                  <button className="relative z-10 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/20 rounded-xl transition-all border border-transparent hover:border-white/10">
                      <Trash2 className="size-4" />
                  </button>
              </div>
          </div>
      </section>

      {/* App Preferences Section */}
      <section className="p-8 rounded-[40px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-gray-200/20">
          <div className="flex items-center gap-2 mb-8">
            <Globe className="size-5 text-primary" />
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Uygulama Tercihleri</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-[24px] bg-white border border-gray-50 shadow-sm">
                  <div className="flex flex-col">
                      <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">Arayüz Teması</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sistem varsayılanı</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                      <button className="flex items-center justify-center p-2 rounded-xl bg-white shadow-sm text-primary font-bold text-[10px] uppercase tracking-widest transition-all">
                          <Sun className="size-4" />
                      </button>
                      <button className="flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-gray-900 font-bold text-[10px] uppercase tracking-widest transition-all">
                          <Moon className="size-4" />
                      </button>
                  </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-[24px] bg-white border border-gray-50 shadow-sm">
                  <div className="flex flex-col">
                      <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">Uygulama Dili</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Türkçe (TR)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                      <button className="px-3 py-2 rounded-xl bg-white shadow-sm text-primary font-bold text-[10px] uppercase tracking-widest transition-all">
                          TR
                      </button>
                      <button className="px-3 py-2 rounded-xl text-gray-400 hover:text-gray-900 font-bold text-[10px] uppercase tracking-widest transition-all">
                          EN
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer Save Button */}
      <div className="flex justify-center sm:justify-end pt-4">
          <RxButton 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full sm:w-fit min-w-[240px] h-14 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-3"
          >
            {isSaving ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
            DEĞİŞİKLİKLERİ KAYDET
          </RxButton>
      </div>
    </div>
  )
}
