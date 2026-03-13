"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    Loader2, X, User, Mail, Phone, Calendar, 
    ShieldCheck, BanIcon, UserCheck, Trash2,
    Clock, Activity, Edit2, Save
} from "lucide-react"
import { deleteUserAction } from "@/src/modules/auth/actions/auth.actions"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { toast } from "sonner"

interface UserProfile {
    id: string
    name: string
    email: string
    phone: string
    role: string
    active: boolean
    date: string
    avatar?: string
}

interface UsersDrawerProps {
    user: UserProfile
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
}

export function UsersDrawer({ user, isOpen, onClose, onUpdate }: UsersDrawerProps) {
    const supabase = createClient()
    const [drawerTab, setDrawerTab] = useState<"general" | "activity">("general")
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
    })

    useEffect(() => {
        if (isOpen) {
            setEditForm({
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            })
            setIsEditing(false)
            setDrawerTab("general")
        }
    }, [isOpen, user])

    async function handleToggleStatus() {
        setLoading(true)
        const { error } = await supabase
            .from("users")
            .update({ is_active: !user.active })
            .eq("id", user.id)

        if (error) {
            toast.error("Durum güncellenirken hata oluştu")
        } else {
            toast.success(user.active ? "Kullanıcı durduruldu" : "Kullanıcı aktif edildi")
            onUpdate()
        }
        setLoading(false)
    }

    async function handleSave() {
        setLoading(true)
        const { error } = await supabase
            .from("users")
            .update({
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                role: editForm.role
            })
            .eq("id", user.id)

        if (error) {
            toast.error("Güncelleme hatası: " + error.message)
        } else {
            toast.success("Kullanıcı bilgileri güncellendi")
            setIsEditing(false)
            onUpdate()
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!window.confirm(`${user.name} isimli kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?`)) return
        
        setLoading(true)
        const result = await deleteUserAction(user.id)
        
        if (result.success) {
            toast.success("Kullanıcı başarıyla silindi")
            onClose()
            onUpdate()
        } else {
            toast.error("Silme hatası: " + (result.error?.message || "Bilinmeyen bir hata oluştu"))
        }
        setLoading(false)
    }

    if (!isOpen || !user) return null

    const TABS = [
        { key: "general" as const, label: "Genel Bilgiler", icon: User },
        { key: "activity" as const, label: "Aktivite", icon: Activity },
    ]

    return (
        <>
            <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-border bg-card shadow-xl animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                        <RxAvatar name={user.name} src={user.avatar} size="lg" />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-lg font-semibold text-foreground leading-tight">{user.name}</span>
                            <div className="flex items-center gap-2">
                                {user.active ? <RxBadge variant="success">Aktif</RxBadge> : <RxBadge variant="danger">Banlı</RxBadge>}
                                <RxBadge variant="gray" className="capitalize">{user.role}</RxBadge>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted" aria-label="Kapat">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-muted/20">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setDrawerTab(tab.key)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-all",
                                drawerTab === tab.key ? "border-b-2 border-primary text-primary bg-card" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {drawerTab === "general" && (
                        <div className="space-y-6">
                            {/* Profile Details Card */}
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-primary" />
                                        Hesap Detayları
                                    </h4>
                                    <button 
                                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                        disabled={loading}
                                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        {isEditing ? <><Save className="size-3" /> Kaydet</> : <><Edit2 className="size-3" /> Düzenle</>}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: "Ad Soyad", value: editForm.name, key: "name", icon: User },
                                        { label: "E-posta", value: editForm.email, key: "email", icon: Mail },
                                        { label: "Telefon", value: editForm.phone, key: "phone", icon: Phone },
                                        { label: "Rol", value: editForm.role, key: "role", icon: ShieldCheck, isSelect: true },
                                    ].map((field) => (
                                        <div key={field.label} className="space-y-1">
                                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <field.icon className="size-3" />
                                                {field.label}
                                            </label>
                                            {isEditing ? (
                                                field.isSelect ? (
                                                    <select 
                                                        value={editForm.role}
                                                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:ring-1 focus:ring-primary h-8"
                                                    >
                                                        <option value="user">Kullanıcı</option>
                                                        <option value="patron">Patron</option>
                                                        <option value="personel">Personel</option>
                                                        <option value="super_admin">Süper Admin</option>
                                                    </select>
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        value={field.value}
                                                        onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})}
                                                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:ring-1 focus:ring-primary h-8"
                                                    />
                                                )
                                            ) : (
                                                <p className="text-[13px] font-medium text-foreground truncate">{field.value || "—"}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* System Status Card */}
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <h4 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Clock className="size-4 text-primary" />
                                    Sistem Durumu
                                </h4>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-muted-foreground">Kayıt Tarihi</span>
                                        <span className="font-medium text-foreground">{user.date}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-muted-foreground">Hesap Durumu</span>
                                        {user.active ? (
                                            <span className="text-success font-bold">Aktif Kullanıcı</span>
                                        ) : (
                                            <span className="text-danger font-bold">Banlı / Engelli</span>
                                        )}
                                    </div>
                                    <div className="pt-2">
                                        <RxButton 
                                            variant="ghost" 
                                            size="sm" 
                                            className={cn(
                                                "w-full border border-dashed",
                                                user.active ? "border-danger/30 text-danger hover:bg-danger/5" : "border-success/30 text-success hover:bg-success/5"
                                            )}
                                            onClick={handleToggleStatus}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : user.active ? <BanIcon className="mr-2 size-4" /> : <UserCheck className="mr-2 size-4" />}
                                            {user.active ? "Kullanıcıyı Yasakla (Ban)" : "Yasağı Kaldır ve Aktif Et"}
                                        </RxButton>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="rounded-xl border border-danger/20 bg-danger/5 p-5">
                                <h4 className="mb-2 text-sm font-semibold text-danger flex items-center gap-2">
                                    <Trash2 className="size-4" />
                                    Tehlikeli Bölge
                                </h4>
                                <p className="text-xs text-danger/80 mb-4 leading-relaxed">
                                    Bu işlem kullanıcının tüm verilerini (randevular, işletme bağlantıları vb.) sistemden kalıcı olarak silecektir. Bu işlem geri alınamaz.
                                </p>
                                <button 
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="w-full py-2 bg-danger text-white text-xs font-bold rounded-lg hover:bg-danger/90 transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="mr-2 size-3 animate-spin inline" /> : null}
                                    Kullanıcıyı Kalıcı Olarak Sil
                                </button>
                            </div>
                        </div>
                    )}

                    {drawerTab === "activity" && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <Activity className="size-10 mb-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Aktivite günlüğü yakında eklenecek</p>
                            <p className="text-xs mt-1">Giriş çıkışlar ve yapılan işlemler burada listelenecek.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border p-4 bg-muted/10">
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-semibold">
                        RandevuX Super Admin v2.0 • User ID: {user.id}
                    </p>
                </div>
            </aside>
        </>
    )
}
