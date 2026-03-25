"use client"

import { useState, useEffect, useRef } from "react"
import { MoreHorizontal } from "lucide-react"

export function ActionDropdown({ onAction }: { onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const actions = [
    { key: "detail", label: "Detay Gör" },
    { key: "approve", label: "Onayla" },
    { key: "cancel", label: "İptal Et" },
    { key: "noshow", label: "Gelmedi İşaretle" },
  ]

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted" aria-label="İşlemler">
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
          {actions.map((a) => (
            <button key={a.key} type="button" onClick={() => { onAction(a.key); setOpen(false) }} className="flex w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10">
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
