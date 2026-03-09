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
    ChevronDown,
    Save,
    Search,
    Hash,
    Pin,
    PinOff
} from "lucide-react"
import { RxButton } from "./rx-button"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { getCalendarGridDataAction, StaffResource, CalendarAppointment, getMonthDensityAction } from "@/app/actions/calendar.actions"
import { checkUpcomingAppointmentsAction } from "@/app/actions/reminders.actions"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { updateAppointmentTimeAction } from "@/app/actions/appointment-time.actions"
import { motion, AnimatePresence } from "framer-motion"
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
        opacity: isDragging ? 0.6 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "absolute left-2 right-2 rounded-2xl border-l-[6px] shadow-sm flex flex-col p-4 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] cursor-grab active:cursor-grabbing active:scale-100 group backdrop-blur-md",
                getStatusColor(apt.status)
            )}
            style={style}
            onClick={(e) => {
                if (!isDragging) onClick()
            }}
        >
            <div className="flex items-start justify-between gap-1 overflow-hidden pointer-events-none mb-1.5">
                <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-black truncate leading-none tracking-tight text-gray-900 group-hover:text-primary transition-colors">{apt.customer_name}</span>
                    {apt.is_vip && <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">VIP Müşteri</span>}
                </div>
                {apt.is_vip && (
                    <div className="bg-amber-100 p-1.5 rounded-xl shrink-0 shadow-sm shadow-amber-200/50">
                        <Crown className="size-3.5 text-amber-600 fill-amber-600" />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mb-3 pointer-events-none">
                <div className="size-1.5 rounded-full bg-primary/40" />
                <span className="text-[11px] font-bold truncate text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-wider">{apt.service_name}</span>
            </div>

            <div className="mt-auto flex items-center justify-between pointer-events-none border-t border-black/5 pt-3">
                <div className="flex items-center gap-1.5 text-gray-500 font-black">
                    <Clock className="size-3.5" />
                    <span className="text-[11px] tracking-tight">{apt.start_time} — {apt.end_time}</span>
                </div>
                <div className="flex items-center gap-1">
                    <RxBadge variant={apt.status === 'Bekliyor' ? 'warning' : apt.status === 'Onaylandı' ? 'success' : 'gray'} className="text-[8px] font-black px-1.5 h-4 flex items-center">{apt.status}</RxBadge>
                </div>
            </div>

            {/* Buffer Time Visualization */}
            {(() => {
                const totalBuffer = apt.services.reduce((sum, s) => sum + (s.buffer || 0), 0)
                if (totalBuffer > 0) {
                    const totalMin = (timeToMinutes(apt.end_time) - timeToMinutes(apt.start_time))
                    const bufferRatio = totalBuffer / totalMin
                    return (
                        <div
                            className="absolute bottom-0 left-0 right-0 bg-black/5 flex items-center justify-center border-t border-black/10 backdrop-blur-sm"
                            style={{ height: `${bufferRatio * 100}%` }}
                        >
                            <span className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] italic">Hazırlık</span>
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
    const [selectedApt, setSelectedApt] = useState<CalendarAppointment | null>(null)
    const [hiddenStaffIds, setHiddenStaffIds] = useState<Set<string>>(new Set())
    const [pinnedStaffIds, setPinnedStaffIds] = useState<string[]>([])
    const [staffSearchQuery, setStaffSearchQuery] = useState("")
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
                        className={cn("h-10 w-10 text-gray-400 hover:text-primary transition-colors", showSidebar && "bg-primary/5 text-primary")}
                    >
                        <CalendarIcon className="size-5" />
                    </RxButton>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                            Komuta <span className="text-primary">Merkezi</span>
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Operasyonel Kontrol</p>
                    </div>

                    <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100 p-1 ml-4">
                        <RxButton variant="ghost" size="sm" onClick={goPrevDay} className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm"><ChevronLeft className="size-4" /></RxButton>
                        <div className="px-6 flex flex-col items-center min-w-[160px]">
                            <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">
                                {currentDate.toLocaleDateString("tr-TR", { day: 'numeric', month: 'long' })}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                                {currentDate.toLocaleDateString("tr-TR", { weekday: 'long' })}
                            </span>
                        </div>
                        <RxButton variant="ghost" size="sm" onClick={goNextDay} className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm"><ChevronRight className="size-4" /></RxButton>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
                        {[15, 30, 60].map(z => (
                            <button
                                key={z}
                                onClick={() => setZoomLevel(z)}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    zoomLevel === z ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {z}m
                            </button>
                        ))}
                    </div>
                    {!isOnline && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-100 animate-pulse">
                            <WifiOff className="size-3.5" /> Çevrimdışı
                        </div>
                    )}
                    <RxButton
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                            const res = await checkUpcomingAppointmentsAction(businessId)
                            if (res.success) toast.success(`${res.count} hatırlatıcı gönderildi.`)
                            else toast.error(res.error)
                        }}
                        className="h-10 px-4 text-[10px] font-black uppercase tracking-widest hidden sm:flex hover:bg-primary/5 text-gray-500 rounded-xl"
                    >
                        <Bell className="size-3.5 mr-2" /> Hatırlatıcılar
                    </RxButton>
                    <RxButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCompact(!isCompact)}
                        className={cn("h-10 px-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 rounded-xl transition-all", isCompact ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-400 hover:text-gray-600")}
                    >
                        <AlertCircle className="size-3.5" /> {isCompact ? "Normal" : "Kompakt"}
                    </RxButton>
                    <RxButton variant="ghost" onClick={goToday} className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-xl hover:bg-gray-50">Bugün</RxButton>
                    <RxButton variant="primary" onClick={fetchData} disabled={loading || !isOnline} className="h-10 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20">
                        <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} /> Yenile
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
                    <div className="w-[300px] border-r border-gray-100 bg-gray-50/30 flex flex-col hidden lg:flex animate-in slide-in-from-left duration-500 custom-scrollbar overflow-auto">
                        <div className="p-6 border-b border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col">
                                    <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Aylık Plan</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Yoğunluk Analizi</p>
                                </div>
                                <div className="flex gap-1.5">
                                    <RxButton variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-gray-50" onClick={() => {
                                        const d = new Date(currentDate)
                                        d.setMonth(d.getMonth() - 1)
                                        setCurrentDate(d)
                                    }}><ChevronLeft className="size-4" /></RxButton>
                                    <RxButton variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl hover:bg-gray-50" onClick={() => {
                                        const d = new Date(currentDate)
                                        d.setMonth(d.getMonth() + 1)
                                        setCurrentDate(d)
                                    }}><ChevronRight className="size-4" /></RxButton>
                                </div>
                            </div>

                            {/* Mini Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((day, idx) => (
                                    <div key={`${day}-${idx}`} className="text-[9px] font-black text-gray-400 py-1 uppercase">{day}</div>
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
                                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d)
                                        const isToday = new Date().toDateString() === dateObj.toDateString()

                                        cells.push(
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    const newD = new Date(currentDate)
                                                    newD.setDate(d)
                                                    setCurrentDate(newD)
                                                }}
                                                className={cn(
                                                    "relative h-9 w-full rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 group",
                                                    isSelected ? "bg-primary text-white shadow-lg shadow-primary/20 active:scale-95" :
                                                        isToday ? "bg-primary/5 text-primary border border-primary/20" :
                                                            "hover:bg-gray-100 text-gray-600"
                                                )}
                                            >
                                                {d}
                                                {count > 0 && !isSelected && (
                                                    <div className={cn(
                                                        "size-1 rounded-full transition-transform group-hover:scale-150",
                                                        count > 5 ? "bg-rose-500" : count > 2 ? "bg-primary" : "bg-gray-300"
                                                    )} />
                                                )}
                                            </button>
                                        )
                                    }
                                    return cells
                                })()}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                            {/* Summary Cards */}
                            <div className="p-6 space-y-4 border-b border-gray-100">
                                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Günün Özeti</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <TrendingUp className="size-5" />
                                            </div>
                                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">+12% Artış</span>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-gray-900 leading-none">{appointments.length}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Toplam Randevu</p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="size-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                                <Clock className="size-5" />
                                            </div>
                                            <RxBadge variant="warning" className="text-[8px] px-2">{appointments.filter(a => a.status === 'Bekliyor').length} ADET</RxBadge>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-gray-900 leading-none">{appointments.filter(a => a.status === 'Bekliyor').length}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Onay Bekleyenler</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Management Section */}
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Personel Yönetimi</h3>
                                    <RxButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setHiddenStaffIds(new Set())}
                                        className="h-6 text-[9px] font-black text-primary uppercase tracking-widest"
                                    >
                                        TÜMÜNÜ GÖSTER
                                    </RxButton>
                                </div>

                                {/* Staff Search */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Search className="size-3.5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={staffSearchQuery}
                                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                                        placeholder="Personel veya Rol ara..."
                                        className="w-full bg-white border border-gray-100 rounded-2xl h-11 pl-11 pr-4 text-[11px] font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                    />
                                </div>

                                {/* Grouped Staff List */}
                                <div className="space-y-6">
                                    {(() => {
                                        const grouped = staff.reduce((acc, s) => {
                                            const role = s.role || "Diğer"
                                            if (!acc[role]) acc[role] = []
                                            acc[role].push(s)
                                            return acc
                                        }, {} as Record<string, StaffResource[]>)

                                        return Object.entries(grouped)
                                            .filter(([role, members]) => {
                                                if (!staffSearchQuery) return true
                                                const q = staffSearchQuery.toLowerCase()
                                                return role.toLowerCase().includes(q) || members.some(m => m.name.toLowerCase().includes(q))
                                            })
                                            .map(([role, members]) => (
                                                <div key={role} className="space-y-3">
                                                    <div className="flex items-center gap-2 px-1">
                                                        <Hash className="size-3 text-gray-300" />
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{role}</span>
                                                        <span className="text-[9px] font-black text-gray-300 ml-auto">{members.length} KİŞİ</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {members.filter(m => !staffSearchQuery || m.name.toLowerCase().includes(staffSearchQuery.toLowerCase())).map(m => {
                                                            const isHidden = hiddenStaffIds.has(m.id)
                                                            const isPinned = pinnedStaffIds.includes(m.id)
                                                            return (
                                                                <div
                                                                    key={m.id}
                                                                    className={cn(
                                                                        "group flex items-center gap-3 p-2 rounded-2xl transition-all border border-transparent",
                                                                        isHidden ? "opacity-40 grayscale" : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02]"
                                                                    )}
                                                                >
                                                                    <div className="relative">
                                                                        <RxAvatar name={m.name} size="sm" />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newHidden = new Set(hiddenStaffIds)
                                                                                if (isHidden) newHidden.delete(m.id)
                                                                                else newHidden.add(m.id)
                                                                                setHiddenStaffIds(newHidden)
                                                                            }}
                                                                            className={cn(
                                                                                "absolute -right-1 -top-1 size-4 rounded-full border-2 border-white flex items-center justify-center transition-colors",
                                                                                isHidden ? "bg-gray-400" : "bg-emerald-500"
                                                                            )}
                                                                        >
                                                                            <div className="size-1 rounded-full bg-white shadow-sm" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <span className="text-[11px] font-black text-gray-900 truncate leading-none">{m.name}</span>
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Görünür</span>
                                                                    </div>
                                                                    <RxButton
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            if (isPinned) {
                                                                                setPinnedStaffIds(prev => prev.filter(id => id !== m.id))
                                                                            } else {
                                                                                setPinnedStaffIds(prev => [...prev, m.id])
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "size-8 p-0 rounded-xl transition-all",
                                                                            isPinned ? "bg-primary/10 text-primary" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50 opacity-0 group-hover:opacity-100"
                                                                        )}
                                                                    >
                                                                        {isPinned ? <Pin className="size-3.5 fill-primary" /> : <Pin className="size-3.5" />}
                                                                    </RxButton>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                    })()}
                                </div>
                            </div>

                            <div className="p-6 space-y-3 mt-auto border-t border-gray-100 bg-white">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lejant</div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="size-2 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Yüksek Yoğunluk</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="size-2 rounded-full bg-primary shadow-sm shadow-primary/20" />
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Orta Yoğunluk</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {
                    (isClosed || (businessHours && !businessHours.is_open)) && (
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
                    )
                }

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

                        {(() => {
                            const visibleStaff = staff
                                .filter(s => !hiddenStaffIds.has(s.id))
                                .sort((a, b) => {
                                    const aPinned = pinnedStaffIds.includes(a.id)
                                    const bPinned = pinnedStaffIds.includes(b.id)
                                    if (aPinned && !bPinned) return -1
                                    if (!aPinned && bPinned) return 1
                                    return 0
                                })

                            return visibleStaff.map((s) => {
                                const staffApts = appointments.filter(a => a.staff_business_id === s.id)
                                const isPinned = pinnedStaffIds.includes(s.id)
                                return (
                                    <DroppableColumn
                                        key={s.id}
                                        id={s.id}
                                        className={cn(
                                            "flex-1 min-w-[220px] border-r border-border/40 relative pb-10 transition-all",
                                            isPinned && "bg-primary/[0.02] shadow-[inset_0_0_10px_rgba(var(--primary),0.02)]"
                                        )}
                                    >
                                        {/* Column Header (Sticky Top) */}
                                        <div className={cn(
                                            "sticky top-0 z-20 h-12 border-b border-border/40 flex items-center justify-center gap-2 px-3 transition-colors",
                                            isPinned ? "bg-primary/5 backdrop-blur-xl" : "bg-white/80 backdrop-blur-md"
                                        )}>
                                            <div className="relative">
                                                <RxAvatar name={s.name} size="sm" src={s.avatar_url} />
                                                {isPinned && <Pin className="absolute -top-1 -right-1 size-3 fill-primary text-primary" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] font-black text-gray-900 truncate leading-none">{s.name}</span>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.role || "Personel"}</span>
                                            </div>
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
                                                        onClick={() => setSelectedApt(apt)}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </DroppableColumn>
                                )
                            })
                        })()}

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
            </div >

            {/* Appointment Details Sheet */}
            <AnimatePresence>
                {
                    selectedApt && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedApt(null)}
                                className="absolute inset-0 z-[100] bg-black/20 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute top-0 right-0 bottom-0 w-[400px] bg-white border-l border-gray-100 shadow-2xl z-[101] flex flex-col"
                            >
                                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Randevu Detayları</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{selectedApt.id}</p>
                                    </div>
                                    <RxButton
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedApt(null)}
                                        className="h-10 w-10 text-gray-400 hover:text-primary transition-colors bg-white shadow-sm border border-gray-100 rounded-xl"
                                    >
                                        <X className="size-5" />
                                    </RxButton>
                                </div>

                                <div className="flex-1 overflow-auto p-8 space-y-8 custom-scrollbar">
                                    {/* Status Header Card */}
                                    <div className={cn(
                                        "p-6 rounded-[32px] border flex items-center gap-4",
                                        getStatusColor(selectedApt.status)
                                    )}>
                                        <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                            <AlertTriangle className="size-6 text-current" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">GÜNCEL DURUM</span>
                                            <span className="text-lg font-black">{selectedApt.status}</span>
                                        </div>
                                    </div>

                                    {/* Customer Section */}
                                    <div className="space-y-4">
                                        <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-3">Müşteri Bilgileri</h4>
                                        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                                    <User className="size-6 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-gray-900">{selectedApt.customer_name}</span>
                                                    {selectedApt.is_vip && <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Vip Müşteri</span>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 pt-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-xl bg-white flex items-center justify-center text-gray-400">
                                                        <Phone className="size-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-600">{selectedApt.phone || "Telefon Belirtilmemiş"}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-xl bg-white flex items-center justify-center text-gray-400">
                                                        <Mail className="size-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-600">{selectedApt.email || "E-posta Belirtilmemiş"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Appointment Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-3">Hizmet & Zaman</h4>
                                        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                                        <CreditCard className="size-5 text-gray-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hizmet</span>
                                                        <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{selectedApt.service_name}</span>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-primary/5 rounded-2xl">
                                                    <span className="text-sm font-black text-primary">{selectedApt.total_price} TL</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                                    <Clock className="size-5 text-gray-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Randevu Zamanı</span>
                                                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{selectedApt.start_time} — {selectedApt.end_time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Internal Notes */}
                                    <div className="space-y-4 pb-8">
                                        <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-3">İşletme Notları</h4>
                                        <div className="bg-amber-50/50 p-6 rounded-[32px] border border-amber-100 border-dashed min-h-[100px] flex items-center justify-center italic text-sm text-amber-600 font-medium text-center">
                                            "Bu randevu için henüz bir dahili not eklenmemiş."
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="p-8 border-t border-gray-100 bg-white grid grid-cols-2 gap-4">
                                <RxButton variant="ghost" className="h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-gray-200">İptal Et</RxButton>
                                <RxButton variant="primary" className="h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20">Onayla</RxButton>
                            </div>
                        </motion.div>
            </>
                )}
        </AnimatePresence>
        </div >
    )
}
