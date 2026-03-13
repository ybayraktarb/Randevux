"use client"

import { cn } from "@/lib/utils"

export function BusinessCardSkeleton() {
    return (
        <div className="h-[380px] rounded-[40px] border border-gray-100 bg-white p-4 flex flex-col gap-4 animate-pulse">
            <div className="w-full h-48 bg-gray-100 rounded-[32px]" />
            <div className="px-2 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-6 w-1/2 bg-gray-100 rounded-lg" />
                    <div className="h-6 w-12 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-4 w-3/4 bg-gray-50 rounded-lg" />
                <div className="flex gap-2 pt-2">
                    <div className="h-8 w-24 bg-gray-50 rounded-full" />
                    <div className="h-8 w-24 bg-gray-50 rounded-full" />
                </div>
            </div>
        </div>
    )
}

export function CategorySkeleton() {
    return (
        <div className="flex gap-4 overflow-hidden py-2 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-24 w-24 rounded-3xl bg-gray-100 shrink-0" />
            ))}
        </div>
    )
}
