import { useEffect } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { X } from "lucide-react"

export function QrScanner({ onScan, onClose }: { onScan: (code: string) => void, onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(
      (decodedText) => {
        scanner.clear()
        onScan(decodedText)
      },
      (errorMessage) => {
        // console.error(errorMessage)
      }
    )

    return () => {
      scanner.clear().catch(console.error)
    }
  }, [onScan])

  return (
    <div className="relative w-full h-full bg-black">
      <div id="qr-reader" className="w-full h-full" />
      <button 
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[99] p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <X className="size-5" />
      </button>
    </div>
  )
}
