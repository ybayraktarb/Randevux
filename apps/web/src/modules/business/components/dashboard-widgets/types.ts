// Dashboard Widget Types

export interface TodayApt {
  id: string
  time: string
  customer: string
  service: string
  staff: string
  status: "Tamamlandı" | "ongoing" | "Onaylandı" | "Bekliyor" | "break"
}

export interface PendingItem {
  id: string
  customer: string
  service: string
  date: string
  time: string
  staff: string
}

export interface NoShowRecord {
  customer: string
  service: string
  date: string
  staff: string
}

export interface StaffPerf {
  name: string
  count: number
  percent: number
}

export interface EfficiencyMetric {
  name: string
  completionRate: number
  totalHours: number
}

export interface ServiceMetric {
  name: string
  count: number
  revenue: number
}
