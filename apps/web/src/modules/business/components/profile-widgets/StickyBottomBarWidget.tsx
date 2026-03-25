import { ArrowRight, ShoppingBag } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"

export function StickyBottomBarWidget({
  count,
  total,
  duration,
  onContinue
}: {
  count: number
  total: number
  duration: number
  onContinue: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-6 sm:pb-8 pt-10 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
      <div className="mx-auto max-w-2xl pointer-events-auto">
        <div className="flex items-center justify-between gap-4 rounded-[32px] bg-gray-900/90 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl shadow-indigo-500/20 border border-white/10 w-full animate-in slide-in-from-bottom-8 duration-500 hover:bg-gray-900 transition-colors">
          <div className="flex items-center gap-4 min-w-0 pl-2">
            <div className="relative flex items-center justify-center size-12 rounded-2xl bg-primary/20">
              <ShoppingBag className="size-5 text-primary-light" />
              <div className="absolute -top-2 -right-2 size-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="text-[11px] font-black text-white leading-none">{count}</span>
              </div>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-xl font-black text-white tracking-tighter truncate leading-none">
                {total.toLocaleString("tr-TR")} ₺
              </p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Ortalama {duration} dk
              </p>
            </div>
          </div>
          
          <RxButton 
            variant="primary" 
            size="md" 
            className="shrink-0 gap-3 rounded-[24px] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all font-black uppercase tracking-widest text-[11px] px-8 h-12" 
            onClick={onContinue}
          >
            {"Devam Et"}
            <ArrowRight className="size-4" />
          </RxButton>
        </div>
      </div>
    </div>
  )
}
