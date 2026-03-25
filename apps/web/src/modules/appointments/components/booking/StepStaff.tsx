import { cn } from "@/lib/utils"
import { Scissors, Shuffle, ArrowRight, UserCheck, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { Service, Staff } from "./types"

export function StepStaff({
  services,
  staffList,
  selectedServices,
  selectedStaff,
  onSelectStaff,
}: {
  services: Service[]
  staffList: Staff[]
  selectedServices: string[]
  selectedStaff: string | null
  onSelectStaff: (id: string | null) => void
}) {
  const selectedServiceItems = services.filter((s) => selectedServices.includes(s.id))
  const serviceNames = selectedServiceItems.map((s) => s.name).join(", ")
  const totalPrice = selectedServiceItems.reduce((acc, s) => acc + s.price, 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Uzman Seçimi</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Sizinle ilgilenmesini istediğiniz uzmanı seçin
        </p>
      </div>

      {/* Selected Services Preview Badge */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full w-fit max-w-full"
      >
        <Scissors className="size-3.5 shrink-0" />
        <span className="line-clamp-1">{serviceNames}</span>
        <span className="shrink-0 font-black border-l border-primary/20 pl-3 ml-1">{totalPrice} TL</span>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {staffList.map((staff) => {
            const canDoAll = selectedServices.every((id) => staff.serviceIds.includes(id))
            const isSelected = selectedStaff === staff.id

            return (
              <motion.button
                layout
                key={staff.id}
                disabled={!canDoAll}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={canDoAll ? { scale: 1.01 } : {}}
                whileTap={canDoAll ? { scale: 0.99 } : {}}
                onClick={() => canDoAll && onSelectStaff(staff.id)}
                className={cn(
                  "relative flex items-center gap-5 p-5 rounded-card border-2 transition-all text-left group overflow-hidden",
                  !canDoAll ? "bg-muted/40 border-border opacity-50 cursor-not-allowed" :
                  isSelected ? "bg-card border-primary shadow-xl shadow-primary/5" :
                  "bg-card border-border hover:border-primary/20 hover:shadow-lg cursor-pointer"
                )}
              >
                <div className="relative">
                  <RxAvatar 
                    name={staff.name} 
                    size="xl" 
                    online={canDoAll && staff.online}
                    className="shadow-md ring-2 ring-background ring-offset-2" 
                  />
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-lg ring-2 ring-background"
                    >
                      <UserCheck className="size-3" />
                    </motion.div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                      {staff.name}
                    </h3>
                    {staff.online && canDoAll && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded text-[9px] font-black uppercase tracking-tighter">
                        Aktif
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    {staff.specialty}
                  </p>
                  
                  {canDoAll ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="size-3 fill-current" />
                        <span className="text-[11px] font-black">4.9</span>
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground/60 border-l border-border pl-3">
                        +150 Randevu
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-red-500/10">
                      Bu hizmetler için uygun değil
                    </span>
                  )}
                </div>

                {canDoAll && (
                  <div
                    className={cn(
                      "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "border-primary bg-primary" : "border-border bg-card"
                    )}
                  >
                    {isSelected && <div className="size-2 rounded-full bg-primary-foreground shadow-sm" />}
                  </div>
                )}
              </motion.button>
            )
          })}

          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => onSelectStaff("ANY")}
            className={cn(
              "flex items-center gap-5 p-5 rounded-card border-2 border-dashed transition-all cursor-pointer text-left mt-2 group",
              selectedStaff === "ANY"
                ? "bg-primary/5 border-primary shadow-xl shadow-primary/5"
                : "bg-background border-border hover:border-primary/20 hover:bg-muted/30"
            )}
          >
            <div className="size-16 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <Shuffle className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                Fark Etmez
              </h3>
              <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                Müsait olan ilk uzman ile devam et
              </p>
            </div>
            <div
              className={cn(
                "size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                selectedStaff === "ANY" ? "border-primary bg-primary" : "border-border bg-card"
              )}
            >
              {selectedStaff === "ANY" && <div className="size-2 rounded-full bg-primary-foreground shadow-sm" />}
            </div>
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/8 backdrop-blur-xl border-t border-border p-6 z-40 transform-gpu translate-z-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Seçilen Toplam</span>
            <span className="text-lg font-black text-foreground">
              {totalPrice} TL · ~{selectedServiceItems.reduce((a, s) => a + s.duration, 0)} dk
            </span>
          </div>
          <RxButton 
            size="lg" 
            className="gap-2 px-8 font-black uppercase tracking-[0.2em] text-xs h-12 rounded-full shadow-xl shadow-primary/20" 
            onClick={() => selectedStaff && onSelectStaff(selectedStaff)}
            disabled={selectedStaff === null}
          >
            Devam Et <ArrowRight className="size-4" />
          </RxButton>
        </div>
      </div>
    </div>
  )
}
