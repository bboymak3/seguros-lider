'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  Lock,
  LogOut,
  ArrowLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  FileCheck,
  Loader2,
  Menu,
  X,
  Download,
  CheckSquare,
  Square,
  Trash2,
  Ban,
  Activity,
  FileSpreadsheet,
  Percent,
  FilePlus2,
  Paperclip,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminPolicyDetail } from './admin-policy-detail'
import SolicitudForm from './solicitud-form'
import { DashboardCharts, type Stats as ChartStats } from './dashboard-charts'
import { AdminSettings } from './admin-settings'
import { ExpiryAlerts } from './expiry-alerts'
import { NotificationsBell } from './notifications-bell'
import { ActivityFeed } from './activity-feed'
import { toast } from 'sonner'

type Policy = Record<string, unknown> & {
  id: string
  verifyCode: string
  policyNumber?: string | null
  status: string
  nombre: string
  apellido?: string | null
  cedula: string
  placa?: string | null
  marca?: string | null
  modelo?: string | null
  ano?: string | null
  createdAt: string
  cedulaDocName?: string | null
  tituloDocName?: string | null
}

type View = 'dashboard' | 'pendientes' | 'todas' | 'nueva' | 'settings' | 'actividad'

const ADMIN_PASSWORD = 'admin123'

export default function AdminDashboard({
  onExit,
}: {
  onExit: () => void
}) {
  const [authed, setAuthed] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('seguros_admin') === '1'
  )
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  function tryLogin() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
      sessionStorage.setItem('seguros_admin', '1')
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  function logout() {
    sessionStorage.removeItem('seguros_admin')
    setAuthed(false)
    setPw('')
    onExit()
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.12),transparent)]" />
        <Card className="relative w-full max-w-sm border-white/10 bg-slate-900/80 backdrop-blur">
          <CardContent className="p-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <Lock className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="text-center text-xl font-bold">Acceso Administrativo</h1>
            <p className="mt-1 text-center text-sm text-slate-400">
              Ingresa tu contraseña para continuar
            </p>
            <div className="mt-6 space-y-3">
              <Input
                type="password"
                placeholder="Contraseña"
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value)
                  setPwError(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && tryLogin()}
                className="bg-slate-950/50 border-white/10"
              />
              {pwError && (
                <p className="text-xs text-red-400">Contraseña incorrecta</p>
              )}
              <Button
                onClick={tryLogin}
                className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                Entrar
              </Button>
              <Button
                variant="ghost"
                onClick={onExit}
                className="w-full text-slate-400 hover:text-white"
              >
                Volver
              </Button>
            </div>
            <p className="mt-4 text-center text-[10px] text-slate-500">
              Demo: <span className="font-mono">admin123</span>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AdminShell onExit={onExit} onLogout={logout} />
}

