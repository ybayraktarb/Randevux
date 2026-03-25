"use client"

import { cn } from "@/lib/utils"
import {
    Scissors,
    Dog,
    Stethoscope,
    Sparkles,
    Tent,
    Coffee,
    Utensils,
    Dumbbell
} from "lucide-react"

interface Category {
    id: string
    name: string
    display_name: string
}

interface CategoryBarProps {
    categories: Category[]
    selectedId: string | null
    onSelect: (id: string | null) => void
}

const iconMap: Record<string, any> = {
    barber: Scissors,
    veterinary: Dog,
    health: Stethoscope,
    beauty: Sparkles,
    spa: Sun,
    fitness: Dumbbell,
    restaurant: Utensils,
    cafe: Coffee,
}

export function CategoryBar({ categories, selectedId, onSelect }: CategoryBarProps) {
    return (
        <div className="flex items-center gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
                onClick={() => onSelect(null)}
                className={cn(
                    "flex shrink-0 items-center justify-center h-12 px-8 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                    selectedId === null
                        ? "bg-primary text-white shadow-xl shadow-primary/30 scale-105"
                        : "bg-white/60 backdrop-blur-md border border-white/40 text-gray-400 hover:text-primary hover:bg-white hover:shadow-lg hover:shadow-black/5"
                )}
            >
                Tümü
            </button>

            {categories.map((cat) => {
                const Icon = iconMap[cat.name] || Sparkles
                const isSelected = selectedId === cat.id

                return (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={cn(
                            "flex shrink-0 items-center gap-3 h-12 px-8 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                            isSelected
                                ? "bg-primary text-white shadow-xl shadow-primary/30 scale-105"
                                : "bg-white/60 backdrop-blur-md border border-white/40 text-gray-400 hover:text-primary hover:bg-white hover:shadow-lg hover:shadow-black/5"
                        )}
                    >
                        <Icon className={cn("size-4 transition-transform group-hover:rotate-12", isSelected ? "text-white" : "text-primary/60")} />
                        {cat.display_name}
                    </button>
                )
            })}
        </div>
    )
}

function Sun({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
        </svg>
    )
}
