import { useState } from "react"
import { Building2, QrCode, Plus, Heart, Loader2 } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { QrScanner } from "./QrScanner"
import { Business } from "./types"

export function BusinessesTab({
  businesses,
  onJoinBusiness,
  onLeave,
  router
}: {
  businesses: Business[],
  onJoinBusiness: (c: string) => Promise<void>,
  onLeave: (id: string) => Promise<void>,
  router: any
}) {
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const submitJoin = async () => {
    if (!joinCode.trim()) return
    setIsJoining(true)
    await onJoinBusiness(joinCode.trim())
    setIsJoining(false)
    setShowJoinForm(false)
    setJoinCode("")
  }

  return (
    <div className="flex flex-col gap-6">
      {businesses.length === 0 && !showJoinForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center transition-colors hover:bg-card mb-4 min-h-[300px]">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="size-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Henüz Hiçbir İşletmeye Katılmadınız
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
            Favori kuaförünüz, güzellik salonunuz veya berberiniz RandevuX kullanıyorsa, kodlarını alarak hemen ekleyin.
          </p>
          <RxButton className="mt-6 gap-2" size="lg" onClick={() => setShowJoinForm(true)}>
            <QrCode className="size-5" /> İşletme Ekle
          </RxButton>
        </div>
      )}

      {businesses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <div
              key={b.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <div className="relative h-20 bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="absolute -bottom-5 left-4">
                  <RxAvatar name={b.name} size="lg" />
                </div>
                {b.isFavorite && (
                  <div className="absolute right-3 top-3 rounded-full bg-white/80 p-1 text-red-500 backdrop-blur-sm">
                    <Heart className="size-4 fill-current" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 px-4 pb-4 pt-8">
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">
                    {b.name}
                  </h3>
                  <RxBadge variant="purple" className="mt-1">
                    {b.category}
                  </RxBadge>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <RxButton
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/isletme/${b.id}`)}
                  >
                    Profili Gor
                  </RxButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(businesses.length > 0 || showJoinForm) && (
        <>
          {showJoinForm ? (
            <div className="flex min-h-[220px] flex-col justify-center gap-3 rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <span className="text-sm font-semibold">İşletme Kodunu Girin</span>
              <input
                type="text"
                placeholder="QR/DAVET KODU"
                className="w-full rounded-md border border-input px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
                autoFocus
              />
              <div className="flex flex-col gap-2 mt-2">
                <RxButton size="sm" variant="secondary" className="w-full" onClick={() => setShowScanner(true)}>
                  <QrCode className="size-3.5 mr-1" /> QR Tara
                </RxButton>
                <div className="flex items-center gap-2">
                  <RxButton variant="ghost" size="sm" onClick={() => setShowJoinForm(false)} className="flex-1">İptal</RxButton>
                  <RxButton size="sm" className="flex-1" onClick={submitJoin} disabled={isJoining || !joinCode.trim()}>
                    {isJoining ? <Loader2 className="size-4 animate-spin" /> : "Ekle"}
                  </RxButton>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowJoinForm(true)}
              className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Plus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                Yeni İşletme Ekle
              </span>
            </button>
          )}
        </>
      )}

      {showScanner && (
        <QrScanner
          onScan={(code) => {
            setJoinCode(code)
            onJoinBusiness(code)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