function AdminShell({
  onExit,
  onLogout,
}: {
  onExit: () => void
  onLogout: () => void
}) {
  const [view, setView] = useState<View>('dashboard')
  const [stats, setStats] = useState<ChartStats | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [pagination, setPagination] = useState<{
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null>(null)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch('/api/stats')
      if (r.ok) setStats(await r.json())
    } catch {
      /* ignore */
    }
  }, [])

  const loadPolicies = useCallback(
    async (opts?: { status?: string; page?: number; from?: string; to?: string }) => {
      setLoading(true)
      try {
        const status = opts?.status
        const p = opts?.page ?? page
        const from = opts?.from ?? dateFrom
        const to = opts?.to ?? dateTo
        const params = new URLSearchParams()
        if (status && status !== 'ALL') params.set('status', status)
        if (search) params.set('q', search)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        params.set('page', String(p))
        params.set('pageSize', '10')
        const r = await fetch(`/api/policies?${params}`)
        if (r.ok) {
          const { policies, pagination: pg } = await r.json()
          setPolicies(policies)
          setPagination(pg)
        }
      } catch {
        toast.error('Error al cargar')
      } finally {
        setLoading(false)
      }
    },
    [search, page, dateFrom, dateTo]
  )

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    setPage(1)
    if (view === 'dashboard') loadPolicies({ page: 1 })
    else if (view === 'pendientes') loadPolicies({ status: 'PENDIENTE', page: 1 })
    else if (view === 'todas') loadPolicies({ status: statusFilter, page: 1 })
  }, [view])

  // Keyboard shortcuts: "/" focuses search, "g d/p/t/s" navigates
  useEffect(() => {
    let gPressed = false
    let gTimer: ReturnType<typeof setTimeout> | null = null

    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // "/" to focus search (only when not typing)
      if (e.key === '/' && !isTyping) {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
        return
      }

      // "g" then "d/p/t/s" for navigation
      if (!isTyping) {
        if (e.key === 'g' && !gPressed) {
          gPressed = true
          if (gTimer) clearTimeout(gTimer)
          gTimer = setTimeout(() => {
            gPressed = false
          }, 800)
          return
        }
        if (gPressed) {
          if (e.key === 'd') {
            setView('dashboard')
          } else if (e.key === 'p') {
            setView('pendientes')
          } else if (e.key === 't') {
            setView('todas')
          } else if (e.key === 's') {
            setView('settings')
          } else if (e.key === 'n') {
            setView('nueva')
          }
          gPressed = false
          if (gTimer) clearTimeout(gTimer)
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (gTimer) clearTimeout(gTimer)
    }
  }, [])

  function refreshAll() {
    loadStats()
    if (view === 'pendientes') loadPolicies({ status: 'PENDIENTE', page: 1 })
    else if (view === 'todas') loadPolicies({ status: statusFilter, page: 1 })
    else loadPolicies({ page: 1 })
  }

  function goToPage(p: number) {
    setPage(p)
    if (view === 'pendientes') loadPolicies({ status: 'PENDIENTE', page: p })
    else if (view === 'todas') loadPolicies({ status: statusFilter, page: p })
    else loadPolicies({ page: p })
  }

  function applyDateFilter() {
    setPage(1)
    if (view === 'pendientes') loadPolicies({ status: 'PENDIENTE', page: 1, from: dateFrom, to: dateTo })
    else loadPolicies({ status: statusFilter, page: 1, from: dateFrom, to: dateTo })
  }

  function clearDateFilter() {
    setDateFrom('')
    setDateTo('')
    setPage(1)
    if (view === 'pendientes') loadPolicies({ status: 'PENDIENTE', page: 1, from: '', to: '' })
    else loadPolicies({ status: statusFilter, page: 1, from: '', to: '' })
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === policies.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(policies.map((p) => p.id)))
    }
  }

  async function bulkAction(action: 'approve' | 'reject' | 'delete' | 'anular') {
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos una póliza')
      return
    }
    const verb =
      action === 'approve'
        ? 'aprobar'
        : action === 'reject'
          ? 'rechazar'
          : action === 'anular'
            ? 'anular'
            : 'eliminar'
    if (action === 'delete' && !confirm(`¿Eliminar ${selectedIds.size} póliza(s) permanentemente?`)) {
      return
    }
    setBulkBusy(true)
    try {
      const r = await fetch('/api/policies/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      })
      if (!r.ok) throw new Error('Error')
      const { affected } = await r.json()
      toast.success(`${affected} póliza(s) ${verb === 'eliminar' ? 'eliminada(s)' : `marcada(s) como ${verb}`}`)
      setSelectedIds(new Set())
      refreshAll()
    } catch {
      toast.error('Error en acción masiva')
    } finally {
      setBulkBusy(false)
    }
  }

  function exportCsv() {
    const params = new URLSearchParams()
    if (view === 'pendientes') params.set('status', 'PENDIENTE')
    else if (view === 'todas' && statusFilter !== 'ALL') params.set('status', statusFilter)
    if (search) params.set('q', search)
    window.open(`/api/policies/export?${params}`, '_blank')
    toast.success('Exportando CSV...')
  }

  if (view === 'nueva') {
    return (
      <SolicitudForm
        onDone={() => {
          setView('pendientes')
          refreshAll()
          toast.success('Solicitud creada')
        }}
        onBack={() => setView('dashboard')}
      />
    )
  }

  if (selectedId) {
    return (
      <AdminPolicyDetail
        id={selectedId}
        onNavigate={(newId) => setSelectedId(newId)}
        onBack={() => {
          setSelectedId(null)
          refreshAll()
        }}
      />
    )
  }

  const navItems: { key: View; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pendientes', label: 'Solicitud de Pólizas', icon: Clock, badge: stats?.pendientes },
    { key: 'todas', label: 'Todas las Pólizas', icon: FileText },
    { key: 'actividad', label: 'Actividad', icon: Activity },
    { key: 'nueva', label: 'Nueva Solicitud', icon: Plus },
    { key: 'settings', label: 'Configuración', icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-slate-900 transition-transform lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-4 w-4 text-slate-950" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">Seguros Líder</p>
            <p className="text-[10px] uppercase tracking-wider text-emerald-400">
              Admin Panel
            </p>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((n) => (
            <button
              key={n.key}
              onClick={() => {
                setView(n.key)
                setSelectedIds(new Set())
                setSidebarOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                view === n.key
                  ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <n.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{n.label}</span>
              {n.badge ? (
                <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/20">
                  {n.badge}
                </Badge>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Mini stats in sidebar */}
        {stats && (
          <div className="mx-3 mt-4 rounded-lg border border-white/10 bg-slate-950/50 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-400">
              Resumen
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Aprobadas hoy</span>
                <span className="font-semibold text-emerald-300">{stats.aprobadasHoy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Con documentos</span>
                <span className="font-semibold text-sky-300">{stats.withDocs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="font-semibold text-slate-200">{stats.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="mx-3 mt-3 rounded-lg border border-white/10 bg-slate-950/50 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-400">
            Atajos de teclado
          </p>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>Buscar</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">/</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Dashboard</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">g d</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Pendientes</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">g p</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Todas</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">g t</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Configuración</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">g s</kbd>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-3">
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start text-slate-400 hover:text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </button>
          <h1 className="text-lg font-semibold capitalize">
            {navItems.find((n) => n.key === view)?.label || 'Dashboard'}
          </h1>
          {selectedIds.size > 0 && (
            <Badge className="bg-emerald-500/15 text-emerald-300">
              {selectedIds.size} seleccionada(s)
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            {view !== 'dashboard' && view !== 'nueva' && view !== 'settings' && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <FileSpreadsheet className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </Button>
            )}
            <NotificationsBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (view === 'pendientes' || view === 'todas') && (
          <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-2 backdrop-blur sm:px-6">
            <span className="text-xs font-medium text-emerald-300">
              {selectedIds.size} seleccionada(s)
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => bulkAction('approve')}
                disabled={bulkBusy}
                className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkAction('reject')}
                disabled={bulkBusy}
                className="border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Rechazar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkAction('anular')}
                disabled={bulkBusy}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Ban className="mr-1 h-3.5 w-3.5" />
                Anular
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkAction('delete')}
                disabled={bulkBusy}
                className="border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Eliminar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-white"
              >
                Limpiar
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {view === 'dashboard' && (
            <DashboardView
              stats={stats}
              policies={policies}
              loading={loading}
              onSelect={setSelectedId}
              onDrillDown={(type, value) => {
                if (type === 'status') {
                  setStatusFilter(value)
                  setSearch('')
                  setView('todas')
                  loadPolicies({ status: value, page: 1 })
                  toast.info(`Filtrando por estado: ${value}`)
                } else if (type === 'brand') {
                  setSearch(value)
                  setStatusFilter('ALL')
                  setView('todas')
                  loadPolicies({ status: 'ALL', page: 1 })
                  toast.info(`Filtrando por marca: ${value}`)
                } else if (type === 'estado') {
                  setSearch(value)
                  setStatusFilter('ALL')
                  setView('todas')
                  loadPolicies({ status: 'ALL', page: 1 })
                  toast.info(`Filtrando por estado: ${value}`)
                }
              }}
              onCardClick={(filter) => {
                setStatusFilter(filter)
                setSearch('')
                setPage(1)
                setView('todas')
                loadPolicies({ status: filter, page: 1 })
                toast.info(
                  filter === 'ALL'
                    ? 'Mostrando todas las pólizas'
                    : `Filtrando por estado: ${filter}`
                )
              }}
            />
          )}
          {view === 'pendientes' && (
            <ListView
              title="Solicitudes de Pólizas Pendientes"
              description="Pólizas solicitadas que aún no han sido aprobadas por el administrador."
              policies={policies}
              loading={loading}
              search={search}
              setSearch={setSearch}
              onSearch={() => loadPolicies({ status: 'PENDIENTE', page: 1 })}
              onSelect={setSelectedId}
              onRefresh={() => loadPolicies({ status: 'PENDIENTE', page })}
              emptyHint="No hay solicitudes pendientes."
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              showBulkSelect
              pagination={pagination}
              page={page}
              goToPage={goToPage}
              dateFrom={dateFrom}
              dateTo={dateTo}
              setDateFrom={setDateFrom}
              setDateTo={setDateTo}
              applyDateFilter={applyDateFilter}
              clearDateFilter={clearDateFilter}
            />
          )}
          {view === 'todas' && (
            <ListView
              title="Todas las Pólizas"
              description="Consulta y administra todas las solicitudes registradas."
              policies={policies}
              loading={loading}
              search={search}
              setSearch={setSearch}
              onSearch={() => loadPolicies({ status: statusFilter, page: 1 })}
              onSelect={setSelectedId}
              onRefresh={() => loadPolicies({ status: statusFilter, page })}
              emptyHint="No hay pólizas registradas."
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              showBulkSelect
              statusFilter={statusFilter}
              setStatusFilter={(v) => {
                setStatusFilter(v)
                setPage(1)
                loadPolicies({ status: v, page: 1 })
              }}
              pagination={pagination}
              page={page}
              goToPage={goToPage}
              dateFrom={dateFrom}
              dateTo={dateTo}
              setDateFrom={setDateFrom}
              setDateTo={setDateTo}
              applyDateFilter={applyDateFilter}
              clearDateFilter={clearDateFilter}
            />
          )}
          {view === 'settings' && <AdminSettings />}
          {view === 'actividad' && (
            <ActivityFeed onSelectPolicy={(pid) => setSelectedId(pid)} />
          )}
        </main>
      </div>
    </div>
  )
}

function DashboardView({
  stats,
  policies,
  loading,
  onSelect,
  onDrillDown,
  onCardClick,
}: {
  stats: ChartStats | null
  policies: Policy[]
  loading: boolean
  onSelect: (id: string) => void
  onDrillDown?: (type: 'status' | 'brand' | 'estado', value: string) => void
  onCardClick?: (filter: string) => void
}) {
  const recent = policies.slice(0, 6)
  const approvalRate =
    stats && stats.total > 0
      ? Math.round((stats.aprobadas / stats.total) * 100)
      : 0

  const cards = [
    {
      label: 'Total Pólizas',
      value: stats?.total ?? 0,
      icon: FileText,
      color: 'text-sky-300',
      bg: 'bg-sky-500/10',
      ring: 'ring-sky-500/20',
      sub: stats ? `${stats.hoy} hoy` : '',
      filter: 'ALL',
    },
    {
      label: 'Pendientes',
      value: stats?.pendientes ?? 0,
      icon: Clock,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/20',
      sub: 'Requieren acción',
      filter: 'PENDIENTE',
    },
    {
      label: 'Aprobadas',
      value: stats?.aprobadas ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
      ring: 'ring-emerald-500/20',
      sub: stats ? `${stats.aprobadasHoy} hoy` : '',
      filter: 'APROBADA',
    },
    {
      label: 'Rechazadas',
      value: stats?.rechazadas ?? 0,
      icon: XCircle,
      color: 'text-red-300',
      bg: 'bg-red-500/10',
      ring: 'ring-red-500/20',
      sub: 'Histórico',
      filter: 'RECHAZADA',
    },
    {
      label: 'Solicitudes Hoy',
      value: stats?.hoy ?? 0,
      icon: stats && stats.deltaHoy >= 0 ? TrendingUp : TrendingDown,
      color: 'text-violet-300',
      bg: 'bg-violet-500/10',
      ring: 'ring-violet-500/20',
      sub: stats
        ? `${stats.deltaHoy >= 0 ? '↑' : '↓'} ${Math.abs(stats.deltaPercent)}% vs ayer`
        : '',
      subColor: stats && stats.deltaHoy >= 0 ? 'text-emerald-300' : 'text-red-300',
      filter: null, // today filter not status-based
    },
    {
      label: 'Tasa Aprobación',
      value: stats && stats.total > 0 ? approvalRate + '%' : '—',
      icon: Percent,
      color: 'text-teal-300',
      bg: 'bg-teal-500/10',
      ring: 'ring-teal-500/20',
      sub: stats && stats.total > 0 ? `${stats.aprobadas} de ${stats.total}` : '',
      filter: 'APROBADA',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const clickable = onCardClick && c.filter !== null
          return (
            <Card
              key={c.label}
              className={`border-white/10 bg-slate-900/60 ring-1 ${c.ring} transition-all hover:scale-[1.02] ${
                clickable ? 'cursor-pointer hover:bg-slate-900/80 hover:shadow-lg hover:shadow-emerald-500/5' : ''
              }`}
              onClick={() => clickable && onCardClick!(c.filter)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{c.label}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
                    <c.icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                  {c.value}
                </p>
                {c.sub && (
                  <p className={`mt-0.5 text-[11px] ${c.subColor || 'text-slate-400'}`}>
                    {c.sub}
                  </p>
                )}
                {clickable && (
                  <p className="mt-1.5 text-[10px] font-medium text-emerald-400/70 opacity-0 transition-opacity group-hover:opacity-100">
                    Ver lista →
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <DashboardCharts stats={stats} onDrillDown={onDrillDown} />

      {/* Expiry alerts */}
      <ExpiryAlerts />

      {/* Recent */}
      <Card className="border-white/10 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <h2 className="font-semibold">Solicitudes recientes</h2>
          </div>
          <Badge variant="secondary" className="bg-white/5 text-slate-400">
            {policies.length} total
          </Badge>
        </div>
        <div className="p-2">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <FilePlus2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aún no hay solicitudes.</p>
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto">
              {recent.map((p) => (
                <PolicyRow key={p.id} p={p} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function ListView({
  title,
  description,
  policies,
  loading,
  search,
  setSearch,
  onSearch,
  onSelect,
  onRefresh,
  emptyHint,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  showBulkSelect,
  statusFilter,
  setStatusFilter,
  pagination,
  page,
  goToPage,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  applyDateFilter,
  clearDateFilter,
}: {
  title: string
  description: string
  policies: Policy[]
  loading: boolean
  search: string
  setSearch: (v: string) => void
  onSearch: () => void
  onSelect: (id: string) => void
  onRefresh: () => void
  emptyHint: string
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  showBulkSelect?: boolean
  statusFilter?: string
  setStatusFilter?: (v: string) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null
  page?: number
  goToPage?: (p: number) => void
  dateFrom?: string
  dateTo?: string
  setDateFrom?: (v: string) => void
  setDateTo?: (v: string) => void
  applyDateFilter?: () => void
  clearDateFilter?: () => void
}) {
  const allSelected = policies.length > 0 && selectedIds.size === policies.length
  const hasDateFilter = dateFrom || dateTo

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      {/* Search + status row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por nombre, cédula, placa, código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-9 bg-slate-900/60 border-white/10"
          />
        </div>
        {setStatusFilter && (
          <Select value={statusFilter || 'ALL'} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-slate-900/60 border-white/10">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="PENDIENTE">Pendientes</SelectItem>
              <SelectItem value="APROBADA">Aprobadas</SelectItem>
              <SelectItem value="RECHAZADA">Rechazadas</SelectItem>
              <SelectItem value="ANULADA">Anuladas</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" onClick={onSearch} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
          <Search className="mr-1 h-4 w-4" /> Buscar
        </Button>
        <Button variant="outline" onClick={onRefresh} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
          Actualizar
        </Button>
      </div>

      {/* Date range filter row */}
      {setDateFrom && setDateTo && applyDateFilter && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-slate-900/40 p-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Desde</label>
            <Input
              type="date"
              value={dateFrom || ''}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[150px] bg-slate-950/50 border-white/10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-slate-400">Hasta</label>
            <Input
              type="date"
              value={dateTo || ''}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[150px] bg-slate-950/50 border-white/10"
            />
          </div>
          <Button size="sm" onClick={applyDateFilter} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
            <Calendar className="mr-1 h-3.5 w-3.5" /> Filtrar
          </Button>
          {hasDateFilter && (
            <Button size="sm" variant="ghost" onClick={clearDateFilter} className="text-slate-400 hover:text-white">
              <X className="mr-1 h-3.5 w-3.5" /> Limpiar
            </Button>
          )}
          {pagination && (
            <span className="ml-auto text-xs text-slate-400">
              {pagination.total} resultado(s) total
            </span>
          )}
        </div>
      )}

      <Card className="border-white/10 bg-slate-900/60">
        {showBulkSelect && policies.length > 0 && (
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2">
            <button
              onClick={onToggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-emerald-400" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            <span className="text-xs text-slate-500">
              {policies.length} en esta página
            </span>
          </div>
        )}
        <div className="p-2">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-white/5" />
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <FileText className="h-8 w-8 opacity-30" />
              <p className="text-sm">{emptyHint}</p>
            </div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto">
              {policies.map((p) => (
                <PolicyRow
                  key={p.id}
                  p={p}
                  onSelect={onSelect}
                  selected={selectedIds.has(p.id)}
                  onToggleSelect={() => onToggleSelect(p.id)}
                  showSelect={showBulkSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {pagination && pagination.totalPages > 1 && goToPage && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            <p className="text-xs text-slate-400">
              Página <span className="font-semibold text-slate-200">{pagination.page}</span> de{' '}
              <span className="font-semibold text-slate-200">{pagination.totalPages}</span>
              <span className="ml-2 text-slate-500">({pagination.total} total)</span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasPrev}
                onClick={() => goToPage((page || 1) - 1)}
                className="h-8 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
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
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'
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
                onClick={() => goToPage((page || 1) + 1)}
                className="h-8 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
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

function PolicyRow({
  p,
  onSelect,
  selected,
  onToggleSelect,
  showSelect,
}: {
  p: Policy
  onSelect: (id: string) => void
  selected?: boolean
  onToggleSelect?: () => void
  showSelect?: boolean
}) {
  const statusColor =
    p.status === 'APROBADA'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : p.status === 'RECHAZADA'
        ? 'border-red-500/30 bg-red-500/10 text-red-300'
        : p.status === 'ANULADA'
          ? 'border-slate-500/30 bg-slate-500/10 text-slate-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-300'

  const initials = (String(p.nombre || '?').charAt(0) + String(p.apellido || '').charAt(0)).toUpperCase()

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-white/5 ${
        selected ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''
      }`}
    >
      {showSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect?.()
          }}
          className="shrink-0"
        >
          {selected ? (
            <CheckSquare className="h-5 w-5 text-emerald-400" />
          ) : (
            <Square className="h-5 w-5 text-slate-500 hover:text-slate-300" />
          )}
        </button>
      )}
      <button
        onClick={() => onSelect(p.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-semibold text-slate-200 ring-1 ring-white/10">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">
              {p.nombre} {p.apellido || ''}
            </p>
            <Badge variant="outline" className={statusColor}>
              {p.status}
            </Badge>
          </div>
          <p className="truncate text-xs text-slate-400">
            {p.tipoCedula ? p.tipoCedula + '-' : ''}
            {p.cedula} · {p.marca || '—'} {p.modelo || ''} {p.ano || ''} · Placa{' '}
            {p.placa || '—'}
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-mono text-xs text-emerald-300">
            {p.policyNumber || p.verifyCode}
          </p>
          <p className="text-[10px] text-slate-500">
            {new Date(p.createdAt).toLocaleDateString('es-VE')}
          </p>
        </div>
        {(p.cedulaDocName || p.tituloDocName) && (
          <div className="hidden items-center gap-1 lg:flex">
            {p.cedulaDocName && (
              <Badge variant="secondary" className="bg-white/5 text-slate-300">
                <Paperclip className="mr-1 h-2.5 w-2.5" />
                Cédula
              </Badge>
            )}
            {p.tituloDocName && (
              <Badge variant="secondary" className="bg-white/5 text-slate-300">
                <Paperclip className="mr-1 h-2.5 w-2.5" />
                Título
              </Badge>
            )}
          </div>
        )}
      </button>
    </div>
  )
}
