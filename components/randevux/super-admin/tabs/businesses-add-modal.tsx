"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { X } from "lucide-react"
import { RxButton } from "../../rx-button"
import { RxModal } from "../../rx-modal"
import { RxInput, RxTextarea } from "../../rx-input"

interface Module {
    id: string
    display_name: string
}

interface AddModalProps {
    modulesList: Module[]
    onSuccess: () => void
}

export function BusinessesAddModal({ modulesList, onSuccess }: AddModalProps) {
    const supabase = createClient()
    const [open, setOpen] = useState(false)
    const [newBiz, setNewBiz] = useState({
        name: "", city: "", phone: "", moduleId: "", description: "",
        autoApprove: true, cancellationBuffer: 60, ownerId: "",
    })
    const [ownerSearchQuery, setOwnerSearchQuery] = useState("")
    const [ownerSearchResults, setOwnerSearchResults] = useState<any[]>([])
    const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false)
    const [selectedOwner, setSelectedOwner] = useState<any>(null)

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
        if (!newBiz.name || !newBiz.moduleId || !newBiz.ownerId) {
            alert("Lütfen zorunlu alanları (İşletme Adı, Modül ve İşletme Sahibi) doldurun.")
            return
        }

        const { data: bData, error: bError } = await supabase
            .from("businesses")
            .insert({
                name: newBiz.name, address: newBiz.city, phone: newBiz.phone,
                module_id: newBiz.moduleId, auto_approve: newBiz.autoApprove,
                cancellation_buffer_minutes: newBiz.cancellationBuffer, is_active: true,
            })
            .select("id").single()

        if (bError || !bData) { alert("İşletme eklenirken hata: " + bError?.message); return }

        const businessId = bData.id
        const { error: oError } = await supabase.from("business_owners")
            .insert({ business_id: businessId, user_id: newBiz.ownerId })
        if (oError) alert("İşletme eklendi fakat Sahip ataması sırasında hata oluştu: " + oError.message)

        const defaultHours = [1, 2, 3, 4, 5, 6, 0].map(day => ({
            business_id: businessId, day_of_week: day,
            open_time: "09:00", close_time: "18:00", is_closed: false,
        }))
        const { error: hError } = await supabase.from("business_hours").insert(defaultHours)
        if (hError) console.error("Çalışma saatleri eklenemedi:", hError)

        setOpen(false)
        setNewBiz({ name: "", city: "", phone: "", moduleId: "", description: "", autoApprove: true, cancellationBuffer: 60, ownerId: "" })
        setSelectedOwner(null)
        onSuccess()
    }

    return (
        <>
            <button
                id="businesses-add-modal-trigger"
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
                {"Yeni İşletme Ekle"}
            </button>

            <RxModal open={open} onClose={() => setOpen(false)} title="Yeni İşletme Ekle" className="max-w-[800px]"
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => setOpen(false)}>İptal</RxButton>
                        <RxButton size="sm" onClick={handleAddBusiness}>Kaydet</RxButton>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sol Kolon */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Temel Bilgiler</h4>
                        <RxInput label="İşletme Adı (*)" placeholder="Örn: X Güzellik Merkezi" value={newBiz.name} onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })} />
                        <RxTextarea label="Kısa Açıklama" placeholder="İşletme hakkında kısa bir not..." value={newBiz.description} onChange={(e) => setNewBiz({ ...newBiz, description: e.target.value })} className="resize-none h-20" />
                        <RxInput label="Telefon" placeholder="+90 555 444 33 22" value={newBiz.phone} onChange={(e) => setNewBiz({ ...newBiz, phone: e.target.value })} />
                        <RxInput label="Adres/Şehir" placeholder="Örn: Kadıköy, İstanbul" value={newBiz.city} onChange={(e) => setNewBiz({ ...newBiz, city: e.target.value })} />
                    </div>

                    {/* Sağ Kolon */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Sistem Ayarları</h4>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-semibold text-foreground">Sektör / Modül (*)</label>
                            <select value={newBiz.moduleId} onChange={(e) => setNewBiz({ ...newBiz, moduleId: e.target.value })}
                                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                                <option value="" disabled>Lütfen Modül Seçin</option>
                                {modulesList.map((m) => (
                                    <option key={m.id} value={m.id}>{m.display_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Owner Search */}
                        <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[13px] font-semibold text-foreground">İşletme Sahibi (Owner) (*)</label>
                            <div className="flex items-center w-full h-10 border border-input rounded-lg px-3 bg-card" onClick={() => setIsOwnerDropdownOpen(true)}>
                                {selectedOwner ? (
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm text-foreground">{selectedOwner.name} ({selectedOwner.email})</span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedOwner(null); setNewBiz({ ...newBiz, ownerId: "" }) }}>
                                            <X className="size-4 text-muted-foreground hover:text-destructive" />
                                        </button>
                                    </div>
                                ) : (
                                    <input type="text" placeholder="İsim ile abone ara..." className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                                        value={ownerSearchQuery} onChange={(e) => setOwnerSearchQuery(e.target.value)} onFocus={() => setIsOwnerDropdownOpen(true)} />
                                )}
                            </div>
                            {isOwnerDropdownOpen && !selectedOwner && (
                                <div className="absolute top-[4.5rem] left-0 w-full z-10 bg-card border border-border shadow-lg rounded-lg overflow-hidden">
                                    {ownerSearchResults.length > 0 ? (
                                        ownerSearchResults.map(u => (
                                            <div key={u.id} className="flex flex-col p-2.5 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                                                onClick={() => { setSelectedOwner(u); setNewBiz({ ...newBiz, ownerId: u.id }); setIsOwnerDropdownOpen(false); setOwnerSearchQuery("") }}>
                                                <span className="text-sm font-medium text-foreground">{u.name}</span>
                                                <span className="text-xs text-muted-foreground">{u.email}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-sm text-muted-foreground text-center">
                                            {ownerSearchQuery.length > 1 ? "Kullanıcı bulunamadı." : "Aramak için yazın..."}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <RxInput label="Min. İptal Süresi (Dk)" type="number" value={newBiz.cancellationBuffer.toString()} onChange={(e) => setNewBiz({ ...newBiz, cancellationBuffer: Number(e.target.value) })} />
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer w-full p-2 border border-border rounded-lg hover:bg-muted transition-colors">
                                    <input type="checkbox" checked={newBiz.autoApprove} onChange={(e) => setNewBiz({ ...newBiz, autoApprove: e.target.checked })} className="size-4 rounded border-border text-primary accent-primary" />
                                    <span className="text-xs font-semibold text-foreground">Oto Randevu Onayı</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </RxModal>
        </>
    )
}
