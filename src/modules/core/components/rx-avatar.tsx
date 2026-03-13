"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type AvatarSize = "sm" | "md" | "lg"

interface RxAvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: AvatarSize
  online?: boolean
  className?: string
}

const sizeMap: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
}

const dotSizeMap: Record<AvatarSize, string> = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3.5",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

export function RxAvatar({
  src,
  alt,
  name,
  size = "md",
  online,
  className,
}: RxAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const initials = name ? getInitials(name) : "?"

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-primary-light font-medium text-primary overflow-hidden",
          sizeMap[size]
        )}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt || name || "Avatar"}
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {online && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-success ring-2 ring-card",
            dotSizeMap[size]
          )}
          aria-label="Çevrimiçi"
        />
      )}
    </div>
  )
}
