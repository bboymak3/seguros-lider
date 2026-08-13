'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  QrCode,
  Upload,
  Trash2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Car,
  User,
  IdCard,
  Copy,
  RefreshCw,
  Activity,
  History,
  FilePlus2,
  FileEdit,
  FileCheck2,
  FileX,
  Ban,
  Paperclip,
  FileMinus,
  Eye,
  X,
  Calendar,
  Phone,
  Mail,
  Hash,
  Clock,
  FileJson,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ACCEPTED_DOC_EXT } from '@/lib/policy-utils'

type Policy = Record<string, unknown> & {
  id: string
  verifyCode: string
  status: string
}

const TEXT_FIELDS: { key: string; label: string; group: string }[] = [
  // cliente
  { key: 'nombre', label: 'Nombre', group: 'cliente' },
  { key: 'apellido', label: 'Apellido', group: 'cliente' },
  { key: 'cedula', label: 'Cédula / RIF', group: 'cliente' },
  { key: 'tipoCedula', label: 'Tipo Cédula', group: 'cliente' },
  { key: 'fechaNacimiento', label: 'Fecha Nacimiento', group: 'cliente' },
  { key: 'nacionalidad', label: 'Nacionalidad', group: 'cliente' },
  { key: 'estadoCivil', label: 'Estado Civil', group: 'cliente' },
  { key: 'sexo', label: 'Sexo', group: 'cliente' },
  { key: 'telefono', label: 'Teléfono', group: 'cliente' },
  { key: 'telefonoAlt', label: 'Teléfono Alt.', group: 'cliente' },
  { key: 'email', label: 'Correo', group: 'cliente' },
  { key: 'ocupacion', label: 'Ocupación', group: 'cliente' },
  { key: 'direccion', label: 'Dirección', group: 'cliente' },
  { key: 'ciudad', label: 'Ciudad', group: 'cliente' },
  { key: 'estado', label: 'Estado', group: 'cliente' },
  // vehiculo
  { key: 'tipoVehiculo', label: 'Tipo', group: 'vehiculo' },
  { key: 'marca', label: 'Marca', group: 'vehiculo' },
  { key: 'modelo', label: 'Modelo', group: 'vehiculo' },
  { key: 'ano', label: 'Año', group: 'vehiculo' },
  { key: 'placa', label: 'Placa', group: 'vehiculo' },
  { key: 'color', label: 'Color', group: 'vehiculo' },
  { key: 'clase', label: 'Clase', group: 'vehiculo' },
  { key: 'uso', label: 'Uso', group: 'vehiculo' },
  { key: 'capacidad', label: 'Capacidad', group: 'vehiculo' },
  { key: 'serialCarroceria', label: 'Serial Carrocería', group: 'vehiculo' },
  { key: 'serialMotor', label: 'Serial Motor', group: 'vehiculo' },
  // cobertura
  { key: 'compania', label: 'Aseguradora', group: 'cobertura' },
  { key: 'plan', label: 'Plan', group: 'cobertura' },
  { key: 'tipoCobertura', label: 'Tipo Cobertura', group: 'cobertura' },
  { key: 'sumaAsegurada', label: 'Suma Asegurada', group: 'cobertura' },
  { key: 'prima', label: 'Prima', group: 'cobertura' },
  { key: 'deducible', label: 'Deducible', group: 'cobertura' },
  { key: 'vigenciaDesde', label: 'Vigencia Desde', group: 'cobertura' },
  { key: 'vigenciaHasta', label: 'Vigencia Hasta', group: 'cobertura' },
  { key: 'frecuenciaPago', label: 'Frecuencia Pago', group: 'cobertura' },
  { key: 'policyNumber', label: 'N° Póliza', group: 'cobertura' },
]

