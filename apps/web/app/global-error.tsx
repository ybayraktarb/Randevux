"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        Sentry.captureException(error)
    }, [error])

    return (
        <html lang="tr">
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
                    <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
                        <div className="text-4xl">⚠️</div>
                        <h2 className="text-xl font-semibold">Bir şeyler ters gitti.</h2>
                        <p className="text-sm text-muted-foreground">
                            Beklenmedik bir hata oluştu. Ekibimiz bilgilendirildi.
                        </p>
                        {process.env.NODE_ENV === "development" && (
                            <pre className="text-xs text-left bg-muted p-3 rounded-lg overflow-auto max-w-full">
                                {error.message}
                            </pre>
                        )}
                        <button
                            onClick={reset}
                            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-colors hover:bg-primary/90"
                        >
                            Tekrar dene
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
