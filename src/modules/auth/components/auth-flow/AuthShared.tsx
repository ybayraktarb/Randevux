import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Loader2, Eye, EyeOff, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"

export function Logo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20">
        <Building2 className="size-7 text-white" />
      </div>
      <span className="text-2xl font-black tracking-tight text-foreground">
        Randevu<span className="text-primary">X</span>
      </span>
    </div>
  )
}

export function SocialButtons({ onApple, onGoogle }: { onApple?: () => void, onGoogle?: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <RxButton variant="secondary" className="h-12 gap-2 font-bold" onClick={onApple}>
        <span className="text-lg"></span> Apple
      </RxButton>
      <RxButton variant="secondary" className="h-12 gap-2 font-bold" onClick={onGoogle}>
        <svg className="size-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </RxButton>
    </div>
  )
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">
          {children}
        </span>
      </div>
    </div>
  )
}

export function FormField({
  label,
  icon: Icon,
  placeholder,
  type = "text",
  value,
  onChange,
  disabled,
  error,
}: {
  label: string
  icon?: any
  placeholder: string
  type?: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  error?: string
}) {
  return (
    <div className="grid gap-2">
      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {Icon && <Icon className="size-4" />}
        </div>
        <input
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-14 w-full rounded-2xl border bg-white/50 px-11 py-2 text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-muted-foreground/50 font-medium",
            error
              ? "border-red-500 ring-red-500/10"
              : "border-border/50 focus:border-primary focus:ring-primary/10"
          )}
        />
      </div>
      {error && <p className="text-[11px] font-bold text-red-500 ml-1">{error}</p>}
    </div>
  )
}

export function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  error,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="grid gap-2">
      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-14 w-full rounded-2xl border bg-white/50 px-5 py-2 text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-muted-foreground/50 font-medium",
            error
              ? "border-red-500 ring-red-500/10"
              : "border-border/50 focus:border-primary focus:ring-primary/10"
          )}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] font-bold text-red-500 ml-1">{error}</p>}
    </div>
  )
}

export function AuthCard({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) {
  return (
    <div className="w-full max-w-[420px] rounded-[40px] border border-white bg-white/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl md:p-10">
      {(title || subtitle) && (
        <div className="mb-8 text-center">
          {title && <h1 className="text-2xl font-black text-foreground">{title}</h1>}
          {subtitle && <p className="mt-2 text-sm font-bold text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