export function AdminPolicyDetail({
  id,
  onBack,
}: {
  id: string
  onBack: () => void
}) {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    const r = await fetch(`/api/policies/${id}`)
    if (!r.ok) return
    const { policy } = await r.json()
    setPolicy(policy)
    const flat: Record<string, string> = {}
    for (const k of TEXT_FIELDS) {
      flat[k] = (policy[k] as string) ?? ''
    }
    flat.notes = (policy.notes as string) ?? ''
    setForm(flat)
  }, [id, refreshKey])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    setSaving(true)
    try {
      const r = await fetch(`/api/policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error('Error al guardar')
      toast.success('Cambios guardados')
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function approve() {
    setApproving(true)
    try {
      const r = await fetch(`/api/policies/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyNumber: form.policyNumber || undefined,
          vigenciaDesde: form.vigenciaDesde || undefined,
          vigenciaHasta: form.vigenciaHasta || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (!r.ok) throw new Error('Error al aprobar')
      toast.success('Póliza aprobada y certificado generado')
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setApproving(false)
    }
  }

  async function setStatus(status: string) {
    setSaving(true)
    try {
      await fetch(`/api/policies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success(`Estado: ${status}`)
      await load()
    } catch {
      toast.error('Error')
    } finally {
      setSaving(false)
    }
  }

  async function uploadDoc(tipo: 'CEDULA' | 'TITULO') {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED_DOC_EXT.join(',')
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      setUploading(tipo)
      const fd = new FormData()
      fd.append('file', f)
      fd.append('tipo', tipo)
      try {
        const r = await fetch(`/api/policies/${id}/documents`, {
          method: 'POST',
          body: fd,
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error || 'Error')
        }
        toast.success(`${tipo === 'CEDULA' ? 'Cédula' : 'Título'} subido`)
        await load()
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  async function removeDoc(docId: string) {
    if (!confirm('¿Eliminar este documento?')) return
    try {
      await fetch(`/api/policies/${id}/documents/${docId}`, { method: 'DELETE' })
      toast.success('Documento eliminado')
      await load()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function replaceDoc(doc: { id: string; tipo: string; fileName: string }) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED_DOC_EXT.join(',')
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      if (!confirm(`¿Reemplazar "${doc.fileName}" por "${f.name}"?`)) return
      setUploading(doc.tipo)
      // delete old then upload new
      try {
        await fetch(`/api/policies/${id}/documents/${doc.id}`, { method: 'DELETE' })
        const fd = new FormData()
        fd.append('file', f)
        fd.append('tipo', doc.tipo)
        const r = await fetch(`/api/policies/${id}/documents`, {
          method: 'POST',
          body: fd,
        })
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error || 'Error')
        }
        toast.success('Documento reemplazado')
        await load()
      } catch (e) {
        toast.error((e as Error).message)
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  if (!policy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  const docs = (policy.documents as Array<{
    id: string
    tipo: string
    fileName: string
    mimeType: string
    size?: number
    filePath: string
  }>) || []

  const status = policy.status as string
  const verifyUrl = `/?v=${policy.verifyCode}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-300 hover:text-white">
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Button>
          <div className="ml-2 flex items-center gap-2">
            <span className="font-semibold">Póliza</span>
            <Badge variant="outline" className="font-mono text-emerald-300">
              {policy.verifyCode}
            </Badge>
            <Badge
              variant="outline"
              className={
                status === 'APROBADA'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : status === 'RECHAZADA'
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }
            >
              {status}
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href={`/api/policies/${id}/pdf`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Download className="mr-1 h-4 w-4" /> PDF
              </Button>
            </a>
            <Button
              size="sm"
              onClick={save}
              disabled={saving}
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Action bar */}
        <Card className="mb-6 border-white/10 bg-slate-900/60">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex items-center gap-2">
              {status === 'PENDIENTE' ? (
                <>
                  <Button
                    onClick={approve}
                    disabled={approving}
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  >
                    {approving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Aprobar y Generar Certificado
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStatus('RECHAZADA')}
                    className="border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  >
                    <XCircle className="mr-1 h-4 w-4" /> Rechazar
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStatus('PENDIENTE')}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw className="mr-1 h-4 w-4" /> Marcar pendiente
                </Button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
              <span>Verificación pública:</span>
              <code className="rounded bg-white/5 px-2 py-1 text-emerald-300">{verifyUrl}</code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-slate-400 hover:text-white"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${verifyUrl}`)
                  toast.success('URL copiada')
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <a href={verifyUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-400 hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Summary card */}
        <Card className="mb-6 overflow-hidden border-white/10 bg-slate-900/60">
          <div className={`h-1 w-full ${
            status === 'APROBADA' ? 'bg-emerald-500' :
            status === 'RECHAZADA' ? 'bg-red-500' :
            status === 'ANULADA' ? 'bg-slate-500' :
            'bg-amber-500'
          }`} />
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem icon={User} label="Tomador" value={`${policy.nombre} ${policy.apellido || ''}`} />
            <SummaryItem icon={Hash} label="Cédula" value={`${policy.tipoCedula ? policy.tipoCedula + '-' : ''}${policy.cedula}`} />
            <SummaryItem icon={Car} label="Vehículo" value={`${policy.marca || '—'} ${policy.modelo || ''} ${policy.ano || ''}`.trim() || '—'} />
            <SummaryItem icon={FileText} label="Placa" value={(policy.placa as string) || '—'} />
            <SummaryItem icon={ShieldCheck} label="Cobertura" value={(policy.tipoCobertura as string) || '—'} />
            <SummaryItem icon={Calendar} label="Vigencia" value={
              policy.vigenciaDesde || policy.vigenciaHasta
                ? `${policy.vigenciaDesde || '—'} → ${policy.vigenciaHasta || '—'}`
                : '—'
            } />
            <SummaryItem icon={Clock} label="Creada" value={new Date(policy.createdAt as string).toLocaleDateString('es-VE')} />
            <SummaryItem icon={CheckCircle2} label="Aprobada" value={
              policy.aprobadoAt
                ? new Date(policy.aprobadoAt as string).toLocaleDateString('es-VE')
                : '—'
            } />
          </CardContent>
        </Card>

        <Tabs defaultValue="datos">
          <TabsList className="bg-slate-900/60 border border-white/10">
            <TabsTrigger value="datos" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300">
              <User className="mr-1.5 h-4 w-4" /> Datos
            </TabsTrigger>
            <TabsTrigger value="documentos" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300">
              <IdCard className="mr-1.5 h-4 w-4" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="certificado" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300">
              <QrCode className="mr-1.5 h-4 w-4" /> Certificado / QR
            </TabsTrigger>
            <TabsTrigger value="historial" className="data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300">
              <History className="mr-1.5 h-4 w-4" /> Historial
            </TabsTrigger>
          </TabsList>

          {/* DATOS */}
          <TabsContent value="datos" className="mt-4 space-y-4">
            <GroupCard title="Datos del Cliente" icon={User} fields={TEXT_FIELDS.filter((f) => f.group === 'cliente')} form={form} setForm={setForm} />
            <GroupCard title="Datos del Vehículo" icon={Car} fields={TEXT_FIELDS.filter((f) => f.group === 'vehiculo')} form={form} setForm={setForm} />
            <GroupCard title="Cobertura y Condiciones" icon={ShieldCheck} fields={TEXT_FIELDS.filter((f) => f.group === 'cobertura')} form={form} setForm={setForm} />
            <Card className="border-white/10 bg-slate-900/60">
              <CardContent className="p-4">
                <Label className="mb-1.5 block text-xs text-slate-300">Notas internas</Label>
                <Textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notas del administrador..."
                  className="min-h-[80px] bg-slate-950/50 border-white/10"
                />
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Guardar cambios
              </Button>
            </div>
          </TabsContent>

          {/* DOCUMENTOS */}
          <TabsContent value="documentos" className="mt-4">
            <Card className="border-white/10 bg-slate-900/60">
              <div className="border-b border-white/10 px-5 py-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <IdCard className="h-4 w-4 text-emerald-400" />
                  Documentos adjuntos
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Formatos permitidos: JPG, PNG, WEBP, PDF. Máx 10 MB.
                </p>
              </div>
              <CardContent className="p-4">
                {docs.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No se han adjuntado documentos.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {docs.map((d) => (
                      <DocCard
                        key={d.id}
                        doc={d}
                        onRemove={() => removeDoc(d.id)}
                        onReplace={() => replaceDoc(d)}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <UploadSlot
                    label="Cédula de Identidad"
                    uploading={uploading === 'CEDULA'}
                    onUpload={() => uploadDoc('CEDULA')}
                  />
                  <UploadSlot
                    label="Título de Propiedad"
                    uploading={uploading === 'TITULO'}
                    onUpload={() => uploadDoc('TITULO')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CERTIFICADO */}
          <TabsContent value="certificado" className="mt-4">
            <Card className="border-white/10 bg-slate-900/60">
              <CardContent className="p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold">
                      <QrCode className="h-4 w-4 text-emerald-400" />
                      Código QR de verificación
                    </h3>
                    <div className="inline-block rounded-xl border border-emerald-500/20 bg-white p-3">
                      <img
                        src={`/api/policies/${id}/qr`}
                        alt="QR"
                        className="h-44 w-44"
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Al escanear este código se abre la página pública de
                      verificación de esta póliza.
                    </p>
                    <a href={`/api/policies/${id}/qr`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="mt-3 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Ver QR
                      </Button>
                    </a>
                  </div>
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      Certificado PDF
                    </h3>
                    <p className="text-sm text-slate-400">
                      El certificado se genera automáticamente con los datos
                      actuales. Al aprobar la póliza se asigna el número y el
                      estado <span className="text-emerald-300">APROBADA</span>.
                    </p>
                    <a href={`/api/policies/${id}/pdf`} target="_blank" rel="noreferrer">
                      <Button className="mt-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                        <Download className="mr-1.5 h-4 w-4" />
                        Descargar / regenerar PDF
                      </Button>
                    </a>
                    <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs">
                      <p className="text-slate-500">Código de verificación</p>
                      <p className="mt-1 font-mono text-lg text-emerald-300">
                        {policy.verifyCode}
                      </p>
                      <p className="mt-2 text-slate-500">N° de póliza</p>
                      <p className="mt-1 font-mono text-lg text-slate-200">
                        {(policy.policyNumber as string) || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="historial" className="mt-4">
            <ActivityTimeline policyId={id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function ActivityTimeline({ policyId }: { policyId: string }) {
  const [activities, setActivities] = useState<Array<{
    id: string
    action: string
    description: string
    actor: string
    createdAt: string
    metadata?: string | null
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch(`/api/policies/${policyId}/activities`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setActivities(d.activities || [])
          setLoading(false)
        }
      })
      .catch(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [policyId])

  const iconFor = (action: string) => {
    switch (action) {
      case 'CREATED': return FilePlus2
      case 'UPDATED': return FileEdit
      case 'APPROVED': return FileCheck2
      case 'REJECTED': return FileX
      case 'ANULADA': return Ban
      case 'DOCUMENT_UPLOADED': return Paperclip
      case 'DOCUMENT_DELETED': return FileMinus
      case 'PDF_GENERATED': return FileText
      default: return Activity
    }
  }

  const colorFor = (action: string) => {
    switch (action) {
      case 'APPROVED': return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/20'
      case 'REJECTED':
      case 'ANULADA': return 'bg-red-500/15 text-red-300 ring-red-500/20'
      case 'CREATED': return 'bg-sky-500/15 text-sky-300 ring-sky-500/20'
      case 'DOCUMENT_UPLOADED': return 'bg-violet-500/15 text-violet-300 ring-violet-500/20'
      case 'DOCUMENT_DELETED': return 'bg-amber-500/15 text-amber-300 ring-amber-500/20'
      default: return 'bg-slate-500/15 text-slate-300 ring-slate-500/20'
    }
  }

  return (
    <Card className="border-white/10 bg-slate-900/60">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        <History className="h-4 w-4 text-emerald-400" />
        <h2 className="font-semibold">Historial de actividad</h2>
        <Badge variant="secondary" className="ml-auto bg-white/5 text-slate-400">
          {activities.length} evento(s)
        </Badge>
        {activities.length > 0 && (
          <div className="flex items-center gap-1">
            <a
              href={`/api/policies/${policyId}/activities/export?format=csv`}
              download
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Exportar como CSV"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">CSV</span>
            </a>
            <a
              href={`/api/policies/${policyId}/activities/export?format=json`}
              download
              className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Exportar como JSON"
            >
              <FileJson className="h-3 w-3" />
              <span className="hidden sm:inline">JSON</span>
            </a>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
            <Activity className="h-8 w-8 opacity-30" />
            <p className="text-sm">Sin actividad registrada.</p>
          </div>
        ) : (
          <ol className="relative space-y-1">
            {activities.map((a, i) => {
              const Icon = iconFor(a.action)
              const color = colorFor(a.action)
              const isLast = i === activities.length - 1
              return (
                <li key={a.id} className="relative flex gap-3 pb-4">
                  {!isLast && (
                    <div className="absolute left-[15px] top-8 h-full w-px bg-white/10" />
                  )}
                  <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-slate-200">{a.description}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-mono">{a.action}</span>
                      <span>·</span>
                      <span>por {a.actor}</span>
                      <span>·</span>
                      <span>{new Date(a.createdAt).toLocaleString('es-VE')}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
        <Icon className="h-4 w-4 text-emerald-300" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-100">{value}</p>
      </div>
    </div>
  )
}

function GroupCard({
  title,
  icon: Icon,
  fields,
  form,
  setForm,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  fields: { key: string; label: string }[]
  form: Record<string, string>
  setForm: (f: Record<string, string>) => void
}) {
  return (
    <Card className="border-white/10 bg-slate-900/60">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
        <Icon className="h-4 w-4 text-emerald-400" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-slate-500">
              {f.label}
            </Label>
            <Input
              value={form[f.key] || ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="bg-slate-950/50 border-white/10"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DocCard({
  doc,
  onRemove,
  onReplace,
}: {
  doc: { id: string; tipo: string; fileName: string; mimeType: string; size?: number; filePath: string }
  onRemove: () => void
  onReplace?: () => void
}) {
  const [lightbox, setLightbox] = useState(false)
  const isImg = doc.mimeType.startsWith('image/')
  const url = `/api/files/${doc.filePath.replace(/^my-emdash-media\/seguros\//, '')}`

  return (
    <>
      <div className="group overflow-hidden rounded-lg border border-white/10 bg-slate-950/40 transition-colors hover:border-emerald-500/30">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <Badge
            variant="outline"
            className={
              doc.tipo === 'CEDULA'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : doc.tipo === 'TITULO'
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                  : 'border-white/20 bg-white/5 text-slate-300'
            }
          >
            {doc.tipo}
          </Badge>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLightbox(true)}
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              title="Vista previa"
            >
              <Eye className="h-4 w-4" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              title="Abrir en pestaña"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {onReplace && (
              <button
                onClick={onReplace}
                className="rounded p-1 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                title="Reemplazar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onRemove}
              className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setLightbox(true)}
          className="block w-full cursor-zoom-in"
        >
          {isImg ? (
            <img src={url} alt={doc.fileName} className="h-32 w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 bg-slate-900">
              <FileText className="h-10 w-10 text-slate-500" />
              <span className="text-xs text-slate-400">Ver PDF</span>
            </div>
          )}
        </button>
        <div className="px-3 py-2">
          <p className="truncate text-xs font-medium">{doc.fileName}</p>
          <p className="text-[10px] text-slate-400">
            {doc.size ? `${(doc.size / 1024).toFixed(0)} KB · ` : ''}
            {doc.mimeType}
          </p>
        </div>
      </div>

      {lightbox && (
        <Lightbox
          url={url}
          fileName={doc.fileName}
          isImg={isImg}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  )
}

function Lightbox({
  url,
  fileName,
  isImg,
  onClose,
}: {
  url: string
  fileName: string
  isImg: boolean
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="truncate text-sm font-medium">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Abrir</span>
            </a>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              title="Cerrar (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center overflow-auto bg-slate-950 p-4">
          {isImg ? (
            <img
              src={url}
              alt={fileName}
              className="max-h-[75vh] max-w-full object-contain"
            />
          ) : (
            <iframe
              src={url}
              title={fileName}
              className="h-[75vh] w-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function UploadSlot({
  label,
  uploading,
  onUpload,
}: {
  label: string
  uploading: boolean
  onUpload: () => void
}) {
  return (
    <button
      onClick={onUpload}
      disabled={uploading}
      className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-slate-950/30 p-5 text-sm text-slate-300 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 disabled:opacity-50"
    >
      {uploading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      {uploading ? 'Subiendo...' : `Subir / reemplazar ${label}`}
    </button>
  )
}
