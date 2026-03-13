// ─── DATE / TIME UTILITIES ──────────────────────────────────────────────────

/**
 * Parses a HH:MM string to minutes since midnight
 * @example "14:30" => 870
 */
export function parseTime(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

/**
 * Formats minutes since midnight back to a HH:MM string
 * @example 870 => "14:30"
 */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Checks if two time intervals overlap
 */
export function isOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return Math.max(start1, start2) < Math.min(end1, end2)
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function dateToYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Calculate total start and end time string (HH:MM:SS) based on offset and durations.
 */
export function calculateTimeRange(timeStr: string, totalDurationMinutes: number): { startTimeStr: string, endTimeStr: string } {
    const startMinutes = parseTime(timeStr)
    const endMinutes = startMinutes + totalDurationMinutes
    const endHH = String(Math.floor(endMinutes / 60)).padStart(2, "0")
    const endMM = String(endMinutes % 60).padStart(2, "0")

    return {
        startTimeStr: `${timeStr}:00`,
        endTimeStr: `${endHH}:${endMM}:00`
    }
}
