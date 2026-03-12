"use client"

import { LogOut, ShieldAlert } from "lucide-react"
import { RxButton } from "./rx-button"
import { stopImpersonatingAction } from "@/app/actions/user.actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ImpersonationBannerProps {
    userName: string
}

export function ImpersonationBanner({ userName }: ImpersonationBannerProps) {
    const router = useRouter()

    async function handleExit() {
        const res = await stopImpersonatingAction()
        if (res.success) {
            toast.success("Patron görünümünden çıkıldı. Yönetici paneline dönülüyor.")
            router.refresh()
            router.push("/super-admin")
        }
    }

    return (
        <div className="sticky top-0 z-[100] flex w-full items-center justify-between bg-amber-600 px-4 py-2 text-white shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-1.5">
                    <ShieldAlert className="size-4 animate-pulse" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-[13px] font-bold tracking-tight">Kritik Mod: Patron Görünümü Aktif</span>
                    <span className="hidden sm:inline text-white/60">•</span>
                    <span className="text-[12px] font-medium text-white/90">
                        Şu an <strong className="text-white underline decoration-white/40 underline-offset-2">{userName}</strong> kullanıcısı olarak görüntülüyorsunuz.
                    </span>
                </div>
            </div>
            
            <RxButton 
                size="sm" 
                variant="secondary"
                onClick={handleExit}
                className="h-8 gap-1.5 bg-white text-amber-700 hover:bg-amber-50 border-none shadow-sm transition-all active:scale-95"
            >
                <LogOut className="size-3.5" />
                <span className="text-[12px] font-bold uppercase tracking-wide">Görünümü Kapat</span>
            </RxButton>
        </div>
    )
}
