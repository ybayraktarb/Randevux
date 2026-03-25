import { RxButton } from "@/src/modules/core/components/rx-button"
import { UserPlus } from "lucide-react"

export function ConnectionBannerWidget({ onConnect }: { onConnect: () => void }) {
  return (
    <section className="px-4 sm:px-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-[32px] bg-gradient-to-r from-primary to-primary-hover p-6 sm:px-8 sm:py-6 shadow-2xl shadow-primary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        
        <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[24px] bg-white/20 backdrop-blur-md shadow-inner-white">
            <UserPlus className="size-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-white tracking-tight">
              Aramıza Katılın
            </p>
            <p className="mt-1 text-sm font-medium text-white/80 leading-relaxed">
              Bu işletmeye bağlanarak randevu geçmişinizi detaylıca takip edin.
            </p>
          </div>
        </div>
        
        <RxButton
          variant="secondary"
          size="md"
          className="w-full sm:w-auto shrink-0 relative z-10 rounded-2xl bg-white text-primary border-none hover:bg-white/90 shadow-xl shadow-black/10 font-black uppercase tracking-widest text-[11px] px-8"
          onClick={onConnect}
        >
          Bağlan
        </RxButton>
      </div>
    </section>
  )
}
