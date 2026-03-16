import { cn } from "@/lib/utils"
import { Scissors, Shuffle, ArrowRight } from "lucide-react"
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
  const serviceNames = services.filter((s) => selectedServices.includes(s.id))
    .map((s) => s.name)
    .join(", ")

  const totalPrice = services.filter((s) => selectedServices.includes(s.id)).reduce(
    (acc, s) => acc + s.price,
    0
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Hangi uzmanla calismak istersiniz?
        </h2>
      </div>

      <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm px-3 py-2 rounded-lg w-fit">
        <Scissors className="size-3.5 shrink-0" />
        <span className="font-medium">Secilen hizmetler:</span> <span className="line-clamp-1">{serviceNames}</span>
      </div>

      <div className="flex flex-col gap-3">
        {staffList.map((staff) => {
          const canDoAll = selectedServices.every((id) => staff.serviceIds.includes(id))
          const isSelected = selectedStaff === staff.id

          return (
            <button
              key={staff.id}
              disabled={!canDoAll}
              onClick={() => canDoAll && onSelectStaff(staff.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                "shadow-[0_2px_8_rgba(0,0,0,0.06)]",
                !canDoAll
                  ? "bg-muted border-border opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary-light border-primary cursor-pointer"
                    : "bg-card border-border hover:bg-muted/30 cursor-pointer"
              )}
            >
              <RxAvatar name={staff.name} size="lg" online={canDoAll && staff.online} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">
                  {staff.name}
                </p>
                <p className="text-[13px] text-muted-foreground line-clamp-1">{staff.specialty}</p>
                {canDoAll ? (
                  <p className="text-[13px] text-primary mt-0.5">
                    Bu hizmetler icin: {totalPrice} TL
                  </p>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-1 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md">
                    Uygun Degil
                  </span>
                )}
              </div>
              {canDoAll && (
                <div
                  className={cn(
                    "size-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-card"
                  )}
                >
                  {isSelected && (
                    <div className="size-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              )}
            </button>
          )
        })}

        <button
          onClick={() => onSelectStaff("ANY")}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl border-dashed border-2 transition-all cursor-pointer text-left mt-2",
            selectedStaff === "ANY"
              ? "bg-primary-light border-primary"
              : "bg-card border-border hover:bg-muted/30"
          )}
        >
          <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Shuffle className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-foreground">
              Fark etmez
            </p>
            <p className="text-[13px] text-muted-foreground">
              Uygun olan biriyle devam et
            </p>
          </div>
          <div
            className={cn(
              "size-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
              selectedStaff === "ANY"
                ? "border-primary bg-primary"
                : "border-border bg-card"
            )}
          >
            {selectedStaff === "ANY" && (
              <div className="size-2 rounded-full bg-primary-foreground" />
            )}
          </div>
        </button>
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border -mx-6 px-6 py-4 mt-2">
        {selectedStaff === null ? (
          <p className="text-[13px] text-muted-foreground text-center">
            Secim yapiniz
          </p>
        ) : (
          <div className="flex items-center justify-end">
            <RxButton size="sm" className="gap-1.5" onClick={() => onSelectStaff(selectedStaff)}>
              Ileri <ArrowRight className="size-3.5" />
            </RxButton>
          </div>
        )}
      </div>
    </div>
  )
}
