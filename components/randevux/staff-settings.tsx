"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { RxButton } from "./rx-button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Save, Lock, User } from "lucide-react"

export function StaffSettings() {
    const { user } = useCurrentUser()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [changingPassword, setChangingPassword] = useState(false)

    useEffect(() => {
        if (!user) return
        async function load() {
            const { data } = await supabase.from("users").select("name, phone, avatar_url").eq("id", user!.id).maybeSingle()
            if (data) {
                setName(data.name || "")
                setPhone(data.phone || "")
                setAvatarUrl(data.avatar_url || "")
            }
            setLoading(false)
        }
        load()
    }, [user])

    const handleSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        const { error } = await supabase.from("users").update({
            name,
            phone: phone || null,
            avatar_url: avatarUrl || null,
        }).eq("id", user.id)
        setSaving(false)
        if (error) { toast?.error ? toast.error("Profil guncellenemedi: " + error.message) : null; return }
        toast?.success ? toast.success("Profil basariyla guncellendi!") : null
    }

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            toast?.error ? toast.error("Sifre en az 6 karakter olmali.") : null
            return
        }
        if (newPassword !== confirmPassword) {
            toast?.error ? toast.error("Sifreler uyusmuyor.") : null
            return
        }
        setChangingPassword(true)
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        setChangingPassword(false)
        if (error) { toast?.error ? toast.error("Sifre degistirilemedi: " + error.message) : null; return }
        toast?.success ? toast.success("Sifre basariyla degistirildi!") : null
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
    }

    if (loading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-semibold text-foreground">Ayarlar</h1>

            {/* Profile Section */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 mb-6">
                    <User className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Profil Bilgileri</h2>
                </div>
                <div className="flex flex-col gap-4 max-w-md">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Ad Soyad</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                            placeholder="Adiniz Soyadiniz"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Telefon</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                            placeholder="05XX XXX XX XX"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Avatar URL</label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                            placeholder="https://..."
                        />
                    </div>
                    <RxButton onClick={handleSaveProfile} disabled={saving} className="w-fit mt-2">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Kaydet
                    </RxButton>
                </div>
            </div>

            {/* Password Section */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 mb-6">
                    <Lock className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Sifre Degistir</h2>
                </div>
                <div className="flex flex-col gap-4 max-w-md">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Yeni Sifre</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                            placeholder="En az 6 karakter"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Sifre Tekrar</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                            placeholder="Sifrenizi tekrar girin"
                        />
                    </div>
                    <RxButton onClick={handleChangePassword} disabled={changingPassword} className="w-fit mt-2">
                        {changingPassword ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                        Sifreyi Degistir
                    </RxButton>
                </div>
            </div>
        </div>
    )
}
