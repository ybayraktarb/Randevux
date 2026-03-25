"use client"

import { useState } from "react"
import { QrCode, Building2, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { QrScanner } from "../QrScanner"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export interface JoinBusinessModalProps {
  open: boolean
  onClose: () => void
  onJoin: (code: string) => Promise<void>
}

export function JoinBusinessModal({ open, onClose, onJoin }: JoinBusinessModalProps) {
  const [code, setCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!code.trim()) return

    setIsJoining(true)
    try {
      await onJoin(code.trim().toUpperCase())
      toast.success("İşletmeye başarıyla katıldınız!", {
        icon: <Sparkles className="size-4 text-emerald-500" />
      })
      setCode("")
      onClose()
    } catch (error) {
      toast.error("İşletmeye katılamadınız. Lütfen kodu kontrol edin.")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <RxModal
      open={open}
      onClose={() => {
        if (!isJoining) {
          setShowScanner(false)
          setCode("")
          onClose()
        }
      }}
      title=""
      className="max-w-md overflow-hidden bg-white/90 backdrop-blur-3xl border-white/40"
      showClose={!isJoining}
    >
      <div className="flex flex-col items-center text-center px-4 pb-6 pt-2">
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 relative">
          <Building2 className="size-10 text-primary" />
          <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
            <Sparkles className="size-4 text-emerald-500" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          İşletme Ekle
        </h2>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-8 max-w-[280px]">
          Davet kodunu girin veya QR kodu okutarak işletmeye katılın.
        </p>

        <AnimatePresence mode="wait">
          {showScanner ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 bg-gray-50 mb-4 h-[300px]">
                <QrScanner
                    onScan={async (scannedCode) => {
                        setShowScanner(false)
                        setCode(scannedCode)
                        await onJoin(scannedCode)
                        onClose()
                    }}
                    onClose={() => setShowScanner(false)}
                />
              </div>
              <RxButton
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-900 font-bold"
                onClick={() => setShowScanner(false)}
              >
                İptal Et ve Kod Gir
              </RxButton>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="w-full space-y-4"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="DAVET KODU"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  className="w-full rounded-2xl h-16 border-2 border-gray-100 bg-gray-50/50 px-6 text-xl font-black tracking-widest text-center uppercase outline-none focus:border-primary focus:bg-white transition-all duration-300"
                  disabled={isJoining}
                />
              </div>

              <RxButton
                type="submit"
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20"
                disabled={!code.trim() || isJoining}
              >
                {isJoining ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Katıl <ChevronRight className="size-4" />
                  </span>
                )}
              </RxButton>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-gray-400 font-bold uppercase tracking-widest">Veya</span>
                </div>
              </div>

              <RxButton
                type="button"
                variant="secondary"
                className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowScanner(true)}
                disabled={isJoining}
              >
                <QrCode className="size-5 mr-3 text-primary" />
                QR Kod Okut
              </RxButton>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </RxModal>
  )
}
