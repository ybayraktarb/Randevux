import { Star, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { Appointment } from "./types"

export function ReviewModal({
  open,
  onClose,
  appointment,
  rating,
  setRating,
  comment,
  setComment,
  onAddReview,
  isSubmitting
}: {
  open: boolean
  onClose: () => void
  appointment: Appointment | null
  rating: number
  setRating: (r: number) => void
  comment: string
  setComment: (c: string) => void
  onAddReview: () => Promise<void>
  isSubmitting: boolean
}) {
  return (
    <RxModal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
            <Star className="size-5 text-yellow-400 fill-yellow-400" />
            <span className="font-black uppercase tracking-widest text-sm text-gray-900">Deneyimini Paylaş</span>
        </div>
      }
      footer={
        <div className="flex gap-3 w-full p-4 bg-gray-50/50 border-t border-dashed border-gray-200 rounded-b-[32px]">
          <RxButton variant="ghost" className="flex-1 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-900 h-14 transition-all" onClick={onClose}>Vazgeç</RxButton>
          <RxButton
            variant="primary"
            className="flex-1 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-[11px] uppercase tracking-widest h-14 hover:scale-[1.02] active:scale-95 transition-all text-white"
            onClick={onAddReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : "GÖNDER"}
          </RxButton>
        </div>
      }
    >
      <div className="flex flex-col gap-8 py-6">
        <div className="text-center space-y-2">
            <p className="text-lg font-black text-gray-900 tracking-tight">
            {appointment?.businessName}
            </p>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">
            NASIL BİR DENEYİMDİ?
            </p>
        </div>

        <div className="flex justify-center gap-3 py-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <motion.button
              key={s}
              type="button"
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(s)}
              className="relative p-2 cursor-pointer transition-all duration-300"
            >
              <Star
                className={cn(
                  "size-10 transition-all duration-500",
                  s <= rating ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]" : "text-gray-200"
                )}
              />
               {s <= rating && (
                <motion.div
                  layoutId="star-active"
                  className="absolute inset-0 bg-yellow-400/5 rounded-full -z-10 blur-xl"
                />
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">DÜŞÜNCELERİN</label>
          <div className="relative group">
            <textarea
                className="min-h-[140px] w-full rounded-[28px] border-2 border-gray-100 bg-gray-50/30 p-5 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all resize-none shadow-inner"
                placeholder="Randevun hakkında ne düşünüyorsun? Deneyimini detaylandırabilirsin..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                {comment.length} karakter
            </div>
          </div>
        </div>
      </div>
    </RxModal>
  )
}
