"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  type: ToastType
  message: string
}

const toastConfig: Record<
  ToastType,
  { icon: React.ElementType; containerClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    containerClass: "border-success/30 bg-card",
    iconClass: "text-success",
  },
  error: {
    icon: AlertCircle,
    containerClass: "border-destructive/30 bg-card",
    iconClass: "text-destructive",
  },
  info: {
    icon: Info,
    containerClass: "border-primary/30 bg-card",
    iconClass: "text-primary",
  },
}

let toastId = 0
let addToastExternal: ((type: ToastType, message: string) => void) | null = null

export function showToast(type: ToastType, message: string) {
  addToastExternal?.(type, message)
}

export function RxToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    addToastExternal = addToast
    return () => {
      addToastExternal = null
    }
  }, [addToast])

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-80"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const config = toastConfig[toast.type]
        const Icon = config.icon
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] animate-in slide-in-from-right fade-in duration-200",
              config.containerClass
            )}
          >
            <Icon className={cn("size-5 mt-0.5 shrink-0", config.iconClass)} />
            <p className="flex-1 text-sm text-foreground leading-relaxed">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
