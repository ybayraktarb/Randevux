import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import type { StaffMember } from "./types"

export function StaffSectionWidget({ staff }: { staff: StaffMember[] }) {
  if (staff.length === 0) return null

  return (
    <section className="px-4 sm:px-8 max-w-5xl mx-auto w-full">
      <h2 className="text-xl font-black text-gray-900 tracking-tight">Uzman Kadro</h2>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-6 hide-scrollbar">
        {staff.map((member, idx) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            whileHover={{ y: -5 }}
            key={member.id}
            className="flex w-[180px] shrink-0 flex-col items-center rounded-[32px] bg-white border border-gray-100 p-6 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:border-primary/20 transition-all cursor-pointer"
          >
            <div className="relative">
              <RxAvatar
                name={member.name}
                size="lg"
                online={member.online}
                className="size-20 rounded-[24px]"
              />
            </div>
            <p className="mt-5 text-sm font-black text-gray-900 text-center line-clamp-1">
              {member.name}
            </p>
            <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest text-primary line-clamp-1 bg-primary/5 px-3 py-1 rounded-full">
              {member.specialty}
            </p>
            <div className="mt-4 flex items-center justify-center gap-1.5 w-full pt-4 border-t border-gray-50">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black text-gray-900">
                {member.rating}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
