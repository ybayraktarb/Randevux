"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar as CalendarIcon,
    Crown,
    Clock,
    RefreshCw,
    WifiOff,
    AlertCircle,
    Bell
} from "lucide-react"
import { RxButton } from "./rx-button"
import { RxAvatar } from "./rx-avatar"
import { getCalendarGridDataAction, StaffResource, CalendarAppointment, getMonthDensityAction } from "@/app/actions/calendar.actions"
import { checkUpcomingAppointmentsAction } from "@/app/actions/reminders.actions"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateAppointmentTimeAction } from "@/app/actions/appointment-time.actions"
import {
    DndContext,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDraggable,
    useDroppable,
    DragStartEvent,
    DragOverlay,
    defaultDropAnimationSideEffects
} from "@dnd-kit/core"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"

// Grid Constants
const DEFAULT_START_HOUR = 8      // 08:00
const DEFAULT_END_HOUR = 21       // 21:00
const PIXELS_PER_MINUTE_30 = 2 // 1 hour = 120px
const PIXELS_PER_MINUTE_15 = 4 // 1 hour = 240px
const PIXELS_PER_MINUTE_60 = 1 // 1 hour = 60px

function getPixelsPerMinute(zoom: number) {
    if (zoom === 15) return PIXELS_PER_MINUTE_15
    if (zoom === 60) return PIXELS_PER_MINUTE_60
    return PIXELS_PER_MINUTE_30
}

function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(":").map(Number)
    return h * 60 + (m || 0)
}

function getStatusColor(status: string) {
    switch (status) {
        case "Bekliyor": return "bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400"
        case "Onaylandı": return "bg-sky-500/10 border-sky-500/50 text-sky-700 dark:text-sky-300"
        case "Tamamlandı": return "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300"
        case "ongoing": return "bg-violet-500/10 border-violet-500/50 text-violet-700 dark:text-violet-300"
        default: return "bg-slate-500/10 border-slate-500/50 text-slate-700 dark:text-slate-300"
    }
}

// --- DND Components ---
function DroppableColumn({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const { setNodeRef } = useDroppable({ id })
    return <div ref={setNodeRef} className={className}>{children}</div>
}

function DraggableAppointment({ apt, top, height, onClick }: { apt: CalendarAppointment, top: number, height: number, onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: apt.id,
        data: { apt, top, height }
    })

    const style = {
        top: `${top}px`,
        height: `${height}px`,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 50 : 10,
        opacity: isDragging ? 0.4 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "absolute left-2 right-2 rounded-xl border-l-[6px] shadow-sm flex flex-col p-3 overflow-hidden transition-all hover:shadow-md hover:scale-[1.01] cursor-grab active:cursor-grabbing active:scale-100 group",
                getStatusColor(apt.status)
            )}
            style={style}
            onClick={(e) => {
                if (!isDragging) onClick()
            }}
        >
            <div className="flex items-start justify-between gap-1 overflow-hidden pointer-events-none mb-1">
                <span className="text-sm font-bold truncate leading-tight tracking-tight">{apt.customer_name}</span>
                {apt.is_vip && (
                    <div className="bg-yellow-500/20 p-1 rounded-full shrink-0">
                        <Crown className="size-3 text-yellow-600 fill-yellow-600" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 mb-2 pointer-events-none">
                <div className="size-1.5 rounded-full bg-current opacity-40" />
                <span className="text-[11px] font-semibold truncate opacity-80">{apt.service_name}</span>
            </div>

            <div className="mt-auto flex items-center justify-between text-[10px] font-bold opacity-70 border-t border-black/5 pt-2 pointer-events-none">
                <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{apt.start_time} - {apt.end_time}</span>
                </div>
                <div className="uppercase tracking-tighter opacity-50">{apt.status}</div>
            </div>

            {/* Buffer Time Visualization */}
            {(() => {
                const totalBuffer = apt.services.reduce((sum, s) => sum + (s.buffer || 0), 0)
                if (totalBuffer > 0) {
                    const bufferHeight = totalBuffer * getPixelsPerMinute(30) // Use base scale for ratio or similar
                    // Actually we need to calculate ratio based on total height
                    const totalMin = (timeToMinutes(apt.end_time) - timeToMinutes(apt.start_time))
                    const bufferRatio = totalBuffer / totalMin
                    return (
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-black/10 flex items-center justify-center border-t border-black/5"
                            style={{ height: `${bufferRatio * 100}%` }}
                        >
                            <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter italic">Hazırlık</span>
                        </div>
                    )
                }
                return null
            })()}
        </div>
    )
}

