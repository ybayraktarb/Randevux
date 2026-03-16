import { Star, Loader2 } from "lucide-react"
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
      title="Randevuyu Değerlendir"
      footer={
        <div className="flex gap-2 w-full">
          <RxButton variant="ghost" className="flex-1" onClick={onClose}>Vazgeç</RxButton>
          <RxButton
            variant="primary"
            className="flex-1"
            onClick={onAddReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Gönder"}
          </RxButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <p className="text-sm text-muted-foreground text-center">
          {appointment?.businessName} işletmesindeki randevunuz nasıldı?
        </p>

        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              className="transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <Star
                className={cn(
                  "size-8",
                  s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yorumunuz (İsteğe bağlı)</label>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-border bg-muted/30 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Deneyiminizi paylaşın..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>
    </RxModal>
  )
}
