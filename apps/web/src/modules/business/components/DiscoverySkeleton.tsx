"use client"

import { cn } from "@/lib/utils"

export function BusinessCardSkeleton() {
    return (
        <div className="h-[420px] rounded-[40px] border border-white/40 bg-white/40 backdrop-blur-md p-8 flex flex-col gap-6 animate-pulse">
            <div className="flex items-start gap-5">
                <div className="size-20 bg-gray-200 rounded-[28px]" />
                <div className="flex-1 space-y-3 pt-2">
                    <div className="h-7 w-3/4 bg-gray-200 rounded-lg" />
                    <div className="h-5 w-1/3 bg-gray-100 rounded-lg" />
                </div>
            </div>
            <div className="space-y-3">
                <div className="h-4 w-full bg-gray-100 rounded-lg" />
                <div className="h-4 w-5/6 bg-gray-100 rounded-lg" />
            </div>
            <div className="mt-auto pt-6 border-t border-dashed border-gray-100 flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="h-4 w-20 bg-gray-100 rounded-full" />
                    <div className="h-4 w-16 bg-gray-100 rounded-full" />
                </div>
                <div className="size-12 bg-gray-100 rounded-2xl" />
            </div>
        </div>
    )
}

export function CategorySkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden py-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-12 w-32 rounded-full bg-gray-100 shrink-0" />
            ))}
        </div>
    )
}
