"use client"

import { cn } from "@/lib/utils"

interface RxSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rect" | "circle" | "text"
}

export function RxSkeleton({ className, variant = "rect", ...props }: RxSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200/60",
        variant === "circle" && "rounded-full",
        variant === "text" && "rounded-md h-4 w-full",
        variant === "rect" && "rounded-2xl",
        className
      )}
      {...props}
    />
  )
}
