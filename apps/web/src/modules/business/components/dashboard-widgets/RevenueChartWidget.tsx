"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-gray-200/50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-gray-900">
          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export function RevenueChartWidget({ revenueData, totalRevenue }: { revenueData: { week: string; revenue: number }[]; totalRevenue: number }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-gray-200/50 overflow-hidden h-full">
      <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Gelir Analizi</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Aylık Performans Trendi</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl font-black text-emerald-500 tracking-tighter">₺{totalRevenue.toLocaleString("tr-TR")}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOPLAM</span>
          </div>
        </div>
      </div>
      <div className="px-4 pt-8 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#6C63FF" strokeWidth={3} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
