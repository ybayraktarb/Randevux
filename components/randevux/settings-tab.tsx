"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { RxButton } from "./rx-button"

export function SettingsTab() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [settings, setSettings] = useState({
        maintenance_mode: false,
        disable_registrations: false,
    })

    useEffect(() => {
        async function loadSettings() {
            const { data, error } = await supabase.from("system_settings").select("*")
            if (data) {
                const newSettings = { ...settings }
                data.forEach((item: any) => {
                    if (item.key === "maintenance_mode") {
                        newSettings.maintenance_mode = item.value?.enabled || false
                    }
                    if (item.key === "disable_registrations") {
                        newSettings.disable_registrations = item.value?.enabled || false
                    }
                })
                setSettings(newSettings)
            }
            setLoading(false)
        }
        loadSettings()
    }, [])

    async function handleSave() {
        setSaving(true)

        const updates = [
            {
                key: 'maintenance_mode',
                value: { enabled: settings.maintenance_mode },
                updated_at: new Date().toISOString()
            },
            {
                key: 'disable_registrations',
                value: { enabled: settings.disable_registrations },
                updated_at: new Date().toISOString()
            }
        ]

        const { error } = await supabase
            .from('system_settings')
            .upsert(updates, { onConflict: 'key' })

        setSaving(false)

        if (error) {
            toast.error("Ayarlar kaydedilirken bir hata oluştu.")
        } else {
            toast.success("Sistem ayarları başarıyla kaydedildi.")
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="size-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="flex flex-col gap-6 max-w-3xl">
            <div>
                <h2 className="text-[22px] font-semibold text-foreground">Sistem Ayarları</h2>
                <p className="text-sm text-muted-foreground">Platformun genel işleyişi ile ilgili kritik ayarları yönetin.</p>
            </div>

            <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col gap-6">
                    <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">Erişim ve Güvenlik Durumu</h3>

                    <div className="flex flex-col gap-4">
                        {/* Maintenance Mode */}
                        <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-primary-light/30">
                            <div className="flex flex-col gap-1 pr-4">
                                <span className="text-[14px] font-semibold text-foreground">Sistemi Bakım Moduna Al</span>
                                <span className="text-[13px] text-muted-foreground leading-relaxed">
                                    Aktif edildiğinde sadece yetkili yöneticiler sisteme giriş yapabilir. Açık oturumlar sonlanmaz ancak yeni girişler kısıtlanır.
                                </span>
                            </div>
                            <Switch
                                checked={settings.maintenance_mode}
                                onCheckedChange={(c) => setSettings({ ...settings, maintenance_mode: c })}
                            />
                        </div>

                        {/* Disable Registrations */}
                        <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-primary-light/30">
                            <div className="flex flex-col gap-1 pr-4">
                                <span className="text-[14px] font-semibold text-foreground">Kayıtları Geçici Olarak Kapat</span>
                                <span className="text-[13px] text-muted-foreground leading-relaxed">
                                    Sisteme yeni kullanıcı, işletme veya personel kayıtlarını geçici olarak engeller. Mevcut kullanıcılar platformu kullanmaya devam edebilir.
                                </span>
                            </div>
                            <Switch
                                checked={settings.disable_registrations}
                                onCheckedChange={(c) => setSettings({ ...settings, disable_registrations: c })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border mt-2">
                    <RxButton onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Ayarları Kaydet
                    </RxButton>
                </div>
            </div>
        </div>
    )
}
