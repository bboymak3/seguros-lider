'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Activity, FilePlus2, FileEdit, FileCheck2, FileX, Ban,
  Paperclip, FileMinus, FileText, Search, ChevronLeft, ChevronRight,
  Calendar, X, Filter, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type ActivityItem = {
  id: string
  action: string
  description: string
  actor: string
  createdAt: string
  metadata: string | null
  policy: {
    id: string
    verifyCode: string
    policyNumber: string | null
    nombre: string
    apellido: string | null
    status: string
  }
}

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  CREATED: { icon: FilePlus2, color: 'text-sky-300', bg: 'bg-sky-500/15 ring-sky-500/20' },
  UPDATED: { icon: FileEdit, color: 'text-slate-600', bg: 'bg-slate-500/15 ring-slate-500/20' },
  APPROVED: { icon: FileCheck2, color: 'text-emerald-300', bg: 'bg-emerald-500/15 ring-emerald-500/20' },
  REJECTED: { icon: FileX, color: 'text-red-300', bg: 'bg-red-500/15 ring-red-500/20' },
  ANULADA: { icon: Ban, color: 'text-slate-600', bg: 'bg-slate-500/15 ring-slate-500/20' },
  DOCUMENT_UPLOADED: { icon: Paperclip, color: 'text-violet-300', bg: 'bg-violet-500/15 ring-violet-500/20' },
  DOCUMENT_DELETED: { icon: FileMinus, color: 'text-amber-300', bg: 'bg-amber-500/15 ring-amber-500/20' },
  PDF_GENERATED: { icon: FileText, color: 'text-teal-300', bg: 'bg-teal-500/15 ring-teal-500/20' },
  STATUS_CHANGED: { icon: Activity, color: 'text-slate-600', bg: 'bg-slate-500/15 ring-slate-500/20' },
}

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'Todas las acciones' },
  { value: 'CREATED', label: 'Creaciones' },
  { value: 'APPROVED', label: 'Aprobaciones' },
  { value: 'REJECTED', label: 'Rechazos' },
  { value: 'UPDATED', label: 'Actualizaciones' },
  { value: 'DOCUMENT_UPLOADED', label: 'Docs. subidos' },
  { value: 'DOCUMENT_DELETED', label: 'Docs. eliminados' },
  { value: 'PDF_GENERATED', label: 'PDFs generados' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-VE')
}

export function ActivityFeed({ onSelectPolicy }: { onSelectPolicy: (id: string) => void }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(
    async (opts?: { page?: number; action?: string; from?: string; to?: string }) => {
      setLoading(true)
      try {
        const p = opts?.page ?? page
        const a = opts?.action ?? actionFilter
        const from = opts?.from ?? dateFrom
        const to = opts?.to ?? dateTo
        const params = new URLSearchParams()
        params.set('page', String(p))
        params.set('pageSize', '15')
        if (a && a !== 'ALL') params.set('action', a)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        const r = await fetch(`/api/activities?${params}`)
        if (r.ok) {
          const { activities, pagination: pg } = await r.json()
          setActivities(activities)
          setPagination(pg)
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    },
    [page, actionFilter, dateFrom, dateTo]
  )

  useEffect(() => {
    load({ page: 1 })
  }, [])

  function applyFilters() {
    setPage(1)
    load({ page: 1, action: actionFilter, from: dateFrom, to: dateTo })
  }

  function clearFilters() {
    setActionFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    load({ page: 1, action: 'ALL', from: '', to: '' })
  }

  function goToPage(p: number) {
    setPage(p)
    load({ page: p })
  }

  const hasFilters = actionFilter !== 'ALL' || dateFrom || dateTo

  function exportCsv() {
    const params = new URLSearchParams()
    if (actionFilter !== 'ALL') params.set('action', actionFilter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    window.open(`/api/activities/export?${params}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Activity className="h-5 w-5 text-emerald-400" />
            Actividad Global
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Historial completo de acciones en todas las pólizas del sistema.
          </p>
        </div>
        {pagination && pagination.total > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="border-slate-400 bg-slate-200 text-slate-900 hover:bg-slate-300 hover:text-slate-900"
          >
            <Download className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-300 bg-slate-200/40 p-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Acción</label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] bg-slate-100/50 border-slate-300 h-9">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Desde</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-[150px] bg-slate-100/50 border-slate-300"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-slate-500">Hasta</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-[150px] bg-slate-100/50 border-slate-300"
          />
        </div>
        <Button size="sm" onClick={applyFilters} className="bg-emerald-500 text-slate-900 hover:bg-emerald-400">
          <Filter className="mr-1 h-3.5 w-3.5" /> Filtrar
        </Button>
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={clearFilters} className="text-slate-500 hover:text-slate-900">
            <X className="mr-1 h-3.5 w-3.5" /> Limpiar
          </Button>
        )}
        {pagination && (
          <span className="ml-auto text-xs text-slate-500">
            {pagination.total} evento(s) total
          </span>
        )}
      </div>

      {/* Activity list */}
      <Card className="border-slate-300 bg-slate-200/60">
        <CardContent className="p-2">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <Activity className="h-8 w-8 opacity-30" />
              <p className="text-sm">Sin actividad registrada con estos filtros.</p>
            </div>
          ) : (
            <div className="max-h-[36rem] overflow-y-auto scrollbar-thin">
              {activities.map((a) => {
                const cfg = ICONS[a.action] || { icon: Activity, color: 'text-slate-600', bg: 'bg-slate-500/15 ring-slate-500/20' }
                const Icon = cfg.icon
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelectPolicy(a.policy.id)}
                    className="group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-200"
                  >
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800">{a.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-600">
                          {a.policy.nombre} {a.policy.apellido || ''}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-emerald-400">
                          {a.policy.policyNumber || a.policy.verifyCode}
                        </span>
                        <span>·</span>
                        <Badge
                          variant="outline"
                          className={
                            a.policy.status === 'APROBADA'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : a.policy.status === 'RECHAZADA'
                                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          }
                        >
                          {a.policy.status}
                        </Badge>
                        <span>·</span>
                        <span>{timeAgo(a.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-slate-600" />
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 px-4 py-3">
            <p className="text-xs text-slate-500">
              Página <span className="font-semibold text-slate-800">{pagination.page}</span> de{' '}
              <span className="font-semibold text-slate-800">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => goToPage(page - 1)}
                className="h-8 border-slate-400 bg-slate-200 text-slate-900 hover:bg-slate-300 hover:text-slate-900 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, idx) => {
                const start = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2))
                const p = start + idx
                if (p > pagination.totalPages) return null
                return (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === pagination.page ? 'default' : 'outline'}
                    onClick={() => goToPage(p)}
                    className={`h-8 w-8 p-0 ${
                      p === pagination.page
                        ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
                        : 'border-slate-400 bg-slate-200 text-slate-900 hover:bg-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </Button>
                )
              })}
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasNext}
                onClick={() => goToPage(page + 1)}
                className="h-8 border-slate-400 bg-slate-200 text-slate-900 hover:bg-slate-300 hover:text-slate-900 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
