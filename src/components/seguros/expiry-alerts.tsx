'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle, CalendarClock, ChevronRight, Loader2, Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ExpiringPolicy = {
  id: string
  verifyCode: string
  policyNumber: string | null
  nombre: string
  apellido: string | null
  marca: string | null
  modelo: string | null
  placa: string | null
  vigenciaHasta: string | null
  compania: string | null
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function ExpiryAlerts() {
  const router = useRouter()
  const [expiring, setExpiring] = useState<ExpiringPolicy[]>([])
  const [expired, setExpired] = useState<ExpiringPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'expiring' | 'expired'>('expiring')

  useEffect(() => {
    let alive = true
    fetch('/api/policies/expiring?days=30')
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setExpiring(d.expiring || [])
          setExpired(d.expired || [])
          setLoading(false)
        }
      })
      .catch(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <Card className="border-white/10 bg-slate-900/60">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </CardContent>
      </Card>
    )
  }

  const list = tab === 'expiring' ? expiring : expired
  const hasAny = expiring.length > 0 || expired.length > 0

  if (!hasAny) {
    // Don't render the widget at all if there's nothing to show
    return null
  }

  return (
    <Card className="border-amber-500/20 bg-slate-900/60">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Alertas de Vencimiento</h3>
        <div className="ml-auto flex items-center gap-1">
          {expiring.length > 0 && (
            <button
              onClick={() => setTab('expiring')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                tab === 'expiring'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Por vencer ({expiring.length})
            </button>
          )}
          {expired.length > 0 && (
            <button
              onClick={() => setTab('expired')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                tab === 'expired'
                  ? 'bg-red-500/15 text-red-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vencidas ({expired.length})
            </button>
          )}
        </div>
      </div>
      <CardContent className="p-2">
        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            {tab === 'expiring' ? 'No hay pólizas por vencer en los próximos 30 días.' : 'No hay pólizas vencidas.'}
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {list.map((p) => {
              const days = p.vigenciaHasta ? daysUntil(p.vigenciaHasta) : 0
              const isExpired = days < 0
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(`?view=admin`)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isExpired ? 'bg-red-500/15' : days <= 7 ? 'bg-red-500/15' : 'bg-amber-500/15'
                  }`}>
                    <CalendarClock className={`h-4 w-4 ${
                      isExpired ? 'text-red-300' : days <= 7 ? 'text-red-300' : 'text-amber-300'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {p.nombre} {p.apellido || ''}
                      </p>
                      <span className="font-mono text-[10px] text-emerald-300">
                        {p.policyNumber || p.verifyCode}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      {p.marca || '—'} {p.modelo || ''} · Placa {p.placa || '—'} · Vence {p.vigenciaHasta}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        isExpired
                          ? 'border-red-500/30 bg-red-500/10 text-red-300'
                          : days <= 7
                            ? 'border-red-500/30 bg-red-500/10 text-red-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      }
                    >
                      <Clock className="mr-1 h-2.5 w-2.5" />
                      {isExpired ? `Hace ${Math.abs(days)}d` : `${days}d`}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-slate-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
