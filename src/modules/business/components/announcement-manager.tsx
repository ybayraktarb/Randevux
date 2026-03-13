"use client"

import { useState, useEffect, useCallback } from "react"
import { Sparkles, Plus, TrendingUp, Calendar, Edit2, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { getAnnouncementsAction, deleteAnnouncementAction, type AnnouncementInput } from "../actions/announcement.actions"

export function AnnouncementManager({ businessId }: { businessId: string }) {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    const res = await getAnnouncementsAction(businessId)
    if (res.success) setAnnouncements(res.data)
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleDelete = async (id: string) => {
    if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return
    const res = await deleteAnnouncementAction(id)
    if (res.success) {
      toast.success("Duyuru silindi.")
      fetchAnnouncements()
    } else {
      toast.error(res.error || "Hata oluştu.")
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Sparkles className="size-6 text-primary" />
            Duyuru ve Kampanyalar
          </h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Müşterilerinize özel teklifler yayınlayın</p>
        </div>
        <RxButton onClick={() => toast.info("Yeni duyuru ekleme modalı burada açılacak.")} className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]">
          <Plus className="size-4 mr-2" /> Yeni Duyuru
        </RxButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
        ) : announcements.length === 0 ? (
          <div className="col-span-full bg-white rounded-[40px] border border-dashed border-gray-100 py-24 text-center">
            <TrendingUp className="size-8 text-gray-200 mx-auto mb-6" />
            <p className="text-sm font-bold text-gray-400">Henüz yayınlanmış bir duyuru bulunmuyor.</p>
          </div>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className={cn(
              "group relative bg-white rounded-[32px] border transition-all duration-300 overflow-hidden",
              item.is_active ? "border-gray-100 shadow-sm hover:shadow-md" : "border-dashed border-gray-100 opacity-60 grayscale"
            )}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("size-2 rounded-full", item.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300")} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.is_active ? "Yayında" : "Taslak"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                      <Edit2 className="size-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="size-9 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">{item.title}</h3>
                <p className="text-sm font-bold text-gray-500 line-clamp-2 mb-4">{item.content}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                  <Calendar className="size-3.5 text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-700">
                    {item.start_date ? new Date(item.start_date).toLocaleDateString("tr-TR") : "..."} - {item.end_date ? new Date(item.end_date).toLocaleDateString("tr-TR") : "..."}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
