import { useEffect } from "react"
import { CheckCircle2, MapPin, CalendarPlus } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"

export function SuccessState({ router }: { router: any }) {
  useEffect(() => {
    import("canvas-confetti").then((confetti) => {
      confetti.default({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#7C3AED", "#A78BFA", "#F59E0B"]
      })
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        <CheckCircle2 className="size-12 text-primary relative z-10" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Randevunuz Alındı! 🎊
      </h2>
      <p className="text-sm text-muted-foreground mb-10 max-w-[280px]">
        Harika! Randevunuz başarıyla oluşturuldu. Detayları aşağıdan kontrol edebilirsiniz.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl bg-background border border-border text-[11px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-muted transition-colors text-foreground shadow-sm">
            <MapPin className="size-4" /> YOL TARİFİ
          </button>
          <button className="flex-1 py-3 rounded-xl bg-background border border-border text-[11px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-muted transition-colors text-foreground shadow-sm">
            <CalendarPlus className="size-4" /> TAKVİME EKLE
          </button>
        </div>
        <RxButton className="w-full h-12 text-base font-black uppercase tracking-widest text-[13px] shadow-lg shadow-primary/20 mt-2" onClick={() => router.push("/randevularim")}>
          Randevularımı Görüntüle
        </RxButton>
        <RxButton variant="ghost" className="w-full h-12 text-base font-black uppercase tracking-widest text-[13px]" onClick={() => router.push("/musteri-panel")}>
          Ana Sayfaya Dön
        </RxButton>
      </div>
    </div>
  )
}
