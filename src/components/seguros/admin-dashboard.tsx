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
  Users,
  FileCheck,
  Loader2,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminPolicyDetail } from './admin-policy-detail'
import SolicitudForm from './solicitud-form'
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

type Stats = {
  total: number
  pendientes: number
  aprobadas: number
  rechazadas: number
  hoy: number
}

type View = 'dashboard' | 'pendientes' | 'todas' | 'nueva'

const ADMIN_PASSWORD = 'admin123' // demo gate; replace with NextAuth in production

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
        <Card className="w-full max-w-sm border-white/10 bg-slate-900/80">
          <CardContent className="p-8">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
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
  const [stats, setStats] = useState<Stats | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch('/api/stats')
      if (r.ok) setStats(await r.json())
    } catch {
      /* ignore */
    }
  }, [])

  const loadPolicies = useCallback(
    async (status?: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        if (search) params.set('q', search)
        const r = await fetch(`/api/policies?${params}`)
        if (r.ok) {
          const { policies } = await r.json()
          setPolicies(policies)
        }
      } catch {
        toast.error('Error al cargar')
      } finally {
        setLoading(false)
      }
    },
    [search]
  )

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (view === 'dashboard') loadPolicies()
    else if (view === 'pendientes') loadPolicies('PENDIENTE')
    else if (view === 'todas') loadPolicies()
  }, [view, loadPolicies])

  function refreshAll() {
    loadStats()
    if (view === 'pendientes') loadPolicies('PENDIENTE')
    else loadPolicies()
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
        onBack={() => {
          setSelectedId(null)
          refreshAll()
        }}
      />
    )
  }

  const navItems: { key: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pendientes', label: 'Solicitud de Pólizas', icon: Clock },
    { key: 'todas', label: 'Todas las Pólizas', icon: FileText },
    { key: 'nueva', label: 'Nueva Solicitud', icon: Plus },
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
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
                setSidebarOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                view === n.key
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>
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
          <div className="ml-auto flex items-center gap-2">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {view === 'dashboard' && (
            <DashboardView
              stats={stats}
              policies={policies}
              loading={loading}
              onSelect={setSelectedId}
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
              onSearch={() => loadPolicies('PENDIENTE')}
              onSelect={setSelectedId}
              onRefresh={() => loadPolicies('PENDIENTE')}
              emptyHint="No hay solicitudes pendientes."
              statusFilter="PENDIENTE"
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
              onSearch={() => loadPolicies()}
              onSelect={setSelectedId}
              onRefresh={loadPolicies}
              emptyHint="No hay pólizas registradas."
            />
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
}: {
  stats: Stats | null
  policies: Policy[]
  loading: boolean
  onSelect: (id: string) => void
}) {
  const recent = policies.slice(0, 6)
  const cards = [
    {
      label: 'Total Pólizas',
      value: stats?.total ?? 0,
      icon: FileText,
      color: 'text-sky-300',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Pendientes',
      value: stats?.pendientes ?? 0,
      icon: Clock,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Aprobadas',
      value: stats?.aprobadas ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Rechazadas',
      value: stats?.rechazadas ?? 0,
      icon: XCircle,
      color: 'text-red-300',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Solicitudes Hoy',
      value: stats?.hoy ?? 0,
      icon: TrendingUp,
      color: 'text-violet-300',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Tasa Aprobación',
      value:
        stats && stats.total > 0
          ? Math.round((stats.aprobadas / stats.total) * 100) + '%'
          : '—',
      icon: FileCheck,
      color: 'text-teal-300',
      bg: 'bg-teal-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label} className="border-white/10 bg-slate-900/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{c.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent */}
      <Card className="border-white/10 bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <h2 className="font-semibold">Solicitudes recientes</h2>
          </div>
        </div>
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : recent.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Aún no hay solicitudes.
            </p>
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
  statusFilter?: string
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
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
        <Button variant="outline" onClick={onSearch} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
          <Search className="mr-1 h-4 w-4" /> Buscar
        </Button>
        <Button variant="outline" onClick={onRefresh} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
          Actualizar
        </Button>
      </div>

      <Card className="border-white/10 bg-slate-900/60">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : policies.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">{emptyHint}</p>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto">
              {policies.map((p) => (
                <PolicyRow key={p.id} p={p} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function PolicyRow({ p, onSelect }: { p: Policy; onSelect: (id: string) => void }) {
  const statusColor =
    p.status === 'APROBADA'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : p.status === 'RECHAZADA'
        ? 'border-red-500/30 bg-red-500/10 text-red-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'

  return (
    <button
      onClick={() => onSelect(p.id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
        {String(p.nombre || '?').charAt(0).toUpperCase()}
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
              Cédula
            </Badge>
          )}
          {p.tituloDocName && (
            <Badge variant="secondary" className="bg-white/5 text-slate-300">
              Título
            </Badge>
          )}
        </div>
      )}
    </button>
  )
}
