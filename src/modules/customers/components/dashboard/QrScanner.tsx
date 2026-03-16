import { useEffect } from "react"
import { QrCode, X } from "lucide-react"
import { Html5QrcodeScanner } from "html5-qrcode"

export function QrScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    )

    scanner.render(
      (decodedText) => {
        onScan(decodedText)
        scanner.clear()
        onClose()
      },
      (error) => {
        // console.warn(error)
      }
    )

    return () => {
      scanner.clear().catch((e) => console.error("Scanner clear error", e))
    }
  }, [onScan, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            QR Kod Tarat
          </h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <div id="qr-reader" className="overflow-hidden rounded-xl border-2 border-primary/20" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          İşletmenin QR kodunu kameranıza okutun.
        </p>
      </div>
    </div>
  )
}