export function CommandCenterCalendar({ businessId }: { businessId?: string }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [loading, setLoading] = useState(false)
    const [staff, setStaff] = useState<StaffResource[]>([])
    const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
    const [activeDragId, setActiveDragId] = useState<string | null>(null)
    const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [businessHours, setBusinessHours] = useState<any>(null)
    const [isClosed, setIsClosed] = useState(false)
    const [staffSchedules, setStaffSchedules] = useState<any[]>([])
    const [staffLeaves, setStaffLeaves] = useState<any[]>([])
    const [staffBreaks, setStaffBreaks] = useState<any[]>([])
    const [zoomLevel, setZoomLevel] = useState(30) // 15, 30, 60
    const [monthDensity, setMonthDensity] = useState<Record<string, number>>({})
    const [showMonthGrid, setShowMonthGrid] = useState(false)
    const [showSidebar, setShowSidebar] = useState(true)
    const [isCompact, setIsCompact] = useState(false)
    const [now, setNow] = useState(new Date())
    const [prefetchCache, setPrefetchCache] = useState<Record<string, any>>({})
    const supabase = createClient()

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }), // 5px drag intent
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    // Fix UTC offset issue by getting the local YYYY-MM-DD
    const tzOffset = currentDate.getTimezoneOffset() * 60000; // offset in milliseconds
    const localDate = new Date(currentDate.getTime() - tzOffset);
    const formattedDate = localDate.toISOString().split("T")[0]; // YYYY-MM-DD (Local)

    const fetchMonthDensity = useCallback(async () => {
        if (!businessId) return
        const res = await getMonthDensityAction(businessId, currentDate.getFullYear(), currentDate.getMonth())
        if (res.success) {
            setMonthDensity(res.counts || {})
        }
    }, [businessId, currentDate])

    useEffect(() => {
        fetchMonthDensity()
    }, [fetchMonthDensity])

    const fetchData = useCallback(async () => {
        if (!businessId) return
        if (typeof window !== "undefined" && !window.navigator.onLine) {
            toast.error("İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.")
            setFetchError("İnternet bağlantısı yok.")
            return
        }

        // Check prefetch cache first
        if (prefetchCache[formattedDate]) {
            const data = prefetchCache[formattedDate]
            setStaff(data.staff)
            setAppointments(data.appointments || [])
            setBusinessHours(data.businessHours)
            setIsClosed(!!data.isClosed)
            setStaffSchedules(data.staffSchedules || [])
            setStaffLeaves(data.staffLeaves || [])
            setStaffBreaks(data.staffBreaks || [])
            setLoading(false)
            return
        }

        setLoading(true)
        setFetchError(null)
        try {
            const res = await getCalendarGridDataAction(businessId, formattedDate)
            if (res.success && res.staff) {
                setStaff(res.staff)
                setAppointments(res.appointments || [])
                setBusinessHours(res.businessHours)
                setIsClosed(!!res.isClosed)
                setStaffSchedules(res.staffSchedules || [])
                setStaffLeaves(res.staffLeaves || [])
                setStaffBreaks(res.staffBreaks || [])
            } else {
                const errMsg = res.error || "Takvim yüklenemedi"
                setFetchError(errMsg)
                toast.error(errMsg)
            }
        } catch (err: any) {
            console.error("fetchData error:", err)
            setFetchError("Sunucu bağlantısı sırasında bir hata oluştu.")
            toast.error("Bağlantı hatası.")
        } finally {
            setLoading(false)
        }
    }, [businessId, formattedDate, prefetchCache])

    // Pre-fetching effect
    useEffect(() => {
        if (!businessId || loading) return

        const doPrefetch = async (targetDate: Date) => {
            const dateStr = targetDate.toISOString().split('T')[0]
            if (prefetchCache[dateStr]) return

            const res = await getCalendarGridDataAction(businessId, dateStr)
            if (res.success) {
                setPrefetchCache(prev => ({ ...prev, [dateStr]: res }))
            }
        }

        const tomorrow = new Date(currentDate)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const yesterday = new Date(currentDate)
        yesterday.setDate(yesterday.getDate() - 1)

        doPrefetch(tomorrow)
        doPrefetch(yesterday)
    }, [businessId, currentDate, loading, prefetchCache])

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)
        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    // Fetch initial data
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Subscription for realtime updates (optional but good for 'Command Center')
    useEffect(() => {
        if (!businessId) return
        const channel = supabase.channel('command-center')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `business_id=eq.${businessId}` }, () => {
                fetchData()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [businessId, supabase, fetchData])

    // Update 'now' every minute
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const goPrevDay = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d })
    const goNextDay = () => setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d })
    const goToday = () => setCurrentDate(new Date())

    const startHour = useMemo(() => {
        if (!businessHours?.is_open) return DEFAULT_START_HOUR
        const bhStart = parseInt(businessHours.open_time.split(":")[0])
        if (!isCompact || appointments.length === 0) return bhStart

        const firstAptMin = Math.min(...appointments.map(a => timeToMinutes(a.start_time)))
        const firstAptHour = Math.floor(firstAptMin / 60)
        return Math.max(bhStart, firstAptHour - 1) // 1 hour buffer
    }, [businessHours, isCompact, appointments])

    const endHour = useMemo(() => {
        if (!businessHours?.is_open) return DEFAULT_END_HOUR
        const bhEnd = parseInt(businessHours.close_time.split(":")[0])
        if (!isCompact || appointments.length === 0) return bhEnd

        const lastAptMin = Math.max(...appointments.map(a => timeToMinutes(a.end_time)))
        const lastAptHour = Math.ceil(lastAptMin / 60)
        return Math.min(bhEnd, lastAptHour)
    }, [businessHours, isCompact, appointments])

    // Generate Hour Rows (e.g. 08:00, 09:00, 10:00)
    const hours = useMemo(() => {
        const arr = []
        for (let i = startHour; i <= endHour; i++) {
            arr.push(`${String(i).padStart(2, '0')}:00`)
        }
        return arr
    }, [startHour, endHour])

    // --- DND Handlers ---
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveDragId(null)
        const { active, over, delta } = event

        if (!over || !businessId) return // Drop outside

        const apt = active.data.current?.apt as CalendarAppointment
        if (!apt) return

        const newStaffId = over.id as string

        // Calculate new time based on Y delta
        const originalStartMin = timeToMinutes(apt.start_time)
        const originalEndMin = timeToMinutes(apt.end_time)
        const duration = originalEndMin - originalStartMin

        // delta.y is in pixels. Convert back to minutes
        const deltaMinutes = Math.round(delta.y / getPixelsPerMinute(zoomLevel))

        // Snap to 15 minute intervals
        const snappedDeltaMinutes = Math.round(deltaMinutes / 15) * 15

        let newStartMin = originalStartMin + snappedDeltaMinutes

        // Constrain to business hours
        if (newStartMin < startHour * 60) newStartMin = startHour * 60
        if (newStartMin + duration > (endHour + 1) * 60) newStartMin = ((endHour + 1) * 60) - duration

        const newEndMin = newStartMin + duration

        // Format back to HH:mm
        const newStartStr = `${String(Math.floor(newStartMin / 60)).padStart(2, '0')}:${String(newStartMin % 60).padStart(2, '0')}`
        const newEndStr = `${String(Math.floor(newEndMin / 60)).padStart(2, '0')}:${String(newEndMin % 60).padStart(2, '0')}`

        // Optimistic UI Update
        setAppointments(prev => prev.map(a => {
            if (a.id === apt.id) {
                return { ...a, staff_business_id: newStaffId, start_time: newStartStr, end_time: newEndStr }
            }
            return a
        }))

        // Backend Update
        const res = await updateAppointmentTimeAction({
            appointmentId: apt.id,
            businessId,
            newStaffBusinessId: newStaffId,
            newStartTime: newStartStr,
            newEndTime: newEndStr,
            date: formattedDate
        })

        if (!res.success) {
            toast.error(res.error || "Güncellenemedi, çakışma olabilir.")
            fetchData() // Revert UI
        } else {
            toast.success("Randevu saati taşındı.")
            // fetchData() will be called by realtime subscription anyway
        }
    }

    const draggedApt = activeDragId ? appointments.find(a => a.id === activeDragId) : null

    if (!businessId) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] bg-card rounded-2xl border border-border/50 shadow-sm">
                <Loader2 className="size-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Takvim hazırlanıyor...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-background rounded-2xl border border-border/50 shadow-2xl transition-all duration-500 hover:shadow-primary/5">
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
            `}</style>

            {/* Header Controls */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/60 backdrop-blur-xl z-50">
                <div className="flex items-center gap-4">
                    <RxButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={cn("h-8 w-8 p-0", showSidebar && "bg-muted text-primary")}
                    >
                        <CalendarIcon className="size-4" />
                    </RxButton>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        Komuta Merkezi
                    </h2>
                    <div className="flex items-center bg-card rounded-md border border-border p-1 shadow-sm">
                        <RxButton variant="ghost" size="sm" onClick={goPrevDay} className="h-8 px-2"><ChevronLeft className="size-4" /></RxButton>
                        <span className="px-3 text-sm font-medium w-[140px] text-center">
                            {currentDate.toLocaleDateString("tr-TR", { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <RxButton variant="ghost" size="sm" onClick={goNextDay} className="h-8 px-2"><ChevronRight className="size-4" /></RxButton>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex bg-muted p-1 rounded-lg mr-2">
                        {[15, 30, 60].map(z => (
                            <button
                                key={z}
                                onClick={() => setZoomLevel(z)}
                                className={cn(
                                    "px-2 py-1 text-[10px] font-bold rounded transition-all",
                                    zoomLevel === z ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {z}dk
                            </button>
                        ))}
                    </div>
                    {!isOnline && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-md border border-destructive/20 animate-pulse">
                            <WifiOff className="size-3.5" /> Çevrimdışı
                        </div>
                    )}
                    <RxButton
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                            const res = await checkUpcomingAppointmentsAction(businessId)
                            if (res.success) toast.success(`${res.count} hatırlatıcı gönderildi.`)
                            else toast.error(res.error)
                        }}
                        className="h-8 px-2 text-[10px] hidden sm:flex"
                    >
                        <Bell className="size-3 mr-1" /> Hatırlatıcılar
                    </RxButton>
                    <RxButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCompact(!isCompact)}
                        className={cn("h-8 px-2 flex items-center gap-1", isCompact && "bg-primary/10 text-primary")}
                    >
                        <AlertCircle className="size-3.5" /> {isCompact ? "Normal" : "Kompakt"}
                    </RxButton>
                    <RxButton variant="ghost" onClick={goToday}>Bugün</RxButton>
                    <RxButton variant="secondary" onClick={fetchData} disabled={loading || !isOnline}>
                        <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Yenile
                    </RxButton>
                </div>
            </div>

            {/* Connection Error Banner */}
            {fetchError && (
                <div className="px-5 py-3 bg-warning/10 border-b border-warning/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-warning-foreground font-medium">
                        <AlertCircle className="size-4" />
                        <span>Veriler yüklenirken bir sorun oluştu: {fetchError}</span>
                    </div>
                    <RxButton variant="ghost" size="sm" onClick={fetchData} className="h-8 text-xs underline">Tekrar Dene</RxButton>
                </div>
            )}

            {/* Calendar Main Body */}
            <div className="flex flex-1 overflow-hidden relative bg-card/30">
                {/* Loading Shimmer Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-[60] bg-background/20 backdrop-blur-[2px] pointer-events-none flex flex-col pt-12">
                        <div className="flex-1 flex min-w-[800px] ml-[70px]">
                            {staff.map(s => (
                                <div key={s.id} className="flex-1 border-r border-border/10 px-2 pt-4">
                                    <div className="h-24 w-full bg-primary/5 animate-pulse rounded-lg mb-4" />
                                    <div className="h-32 w-full bg-primary/5 animate-pulse rounded-lg mb-4" />
                                    <div className="h-20 w-full bg-primary/5 animate-pulse rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {/* Left Sidebar: Mini Calendar & Stats */}
                {showSidebar && (
                    <div className="w-[280px] border-r border-border/40 bg-muted/5 flex flex-col hidden lg:flex animate-in slide-in-from-left duration-500 custom-scrollbar overflow-auto">
                        <div className="p-4 border-b border-border bg-card">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-foreground">Aylık Özet</h3>
                                <div className="flex gap-1">
                                    <RxButton variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                                        const d = new Date(currentDate)
                                        d.setMonth(d.getMonth() - 1)
                                        setCurrentDate(d)
                                    }}><ChevronLeft className="size-3.5" /></RxButton>
                                    <RxButton variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                                        const d = new Date(currentDate)
                                        d.setMonth(d.getMonth() + 1)
                                        setCurrentDate(d)
                                    }}><ChevronRight className="size-3.5" /></RxButton>
                                </div>
                            </div>

                            {/* Mini Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {['P', 'S', 'Ç', 'P', 'C', 'Ct', 'Pz'].map(day => (
                                    <div key={day} className="text-[10px] font-bold text-muted-foreground py-1">{day}</div>
                                ))}
                                {(() => {
                                    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                                    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
                                    const daysInMonth = endOfMonth.getDate()
                                    const startDay = (startOfMonth.getDay() + 6) % 7 // Monday start

                                    const cells = []
                                    for (let i = 0; i < startDay; i++) cells.push(<div key={`empty-${i}`} />)
                                    for (let d = 1; d <= daysInMonth; d++) {
                                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                        const count = monthDensity[dateStr] || 0
                                        const isSelected = currentDate.getDate() === d
                                        const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString()

                                        cells.push(
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    const newD = new Date(currentDate)
                                                    newD.setDate(d)
                                                    setCurrentDate(newD)
                                                }}
                                                className={cn(
                                                    "relative h-8 w-full rounded-md text-[11px] font-medium transition-all flex flex-col items-center justify-center gap-0.5",
                                                    isSelected ? "bg-primary text-primary-foreground shadow-sm" :
                                                        isToday ? "bg-primary/10 text-primary border border-primary/20" :
                                                            "hover:bg-muted text-foreground"
                                                )}
                                            >
                                                {d}
                                                {count > 0 && !isSelected && (
                                                    <div className={cn(
                                                        "size-1 rounded-full",
                                                        count > 5 ? "bg-orange-500" : count > 2 ? "bg-blue-400" : "bg-muted-foreground/30"
                                                    )} />
                                                )}
                                            </button>
                                        )
                                    }
                                    return cells
                                })()}
                            </div>
                        </div>

                        <div className="flex-1 p-4 overflow-auto space-y-4">
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Yoğunluk Analizi</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="size-2 rounded-full bg-orange-500" />
                                    <span className="text-muted-foreground">Yüksek (&gt;5 randevu)</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="size-2 rounded-full bg-blue-400" />
                                    <span className="text-muted-foreground">Orta (2-5 randevu)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(isClosed || (businessHours && !businessHours.is_open)) && (
                    <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-10 text-center">
                        <div className="bg-card border border-border p-8 rounded-2xl shadow-xl max-w-md animate-in fade-in zoom-in duration-300">
                            <div className="size-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <CalendarIcon className="size-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {isClosed ? "İşletme Bugün Kapalı" : "Bugün Çalışma Saatleri Dışında"}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-6">
                                {isClosed
                                    ? "Bu tarih işletme tarafından kapalı gün olarak işaretlenmiş."
                                    : "İşletme ayarlarında bu gün için aktif çalışma saati bulunmuyor."}
                            </p>
                            <RxButton variant="secondary" onClick={goToday}>Bugüne Dön</RxButton>
                        </div>
                    </div>
                )}

                {/* Time Axis (Y) */}
                <div className="sticky left-0 z-30 w-[70px] bg-card/80 backdrop-blur-md border-r border-border/40 shadow-[4px_0_15px_-5px_rgba(0,0,0,0.05)] pt-12">
                    {hours.map((hour) => (
                        <div key={hour} className="text-[12px] font-medium text-muted-foreground text-right pr-3 -mt-3" style={{ height: `${60 * getPixelsPerMinute(zoomLevel)}px` }}>
                            {hour}
                        </div>
                    ))}
                </div>

                {/* Resource Columns (X) */}
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
                    <div className="flex flex-1 min-w-[800px] relative custom-scrollbar overflow-auto">
                        {/* Current Time Line */}
                        {(() => {
                            const isSameDay = now.toDateString() === currentDate.toDateString()
                            const nowMin = now.getHours() * 60 + now.getMinutes()
                            if (isSameDay && nowMin >= startHour * 60 && nowMin <= (endHour + 1) * 60) {
                                const top = (nowMin - (startHour * 60)) * getPixelsPerMinute(zoomLevel) + 48 // 48 is top-12
                                return (
                                    <div className="absolute left-0 right-0 z-40 flex items-center pointer-events-none" style={{ top: `${top}px` }}>
                                        <div className="size-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                                        <div className="flex-1 h-[2px] bg-red-500/50 shadow-sm" />
                                        <div className="px-1 bg-red-500 text-white text-[9px] font-bold rounded-sm h-4 flex items-center shadow-sm mr-2">
                                            {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        })()}

                        {staff.length === 0 && !loading && (
                            <div className="flex items-center justify-center flex-1 text-muted-foreground">Aktif personel bulunamadı.</div>
                        )}

                        {staff.map((s) => {
                            const staffApts = appointments.filter(a => a.staff_business_id === s.id)
                            return (
                                <DroppableColumn key={s.id} id={s.id} className="flex-1 min-w-[200px] border-r border-border relative pb-10">
                                    {/* Column Header (Sticky Top) */}
                                    <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md h-12 border-b border-border flex items-center justify-center gap-2 px-2">
                                        <RxAvatar name={s.name} size="sm" />
                                        <span className="text-sm font-semibold truncate text-foreground">{s.name}</span>
                                    </div>

                                    {/* Grid Background Lines */}
                                    <div className="absolute inset-0 top-12 pointer-events-none">
                                        {hours.map((hour) => (
                                            <div key={hour} className="border-b border-border/50" style={{ height: `${60 * getPixelsPerMinute(zoomLevel)}px` }} />
                                        ))}
                                    </div>

                                    {/* Staff Availability Layers */}
                                    <div className="absolute inset-0 top-12 pointer-events-none">
                                        {/* 1. Working Hours (Inactive areas) */}
                                        {(() => {
                                            const schedule = staffSchedules.find(sc => sc.staff_business_id === s.id)
                                            if (!schedule || !schedule.is_working) {
                                                return <div className="absolute inset-0 bg-muted/40" />
                                            }
                                            const sStart = timeToMinutes(schedule.start_time)
                                            const sEnd = timeToMinutes(schedule.end_time)

                                            const topLimit = startHour * 60
                                            const bottomLimit = (endHour + 1) * 60

                                            const inactiveBlocks = []
                                            if (sStart > topLimit) {
                                                inactiveBlocks.push({ top: 0, height: (sStart - topLimit) * getPixelsPerMinute(zoomLevel) })
                                            }
                                            if (sEnd < bottomLimit) {
                                                inactiveBlocks.push({ top: (sEnd - topLimit) * getPixelsPerMinute(zoomLevel), height: (bottomLimit - sEnd) * getPixelsPerMinute(zoomLevel) })
                                            }

                                            return inactiveBlocks.map((block, idx) => (
                                                <div key={`inactive-${idx}`} className="absolute left-0 right-0 bg-muted/40" style={block} />
                                            ))
                                        })()}

                                        {/* 2. Breaks */}
                                        {staffBreaks.filter(b => b.staff_business_id === s.id).map((b, idx) => {
                                            const bStart = timeToMinutes(b.start_time)
                                            const bEnd = timeToMinutes(b.end_time)
                                            const top = (bStart - (startHour * 60)) * getPixelsPerMinute(zoomLevel)
                                            const height = (bEnd - bStart) * getPixelsPerMinute(zoomLevel)
                                            return (
                                                <div key={`break-${idx}`} className="absolute left-0 right-0 bg-orange-500/5 flex items-center justify-center" style={{ top, height }}>
                                                    <span className="text-[10px] text-orange-600 font-bold opacity-30 uppercase tracking-tighter">MOLA</span>
                                                </div>
                                            )
                                        })}

                                        {/* 3. Leaves */}
                                        {staffLeaves.filter(l => l.staff_business_id === s.id).map((l, idx) => {
                                            let top = 0
                                            let height = (endHour + 1 - startHour) * 60 * getPixelsPerMinute(zoomLevel)

                                            if (l.request_type === "partial" && l.start_time && l.end_time) {
                                                const lStart = timeToMinutes(l.start_time)
                                                const lEnd = timeToMinutes(l.end_time)
                                                top = (lStart - (startHour * 60)) * getPixelsPerMinute(zoomLevel)
                                                height = (lEnd - lStart) * getPixelsPerMinute(zoomLevel)
                                            }

                                            return (
                                                <div key={`leave-${idx}`} className="absolute left-0 right-0 bg-destructive/10 border-y border-destructive/20 flex items-center justify-center p-2 text-center" style={{ top, height }}>
                                                    <span className="text-[10px] text-destructive font-bold uppercase tracking-widest break-words leading-tight">İzinli</span>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Appointments Container */}
                                    <div className="relative mt-12 w-full h-full p-2">
                                        {staffApts.map(apt => {
                                            const startMin = timeToMinutes(apt.start_time)
                                            const endMin = timeToMinutes(apt.end_time)
                                            const top = (startMin - (startHour * 60)) * getPixelsPerMinute(zoomLevel)
                                            const height = (endMin - startMin) * getPixelsPerMinute(zoomLevel)

                                            if (top < 0 && height + top <= 0) return null

                                            return (
                                                <DraggableAppointment
                                                    key={apt.id}
                                                    apt={apt}
                                                    top={Math.max(0, top)}
                                                    height={Math.max(20, height)}
                                                    onClick={() => toast.info(`${apt.customer_name} Detayları yakında!`)}
                                                />
                                            )
                                        })}
                                    </div>
                                </DroppableColumn>
                            )
                        })}

                        {/* Drag Overlay for smooth visuals while dragging */}
                        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                            {draggedApt ? (() => {
                                const startMin = timeToMinutes(draggedApt.start_time)
                                const endMin = timeToMinutes(draggedApt.end_time)
                                const height = (endMin - startMin) * getPixelsPerMinute(zoomLevel)
                                return (
                                    <div
                                        className={cn(
                                            "rounded-lg border-l-4 shadow-2xl flex flex-col p-2 overflow-hidden opacity-90 cursor-grabbing",
                                            getStatusColor(draggedApt.status)
                                        )}
                                        style={{ height: `${Math.max(20, height)}px`, width: '100%' }} // Assuming 100% of underlying column
                                    >
                                        <div className="flex items-start justify-between gap-1 overflow-hidden pointer-events-none">
                                            <span className="text-sm font-bold truncate leading-tight">{draggedApt.customer_name}</span>
                                            {draggedApt.is_vip && <Crown className="size-3.5 shrink-0 text-yellow-500 fill-yellow-500" />}
                                        </div>
                                        <div className="text-[11px] truncate opacity-90 font-medium mt-0.5 pointer-events-none">{draggedApt.service_name}</div>
                                        <div className="text-[10px] mt-auto font-medium opacity-80 flex items-center gap-1 pointer-events-none">
                                            <Clock className="size-3" /> {draggedApt.start_time} - {draggedApt.end_time}
                                        </div>
                                    </div>
                                )
                            })() : null}
                        </DragOverlay>
                    </div>
                </DndContext>
            </div>
        </div>
    )
}
