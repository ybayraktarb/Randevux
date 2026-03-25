"use client"

import { Heart, Plus } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { Business } from "../types"

export interface FavoriteBusinessesWidgetProps {
    businesses: Business[]
    onViewProfile: (id: string) => void
    onOpenJoinModal: () => void
}

export function FavoriteBusinessesWidget({ businesses, onViewProfile, onOpenJoinModal }: FavoriteBusinessesWidgetProps) {
    if (businesses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center bg-gray-50/20 backdrop-blur-sm rounded-[40px] border border-dashed border-gray-200/60">
                <div className="size-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 ring-1 ring-black/5">
                    <Heart className="size-7 text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Favori İşletmen Yok</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 mb-6 opacity-60">
                    Sık gittiğin mekanları ekleyip anında randevu alabilirsin.
                </p>
                <RxButton 
                    className="rounded-full px-10 h-11 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/10"
                    onClick={onOpenJoinModal}
                >
                    İŞLETME EKLE
                </RxButton>
            </div>
        )
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory pt-2 px-1 -mx-1 [&::-webkit-scrollbar]:hidden">
            {businesses.map((b) => (
                <div
                    key={b.id}
                    onClick={() => onViewProfile(b.id)}
                    className="snap-start flex w-[160px] shrink-0 flex-col items-center gap-3 rounded-[28px] border border-gray-100 bg-white/60 backdrop-blur-xl p-5 shadow-lg shadow-gray-200/50 relative hover:bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer group"
                >
                    <RxAvatar name={b.name} size="lg" className="group-hover:scale-105 transition-transform duration-500" />
                    {b.isFavorite && (
                        <div className="absolute top-2 right-2 p-1.5 bg-red-500/10 rounded-full">
                            <Heart className="size-3.5 fill-red-500 text-red-500" />
                        </div>
                    )}
                    <div className="text-center w-full">
                        <span className="block text-sm font-black text-gray-900 truncate">
                            {b.name}
                        </span>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mt-1">
                            {b.category}
                        </span>
                    </div>
                </div>
            ))}

            <button
                onClick={onOpenJoinModal}
                className="snap-start flex w-[160px] shrink-0 flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-500 cursor-pointer group"
            >
                <div className="flex size-14 items-center justify-center rounded-[20px] bg-white shadow-sm group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Plus className="size-6 text-gray-400 group-hover:text-white" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-primary">
                    Yeni Ekle
                </span>
            </button>
        </div>
    )
}
