"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
    PinOff,
    X,
    User,
    Phone,
    Mail,
    CreditCard,
    AlertTriangle,
    TrendingUp,
    WifiOff,
    AlertCircle,
    Bell,
    MapPin,
    MessageSquare,
    Share2,
    Circle,
    ArrowLeft,
    ArrowRight,
    Eye,
    EyeOff,
    Sparkles
} from "lucide-react"
import { RxSkeleton } from "@/src/modules/core/components/rx-skeleton"
import { RxInput, RxTextarea } from "@/src/modules/core/components/rx-input"
import { addAppointmentNoteAction } from "@/src/modules/appointments/actions/appointment.actions"
import { toast } from "sonner"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { getCalendarGridDataAction, StaffResource, CalendarAppointment, getMonthDensityAction } from "@/src/modules/appointments/actions/calendar.actions"
import { checkUpcomingAppointmentsAction } from "@/src/modules/appointments/actions/reminders.actions"
import { createClient } from "@/lib/supabase/client"
import { updateAppointmentTimeAction } from "@/src/modules/appointments/actions/appointment-time.actions"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import * as Sentry from "@sentry/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { FeatureGate } from "@/src/modules/admin/components/feature-gate"
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

// --- Sub Components ---
function MiniCalendar({ selectedDate, onDateChange, monthDensity }: {
    selectedDate: Date,
    onDateChange: (d: Date) => void,
    monthDensity: Record<string, number>
}) {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const daysInMonth = endOfMonth.getDate()
    const startDay = (startOfMonth.getDay() + 6) % 7 // Monday start

    const cells = []
    for (let i = 0; i < startDay; i++) cells.push(<div key={`empty-${i}`} />)
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const count = monthDensity[dateStr] || 0
        const isSelected = selectedDate.getDate() === d
        const dateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d)
        const isToday = new Date().toDateString() === dateObj.toDateString()

        cells.push(
            <button
                key={d}
                onClick={() => {
                    const newD = new Date(selectedDate)
                    newD.setDate(d)
                    onDateChange(newD)
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

    return (
        <div className="grid grid-cols-7 gap-1 text-center">
            {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((day, idx) => (
                <div key={`${day}-${idx}`} className="text-[9px] font-black text-gray-400 py-1 uppercase">{day}</div>
            ))}
            {cells}
        </div>
    )
}

function StaffListRow({ staff, isHidden, isPinned, onToggleVisibility, onTogglePin }: {
    staff: StaffResource,
    isHidden: boolean,
    isPinned: boolean,
    onToggleVisibility: () => void,
    onTogglePin: () => void
}) {
    return (
        <div
            className={cn(
                "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group",
                isHidden
                    ? "bg-gray-50/50 border-transparent opacity-60 grayscale"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20"
            )}
            onClick={onToggleVisibility}
        >
            <div className="flex items-center gap-3">
                <RxAvatar name={staff.name || ""} size="sm" src={staff.avatar_url} />
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900 line-clamp-1">{staff.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{staff.role || "Uzman"}</span>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onTogglePin()
                    }}
                    className={cn(
                        "size-7 rounded-lg flex items-center justify-center transition-all",
                        isPinned ? "text-primary bg-primary/10" : "text-gray-400 hover:bg-gray-100"
                    )}
                >
                    {isPinned ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                </button>
                <div className={cn(
                    "size-5 rounded-lg flex items-center justify-center transition-all",
                    isHidden ? "bg-gray-200 text-gray-400" : "bg-primary/10 text-primary"
                )}>
                    {isHidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </div>
            </div>
        </div>
    )
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
    const { subscriptionStatus } = useCurrentUser()
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
    const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null)
    const staffSearchQuery_inputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // ⌘+K Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                staffSearchQuery_inputRef.current?.focus()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

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
            Sentry.captureException(err, { tags: { module: 'booking', action: 'commandCenterFetchData' } })
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
        const bhStart = Number.parseInt(businessHours.open_time.split(":")[0])
        if (!isCompact || appointments.length === 0) return bhStart

        const firstAptMin = Math.min(...appointments.map(a => timeToMinutes(a.start_time)))
        const firstAptHour = Math.floor(firstAptMin / 60)
        return Math.max(bhStart, firstAptHour - 1) // 1 hour buffer
    }, [businessHours, isCompact, appointments])

    const endHour = useMemo(() => {
        if (!businessHours?.is_open) return DEFAULT_END_HOUR
        const bhEnd = Number.parseInt(businessHours.close_time.split(":")[0])
        if (!isCompact || appointments.length === 0) return bhEnd

        const lastAptMin = Math.max(...appointments.map(a => timeToMinutes(a.end_time)))
        const lastAptHour = Math.ceil(lastAptMin / 60)
        return Math.min(bhEnd, lastAptHour)
    }, [businessHours, isCompact, appointments])

    const hours = useMemo(() => {
        const arr = []
        for (let i = startHour; i <= endHour; i++) {
            arr.push(`${String(i).padStart(2, '0')}:00`)
        }
        return arr
    }, [startHour, endHour])

    // --- Scalability & Density Logic ---
    const processedStaff = useMemo(() => {
        const query = staffSearchQuery.toLowerCase().trim()
        return staff
            .filter(s => !hiddenStaffIds.has(s.id))
            .filter(s => {
                if (activeRoleFilter && s.role !== activeRoleFilter) return false
                if (!query) return true
                return (s.name || "").toLowerCase().includes(query) || (s.role || "").toLowerCase().includes(query)
            })
            .sort((a, b) => {
                const aPinned = pinnedStaffIds.includes(a.id)
                const bPinned = pinnedStaffIds.includes(b.id)
                if (aPinned && !bPinned) return -1
                if (!aPinned && bPinned) return 1
                return 0
            })
    }, [staff, hiddenStaffIds, pinnedStaffIds, staffSearchQuery, activeRoleFilter])

    const columnWidthClass = useMemo(() => {
        const count = processedStaff.length
        if (count > 8) return "min-w-[140px] hover:min-w-[280px]"
        if (count > 5) return "min-w-[180px] hover:min-w-[300px]"
        return "min-w-[240px] hover:min-w-[320px]"
    }, [processedStaff.length])

    // --- DND Handlers ---
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        if (subscriptionStatus === "past_due") {
            toast.error("Aboneliğiniz sona ermiş. Lütfen devam etmek için aboneliğinizi yenileyin.")
            setActiveDragId(null)
            return
        }
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
                    <FeatureGate featureKey="staff_management_module" businessId={businessId || ""} minimal>
                        <RxButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className={cn("h-10 w-10 text-gray-400 hover:text-primary transition-colors", showSidebar && "bg-primary/5 text-primary")}
                        >
                            <CalendarIcon className="size-5" />
                        </RxButton>
                    </FeatureGate>
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
            <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
                {/* Command Bar / Quick Search */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl p-2 flex items-center gap-2 group transition-all hover:bg-white hover:ring-4 hover:ring-primary/5">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Search className="size-5" />
                        </div>
                        <input
                            ref={staffSearchQuery_inputRef}
                            type="text"
                            placeholder="Personel veya randevu ara... (⌘ + K)"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium"
                            value={staffSearchQuery}
                            onChange={(e) => setStaffSearchQuery(e.target.value)}
                        />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                            <kbd className="text-[10px] font-black text-gray-400">⌘</kbd>
                            <kbd className="text-[10px] font-black text-gray-400">K</kbd>
                        </div>
                        <div className="h-6 w-px bg-gray-100 mx-1" />
                        <RxButton variant="ghost" size="sm" className="h-10 rounded-xl text-primary font-black uppercase text-[10px] tracking-widest px-4 hover:bg-primary/5">Aksiyonlar</RxButton>
                    </div>
                </div>

                {/* Top Bar - Header Dashboard Area */}
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
                <FeatureGate featureKey="staff_management_module" businessId={businessId || ""} minimal>
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

                                <MiniCalendar
                                    selectedDate={currentDate}
                                    onDateChange={setCurrentDate}
                                    monthDensity={monthDensity}
                                />
                            </div>

                            <div className="p-6 space-y-8 flex-1">
                                {/* Stats Quick View */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Bugün Ne Durumdayız?</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Doluluk</span>
                                            <span className="text-xl font-black text-gray-900">%84</span>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Kalan</span>
                                            <span className="text-xl font-black text-gray-900">12</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Staff Toggle List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-l-2 border-primary pl-3">Aktif Personeller</h4>
                                        <button
                                            onClick={() => setHiddenStaffIds(new Set())}
                                            className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                                        >
                                            HEPSİNİ AÇ
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {staff.map(s => (
                                            <div
                                                key={s.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group",
                                                    hiddenStaffIds.has(s.id)
                                                        ? "bg-gray-50/50 border-transparent opacity-60 grayscale"
                                                        : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20"
                                                )}
                                                onClick={() => {
                                                    const newHidden = new Set(hiddenStaffIds)
                                                    if (newHidden.has(s.id)) newHidden.delete(s.id)
                                                    else newHidden.add(s.id)
                                                    setHiddenStaffIds(newHidden)
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <RxAvatar name={s.name || ""} size="sm" src={s.avatar_url} />
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-gray-900 line-clamp-1">{s.name}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{s.role || "Uzman"}</span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "size-5 rounded-lg flex items-center justify-center transition-all",
                                                    hiddenStaffIds.has(s.id) ? "bg-gray-200 text-gray-400" : "bg-primary/10 text-primary"
                                                )}>
                                                    {hiddenStaffIds.has(s.id) ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                    )}
                </FeatureGate>

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
                    <div className="flex flex-1 min-w-[800px] relative custom-scrollbar overflow-x-auto overflow-y-hidden">
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

                        {/* Quick Jump Controls (Visible if many staff) */}
                        {staff.length > 4 && (
                            <>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('calendar-grid-scroll')
                                        if (el) el.scrollBy({ left: -400, behavior: 'smooth' })
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-[45] size-12 rounded-full bg-white shadow-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary transition-all active:scale-90"
                                >
                                    <ArrowLeft className="size-6" />
                                </button>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('calendar-grid-scroll')
                                        if (el) el.scrollBy({ left: 400, behavior: 'smooth' })
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-[45] size-12 rounded-full bg-white shadow-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary transition-all active:scale-90"
                                >
                                    <ArrowRight className="size-6" />
                                </button>
                            </>
                        )}

                        <div id="calendar-grid-scroll" className="flex flex-1 min-w-[800px] relative custom-scrollbar overflow-x-auto overflow-y-hidden">
                            {(() => {
                                let lastRole = ""
                                return processedStaff.map((s, idx) => {
                                    const staffApts = appointments.filter(a => a.staff_business_id === s.id)
                                    const isPinned = pinnedStaffIds.includes(s.id)
                                    const role = s.role || "Personel"
                                    const showRoleHeader = role !== lastRole
                                    lastRole = role

                                    return (
                                        <div key={s.id} className="flex flex-col">
                                            {showRoleHeader && (
                                                <div className="sticky top-0 z-30 h-8 bg-gray-50/80 backdrop-blur-md border-b border-r border-border/40 flex items-center px-4">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <Hash className="size-3" /> {role}
                                                    </span>
                                                </div>
                                            )}
                                            <DroppableColumn
                                                id={s.id}
                                                className={cn(
                                                    "flex-1 border-r border-border/40 relative pb-10 transition-all duration-500 ease-in-out group/col",
                                                    columnWidthClass,
                                                    isPinned ? "bg-primary/[0.04] shadow-[inset_0_0_60px_rgba(var(--primary),0.03)] border-l-2 border-l-primary/30" : "bg-white/50"
                                                )}
                                            >
                                                {/* Pinned Glow Indicator */}
                                                {isPinned && <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/60 via-primary/20 to-primary/60 shadow-[0_0_15px_rgba(var(--primary),0.3)] z-10" />}

                                                {/* Sidebar Toggle & Date (Sticky Top) */}
                                                <div
                                                    className={cn(
                                                        "sticky top-0 z-20 h-12 border-b border-border/40 flex items-center justify-between gap-2 px-3 transition-all duration-500 group-hover/col:bg-white/95",
                                                        isPinned ? "bg-primary/5 backdrop-blur-xl" : "bg-white/90 backdrop-blur-md"
                                                    )}
                                                >
                                                    <div
                                                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                                                        onClick={(e) => {
                                                            if (e.altKey) {
                                                                // Focus Mode: Hide all others
                                                                const others = staff.filter(m => m.id !== s.id).map(m => m.id)
                                                                setHiddenStaffIds(new Set(others))
                                                            }
                                                        }}
                                                        title="Alt + Tıklama: Odağı bu personele al"
                                                    >
                                                        <div className="relative shrink-0">
                                                            <RxAvatar name={s.name} size="sm" src={s.avatar_url} className={cn(isPinned && "ring-2 ring-primary/30 ring-offset-1")} />
                                                            {isPinned && (
                                                                <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-lg border border-white">
                                                                    <Pin className="size-2 fill-white text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={cn("text-[11px] font-black truncate leading-none transition-colors", isPinned ? "text-primary" : "text-gray-900", "group-hover/col:text-primary")}>{s.name}</span>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{role}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 group-hover/col:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (isPinned) {
                                                                    setPinnedStaffIds(prev => prev.filter(id => id !== s.id))
                                                                } else {
                                                                    setPinnedStaffIds(prev => [...prev, s.id])
                                                                }
                                                            }}
                                                            className={cn(
                                                                "size-7 rounded-lg flex items-center justify-center transition-all hover:scale-110",
                                                                isPinned ? "text-primary bg-primary/10" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                            )}
                                                            title={isPinned ? "Sabitliği Kaldır" : "Sola Sabitle"}
                                                        >
                                                            {isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const newHidden = new Set(hiddenStaffIds)
                                                                newHidden.add(s.id)
                                                                setHiddenStaffIds(newHidden)
                                                            }}
                                                            className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all hover:scale-110"
                                                            title="Gizle"
                                                        >
                                                            <X className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Grid Background Lines (moved to a darker version for pinned) */}
                                                <div className="absolute inset-0 top-12 pointer-events-none">
                                                    {hours.map((hour) => (
                                                        <div key={hour} className={cn("border-b", isPinned ? "border-primary/10" : "border-border/50")} style={{ height: `${60 * getPixelsPerMinute(zoomLevel)}px` }} />
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
                                                            <div key={`break-${idx}`} className="absolute left-0 right-0 bg-orange-500/[0.03] flex items-center justify-center border-y border-orange-500/10" style={{ top, height }}>
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
                                                            <div key={`leave-${idx}`} className="absolute left-0 right-0 bg-destructive/[0.08] border-y border-destructive/20 flex items-center justify-center p-2 text-center" style={{ top, height }}>
                                                                <span className="text-[10px] text-destructive font-black uppercase tracking-[0.2em] break-words leading-tight opacity-40 italic">İzinli</span>
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
                                        </div>
                                    )
                                })
                            })()}
                        </div>

                        {/* Drag Overlay for smooth visuals while dragging */}
                        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
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
                                        style={{ height: `${Math.max(20, height)}px`, width: "100%" }}
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
                                    {/* Quick Jump / Actions Bar */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { icon: Phone, label: "Ara", color: "text-blue-600", bg: "bg-blue-50" },
                                            { icon: MessageSquare, label: "WhatsApp", color: "text-green-600", bg: "bg-green-50" },
                                            { icon: CalendarIcon, label: "Yeni", color: "text-purple-600", bg: "bg-purple-50" },
                                            { icon: Share2, label: "Paylaş", color: "text-orange-600", bg: "bg-orange-50" },
                                        ].map((action, i) => (
                                            <button key={i} className={cn("flex flex-col items-center justify-center p-3 rounded-2xl gap-2 transition-all hover:scale-105 active:scale-95", action.bg)}>
                                                <action.icon className={cn("size-5", action.color)} />
                                                <span className={cn("text-[9px] font-black uppercase tracking-tighter", action.color)}>{action.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Status Header Card */}
                                    <div className={cn(
                                        "p-6 rounded-[32px] border-2 flex items-center gap-4 transition-all hover:shadow-lg",
                                        getStatusColor(selectedApt.status),
                                        "bg-opacity-10"
                                    )}>
                                        <div className="size-14 rounded-2xl bg-white shadow-md flex items-center justify-center border border-current/20">
                                            <AlertTriangle className="size-7 text-current" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">GÜNCEL DURUM</span>
                                            <span className="text-xl font-black uppercase">{selectedApt.status}</span>
                                        </div>
                                        <div className="ml-auto">
                                            <div className="size-3 rounded-full bg-current animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Customer Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-3">Müşteri Bilgileri</h4>
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">Müşteri Kartı</span>
                                        </div>
                                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 space-y-5 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/40 group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:scale-110 transition-transform">
                                                    <User className="size-8 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-gray-900 tracking-tight">{selectedApt.customer_name}</span>
                                                    {selectedApt.is_vip && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Premium Üye (VIP)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 pt-2">
                                                <div className="flex items-center gap-4 group cursor-pointer">
                                                    <div className="size-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                                                        <Phone className="size-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Telefon</span>
                                                        <span className="text-sm font-bold text-gray-700">{selectedApt.phone || "Belirtilmemiş"}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 group cursor-pointer">
                                                    <div className="size-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                                                        <Mail className="size-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">E-posta</span>
                                                        <span className="text-sm font-bold text-gray-700">{selectedApt.email || "Belirtilmemiş"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Appointment Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-3">Hizmet & Zaman</h4>
                                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 space-y-6 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/40">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-14 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm flex items-center justify-center">
                                                        <CreditCard className="size-7 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alınan Hizmet</span>
                                                        <span className="text-base font-black text-gray-900 uppercase tracking-tight leading-tight">{selectedApt.service_name}</span>
                                                    </div>
                                                </div>
                                                <div className="px-5 py-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-sm">
                                                    <span className="text-lg font-black text-primary">{selectedApt.total_price} TL</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                                <div className="size-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-primary/60">
                                                    <Clock className="size-6" />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Randevu Zamanı</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-black text-gray-900 tabular-nums">{selectedApt.start_time}</span>
                                                        <ArrowRight className="size-4 text-primary/40" />
                                                        <span className="text-xl font-black text-gray-900 tabular-nums">{selectedApt.end_time}</span>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                    <span className="text-[10px] font-black text-primary uppercase">45 DK</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Internal Notes */}
                                    <div className="space-y-4 pb-8">
                                        <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary pl-3">İşletme Notları</h4>
                                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                                            <RxTextarea
                                                placeholder="Bu randevu için teknik bir not veya özel bir istek ekleyin..."
                                                className="min-h-[120px] rounded-2xl bg-gray-50/50 border-none focus:ring-2 focus:ring-primary/20 text-[13px] font-bold py-4"
                                                defaultValue={selectedApt.internal_note || ""}
                                                id="appointment-note"
                                            />
                                            <RxButton
                                                size="sm"
                                                className="w-full rounded-xl gap-2 active:scale-95 transition-all shadow-lg shadow-primary/10"
                                                onClick={async () => {
                                                    const note = (document.getElementById("appointment-note") as HTMLTextAreaElement).value
                                                    if (!note) return
                                                    const res = await addAppointmentNoteAction(selectedApt.id, businessId, note)
                                                    if (res.success) {
                                                        toast.success("Not başarıyla kaydedildi.")
                                                    } else {
                                                        toast.error(res.error?.message || "Not kaydedilemedi.")
                                                    }
                                                }}
                                            >
                                                <Sparkles className="size-3" />
                                                NOTU KAYDET
                                            </RxButton>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-gray-100 bg-white grid grid-cols-2 gap-4">
                                    <RxButton variant="ghost" className="h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] border border-gray-200" onClick={() => setSelectedApt(null)}>İptal Et</RxButton>
                                    <RxButton variant="primary" className="h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20">Onayla</RxButton>
                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence>
        </div>
    )
}
