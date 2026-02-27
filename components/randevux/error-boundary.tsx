"use client"

import React, { Component } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-12">
                    <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="size-7 text-destructive" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <h3 className="text-lg font-semibold text-foreground">Bir hata olustu</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Bu sayfada beklenmedik bir hata olustu. Sayfayi yenilemeyi deneyin.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            this.setState({ hasError: false, error: null })
                            window.location.reload()
                        }}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <RefreshCw className="size-4" />
                        Sayfayi Yenile
                    </button>
                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <details className="mt-4 w-full max-w-lg rounded-lg border border-border bg-muted p-3">
                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Hata Detayi</summary>
                            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-destructive">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
