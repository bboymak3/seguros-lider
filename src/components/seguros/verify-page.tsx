'use client'

import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Download,
  ArrowLeft,
  QrCode,
  Car,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Phone,
  Mail,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Policy = Record<string, unknown> & {
  id: string
  verifyCode: string
  policyNumber?: string | null
  status: string
  nombre: string
  apellido?: string | null
  cedula: string
  tipoCedula?: string | null
  fechaNacimiento?: string | null
  nacionalidad?: string | null
  estadoCivil?: string | null
  sexo?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  ciudad?: string | null
  estado?: string | null
  ocupacion?: string | null
  tipoVehiculo?: string | null
  marca?: string | null
  modelo?: string | null
  ano?: string | null
  placa?: string | null
  color?: string | null
  serialCarroceria?: string | null
  serialMotor?: string | null
  uso?: string | null
  capacidad?: string | null
  clase?: string | null
  tipoCobertura?: string | null
  compania?: string | null
  plan?: string | null
  prima?: string | null
  sumaAsegurada?: string | null
  deducible?: string | null
  vigenciaDesde?: string | null
  vigenciaHasta?: string | null
  frecuenciaPago?: string | null
  createdAt: string
  aprobadoAt?: string | null
}

export default function VerifyPage({
  code,
  onBack,
}: {
  code: string
  onBack: () => void
}) {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    fetch(`/api/policies/verify?code=${encodeURIComponent(code)}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error || 'No encontrada')
        }
        return r.json()
      })
      .then((d) => {
        if (alive) {
          setPolicy(d.policy)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (alive && e.name !== 'AbortError') {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => {
      alive = false
      controller.abort()
    }
  }, [code])

  if (loading) {
    return (
      <Shell onBack={onBack}>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="mt-4 text-slate-400">Verificando póliza...</p>
        </div>
      </Shell>
    )
  }

  if (error || !policy) {
    return (
      <Shell onBack={onBack}>
        <div className="mx-auto max-w-md py-20 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
            <XCircle className="h-9 w-9 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">Póliza no encontrada</h1>
          <p className="mt-2 text-slate-400">
            El código <span className="font-mono text-red-300">{code}</span> no
            corresponde a ninguna póliza registrada.
          </p>
          <Button onClick={onBack} className="mt-6 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
            Volver al inicio
          </Button>
        </div>
      </Shell>
    )
  }

  const isApproved = policy.status === 'APROBADA'
  const isPending = policy.status === 'PENDIENTE'

  return (
    <Shell onBack={onBack}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Header card */}
        <Card
          className={`overflow-hidden border-white/10 ${
            isApproved
              ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900'
              : isPending
                ? 'bg-gradient-to-br from-amber-950/60 to-slate-900'
                : 'bg-gradient-to-br from-red-950/60 to-slate-900'
          }`}
        >
          <div
            className={`h-1.5 w-full ${
              isApproved
                ? 'bg-emerald-500'
                : isPending
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
          />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      isApproved
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                        : isPending
                          ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                          : 'border-red-500/30 bg-red-500/15 text-red-300'
                    }
                  >
                    {isApproved ? (
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    ) : isPending ? (
                      <Clock className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                    )}
                    {policy.status}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Verificado el {new Date().toLocaleString('es-VE')}
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Certificado de Póliza
                </h1>
                <p className="mt-1 text-slate-300">
                  Póliza N°{' '}
                  <span className="font-mono font-semibold text-white">
                    {policy.policyNumber || policy.verifyCode}
                  </span>
                </p>
                {isApproved && policy.vigenciaDesde && policy.vigenciaHasta && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-300">
                    <Calendar className="h-4 w-4" />
                    Vigente del {policy.vigenciaDesde} al {policy.vigenciaHasta}
                  </p>
                )}
                {isPending && (
                  <p className="mt-2 text-sm text-amber-300/90">
                    Esta solicitud está en proceso de revisión. Vuelva a
                    consultar más tarde.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="rounded-xl border border-white/10 bg-white p-2">
                  <img
                    src={`/api/policies/${policy.id}/qr`}
                    alt="QR de verificación"
                    className="h-28 w-28"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-400">
                  Código {policy.verifyCode}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status banner */}
        {isApproved ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-200">
                Póliza válida y vigente
              </p>
              <p className="text-sm text-slate-400">
                Este certificado ha sido verificado en la base de datos oficial
                de Seguros Líder.
              </p>
            </div>
          </div>
        ) : isPending ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <Clock className="h-6 w-6 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">
                Solicitud en proceso
              </p>
              <p className="text-sm text-slate-400">
                Esta póliza aún no ha sido aprobada. Estará disponible una vez
                validada por nuestro equipo.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <ShieldAlert className="h-6 w-6 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-200">Póliza no vigente</p>
              <p className="text-sm text-slate-400">
                El estado actual de esta póliza es:{' '}
                <strong>{policy.status}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Cliente */}
        <Section title="Datos del Cliente" icon={User}>
          <Grid>
            <Item label="Nombre completo" value={`${policy.nombre} ${policy.apellido || ''}`} />
            <Item label="Cédula / RIF" value={`${policy.tipoCedula ? policy.tipoCedula + '-' : ''}${policy.cedula}`} />
            <Item label="Nacionalidad" value={policy.nacionalidad} />
            <Item label="Fecha de nacimiento" value={policy.fechaNacimiento} />
            <Item label="Estado civil" value={policy.estadoCivil} />
            <Item label="Sexo" value={policy.sexo} />
            <Item label="Ocupación" value={policy.ocupacion} />
            <Item label="Teléfono" value={policy.telefono} icon={Phone} />
            <Item label="Correo" value={policy.email} icon={Mail} />
            <Item label="Dirección" value={[policy.direccion, policy.ciudad, policy.estado].filter(Boolean).join(', ')} />
          </Grid>
        </Section>

        {/* Vehículo */}
        <Section title="Datos del Vehículo" icon={Car}>
          <Grid>
            <Item label="Tipo" value={policy.tipoVehiculo} />
            <Item label="Marca" value={policy.marca} />
            <Item label="Modelo" value={policy.modelo} />
            <Item label="Año" value={policy.ano} />
            <Item label="Placa" value={policy.placa} />
            <Item label="Color" value={policy.color} />
            <Item label="Clase" value={policy.clase} />
            <Item label="Uso" value={policy.uso} />
            <Item label="Capacidad" value={policy.capacidad} />
            <Item label="Serial carrocería" value={policy.serialCarroceria} />
            <Item label="Serial motor" value={policy.serialMotor} />
          </Grid>
        </Section>

        {/* Cobertura */}
        <Section title="Cobertura y Condiciones" icon={ShieldCheck}>
          <Grid>
            <Item label="Aseguradora" value={policy.compania} />
            <Item label="Plan" value={policy.plan} />
            <Item label="Tipo de cobertura" value={policy.tipoCobertura} />
            <Item label="Suma asegurada" value={policy.sumaAsegurada} />
            <Item label="Prima" value={policy.prima} />
            <Item label="Deducible" value={policy.deducible} />
            <Item label="Vigencia desde" value={policy.vigenciaDesde} icon={Calendar} />
            <Item label="Vigencia hasta" value={policy.vigenciaHasta} icon={Calendar} />
            <Item label="Frecuencia de pago" value={policy.frecuenciaPago} />
          </Grid>
        </Section>

        {/* Meta */}
        <Card className="mt-4 border-white/10 bg-slate-900/60">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Hash className="h-4 w-4" />
                Registro creado el{' '}
                {new Date(policy.createdAt).toLocaleString('es-VE')}
              </div>
              {policy.aprobadoAt && (
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobada el {new Date(policy.aprobadoAt).toLocaleString('es-VE')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`/api/policies/${policy.id}/pdf`} target="_blank" rel="noreferrer">
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              <Download className="mr-2 h-4 w-4" />
              Descargar Certificado (PDF)
            </Button>
          </a>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <QrCode className="h-3.5 w-3.5" />
          Página de verificación oficial de Seguros Líder
        </p>
      </div>
    </Shell>
  )
}

function Shell({
  children,
  onBack,
}: {
  children: React.ReactNode
  onBack: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Inicio
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="font-bold">Seguros Líder</span>
          </div>
          <div className="w-16" />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-auto border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Seguros Líder — Verificación de Pólizas
      </footer>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Card className="mt-4 border-white/10 bg-slate-900/60">
      <CardHeader2 title={title} icon={<Icon className="h-5 w-5 text-emerald-400" />} />
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  )
}

function CardHeader2({
  title,
  icon,
}: {
  title: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
      {icon}
      <h2 className="font-semibold">{title}</h2>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

function Item({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value?: string | null
  icon?: React.ComponentType<{ className?: string }>
}) {
  const display = value && value.trim() ? value : '—'
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 font-medium text-slate-100 break-words">{display}</p>
    </div>
  )
}
