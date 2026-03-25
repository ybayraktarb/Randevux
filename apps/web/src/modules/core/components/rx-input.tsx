"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface RxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const RxInput = forwardRef<HTMLInputElement, RxInputProps>(
  ({ label, error, icon, className, id, disabled, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-")
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "transition-all duration-150 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon && "pl-10",
              error
                ? "border-destructive focus:ring-destructive"
                : "border-input",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }
)
RxInput.displayName = "RxInput"

interface RxTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const RxTextarea = forwardRef<HTMLTextAreaElement, RxTextareaProps>(
  ({ label, error, className, id, disabled, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, "-")
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={cn(
            "flex min-h-[100px] w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "transition-all duration-150 ease-in-out",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "resize-y",
            error
              ? "border-destructive focus:ring-destructive"
              : "border-input",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }
)
RxTextarea.displayName = "RxTextarea"

export { RxInput, RxTextarea }
