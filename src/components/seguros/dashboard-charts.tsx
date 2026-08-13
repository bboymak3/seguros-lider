'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { TrendingUp, Car, MapPin, PieChart as PieIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export type Stats = {
  total: number
  pendientes: number
  aprobadas: number
  rechazadas: number
  anuladas: number
  hoy: number
  ayer: number
  aprobadasHoy: number
  withDocs: number
  deltaHoy: number
  deltaPercent: number
  timeseries: { date: string; label: string; total: number; aprobadas: number; pendientes: number }[]
  statusDistribution: { name: string; value: number; color: string }[]
  topBrands: { name: string; value: number }[]
  topEstados: { name: string; value: number }[]
  tipoDistribution: { name: string; value: number }[]
}

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
  padding: '8px 12px',
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label && <p className="mb-1 font-medium text-slate-300">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-1.5 text-slate-200">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

export function DashboardCharts({
  stats,
  onDrillDown,
}: {
  stats: Stats | null
  onDrillDown?: (type: 'status' | 'brand' | 'estado', value: string) => void
}) {
  if (!stats) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="border-white/10 bg-slate-900/60">
            <CardContent className="h-72 animate-pulse p-4">
              <div className="h-full w-full rounded bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const hasData = stats.total > 0

  return (
    <div className="space-y-4">
      {/* Timeseries - full width */}
      <Card className="border-white/10 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Solicitudes — últimos 14 días</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Aprobadas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Pendientes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" /> Total
            </span>
          </div>
        </div>
        <CardContent className="p-4">
          {hasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.timeseries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAprob" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#gradTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="aprobadas"
                  name="Aprobadas"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradAprob)"
                />
                <Area
                  type="monotone"
                  dataKey="pendientes"
                  name="Pendientes"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#gradPend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </Card>

      {/* Row: status pie + top brands + top estados */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Status distribution */}
        <Card className={`border-white/10 bg-slate-900/60 ${onDrillDown ? 'transition-colors hover:border-emerald-500/30' : ''}`}>
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <PieIcon className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Distribución por estado</h3>
            {onDrillDown && (
              <span className="ml-auto text-[10px] text-slate-500">Clic para filtrar</span>
            )}
          </div>
          <CardContent className="p-4">
            {stats.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    onClick={(_, index) => {
                      if (onDrillDown) {
                        const item = stats.statusDistribution[index]
                        const statusMap: Record<string, string> = {
                          'Aprobadas': 'APROBADA',
                          'Pendientes': 'PENDIENTE',
                          'Rechazadas': 'RECHAZADA',
                          'Anuladas': 'ANULADA',
                        }
                        onDrillDown('status', statusMap[item.name] || item.name.toUpperCase())
                      }
                    }}
                    className={onDrillDown ? 'cursor-pointer' : ''}
                  >
                    {stats.statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" className="transition-opacity hover:opacity-80" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        {/* Top brands */}
        <Card className={`border-white/10 bg-slate-900/60 ${onDrillDown ? 'transition-colors hover:border-emerald-500/30' : ''}`}>
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <Car className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Marcas más aseguradas</h3>
            {onDrillDown && (
              <span className="ml-auto text-[10px] text-slate-500">Clic para filtrar</span>
            )}
          </div>
          <CardContent className="p-4">
            {stats.topBrands.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.topBrands} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar
                    dataKey="value"
                    name="Pólizas"
                    radius={[0, 4, 4, 0]}
                    onClick={(data: { name?: string }) => {
                      if (onDrillDown && data?.name) onDrillDown('brand', data.name)
                    }}
                    className={onDrillDown ? 'cursor-pointer' : ''}
                  >
                    {stats.topBrands.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#10b981' : i === 1 ? '#14b8a6' : '#06b6d4'} className="transition-opacity hover:opacity-80" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        {/* Top estados */}
        <Card className={`border-white/10 bg-slate-900/60 ${onDrillDown ? 'transition-colors hover:border-emerald-500/30' : ''}`}>
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Distribución geográfica</h3>
            {onDrillDown && (
              <span className="ml-auto text-[10px] text-slate-500">Clic para filtrar</span>
            )}
          </div>
          <CardContent className="p-4">
            {stats.topEstados.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.topEstados} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar
                    dataKey="value"
                    name="Pólizas"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    onClick={(data: { name?: string }) => {
                      if (onDrillDown && data?.name) onDrillDown('estado', data.name)
                    }}
                    className={onDrillDown ? 'cursor-pointer' : ''}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-slate-500">
      <PieIcon className="h-8 w-8 opacity-30" />
      <p className="text-xs">Sin datos suficientes</p>
    </div>
  )
}
