import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { Star, MessageSquareQuote } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Review } from "./types"

export function ReviewsSectionWidget({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null

  return (
    <section id="reviews-section" className="px-4 sm:px-8 max-w-5xl mx-auto w-full mt-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-2xl bg-amber-50 flex items-center justify-center">
          <MessageSquareQuote className="size-5 text-amber-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Değerlendirmeler</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <RxAvatar name={review.userName} src={review.avatarUrl} size="sm" className="size-12 rounded-[20px] shadow-sm" />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-900 tracking-tight">{review.userName}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-1 bg-amber-50 w-fit px-3 py-1.5 rounded-full">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3.5",
                    i < review.rating ? "fill-amber-400 text-amber-400" : "fill-amber-100 text-amber-100"
                  )}
                />
              ))}
            </div>

            {review.comment && (
              <p className="mt-5 text-sm font-medium text-gray-600 leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
