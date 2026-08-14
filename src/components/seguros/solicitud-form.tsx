'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2, Upload, X, FileText, ShieldCheck, ArrowLeft, ArrowRight,
  CheckCircle2, Car, User, IdCard, Check, Save, Euro, DollarSign, Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ACCEPTED_DOC_EXT } from '@/lib/policy-utils'

const schema = z.object({
  // Personal
  nombre: z.string().min(2, 'Ingrese su nombre'),
  apellido: z.string().optional(),
  tipoCedula: z.string().optional(),
  cedula: z.string().min(4, 'Cédula requerida'),
  fechaNacimiento: z.string().optional(),
  nacionalidad: z.string().optional(),
  estadoCivil: z.string().optional(),
  sexo: z.string().optional(),
  telefono: z.string().min(7, 'Teléfono requerido'),
  telefonoAlt: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.string().optional(),
  ocupacion: z.string().optional(),
  // Asegurado
  asegNombre: z.string().optional(),
  asegApellido: z.string().optional(),
  asegCedula: z.string().optional(),
  asegEmail: z.string().optional(),
  // Tomador
  tomadorIgualAseg: z.string().optional(),
  tomNombre: z.string().optional(),
  tomApellido: z.string().optional(),
  tomCedula: z.string().optional(),
  tomEmail: z.string().optional(),
  tomFechaNacimiento: z.string().optional(),
  tomEstadoCivil: z.string().optional(),
  tomGenero: z.string().optional(),
  tomTelefono: z.string().optional(),
  tomEstado: z.string().optional(),
  tomMunicipio: z.string().optional(),
  tomParroquia: z.string().optional(),
  tomDireccion: z.string().optional(),
  // Vehicle
  tipoVehiculo: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  ano: z.string().optional(),
  placa: z.string().optional(),
  color: z.string().optional(),
  serialCarroceria: z.string().optional(),
  serialMotor: z.string().optional(),
  uso: z.string().optional(),
  capacidad: z.string().optional(),
  clase: z.string().optional(),
  poseeTrailer: z.string().optional(),
  placaExtranjera: z.string().optional(),
  cantidadPuestos: z.string().optional(),
  capacidadCarga: z.string().optional(),
  // Coverage / Póliza
  vehicleClassId: z.string().optional(),
  planId: z.string().optional(),
  tipoCobertura: z.string().optional(),
  compania: z.string().optional(),
  plan: z.string().optional(),
  prima: z.string().optional(),
  primaEur: z.string().optional(),
  primaUsd: z.string().optional(),
  primaBs: z.string().optional(),
  sumaAsegurada: z.string().optional(),
  deducible: z.string().optional(),
  vigenciaDesde: z.string().optional(),
  vigenciaHasta: z.string().optional(),
  frecuenciaPago: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const ESTADOS_VENEZUELA = [
  'Distrito Capital', 'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
  'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Falcón', 'Guárico',
  'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa',
  'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
]

const STEPS = [
  { id: 0, label: 'Cliente', icon: User, description: 'Datos personales del tomador' },
  { id: 1, label: 'Vehículo', icon: Car, description: 'Información del vehículo a asegurar' },
  { id: 2, label: 'Cobertura', icon: ShieldCheck, description: 'Condiciones de la póliza' },
  { id: 3, label: 'Documentos', icon: IdCard, description: 'Adjuntar cédula y título (opcional)' },
]

// fields required per step (for validation before advancing)
const STEP_REQUIRED_FIELDS: Record<number, string[]> = {
  0: ['nombre', 'cedula', 'telefono'],
  1: [],
  2: [],
  3: [],
}

export default function SolicitudForm({
  onDone,
  onBack,
  prefillCobertura,
}: {
  onDone: (code: string) => void
  onBack: () => void
  prefillCobertura?: string
}) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [cedulaFile, setCedulaFile] = useState<File | null>(null)
  const [tituloFile, setTituloFile] = useState<File | null>(null)
  const [success, setSuccess] = useState<{ code: string; id: string } | null>(null)
  // draft auto-save indicator
  const [draftSaved, setDraftSaved] = useState(false)
  // configurable options loaded from /api/settings
  const [options, setOptions] = useState<{
    ASEGURADORAS: string[]
    COVERAGE_TYPES: string[]
    VEHICLE_TYPES: string[]
    PLAN_TYPES: string[]
  } | null>(null)

  // Vehicle classes and plans loaded from DB
  const [vehicleClasses, setVehicleClasses] = useState<Array<{
    id: string
    code: number
    name: string
    plans: Array<{ id: string; name: string; priceEur: string; priceUsd: string; priceBs: string }>
  }>>([])

  // Load configurable options + vehicle classes from APIs
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setOptions(d.settings))
      .catch(() => {
        /* fall back to empty arrays */
      })
    fetch('/api/vehicle-classes')
      .then((r) => r.json())
      .then((d) => setVehicleClasses(d.vehicleClasses || []))
      .catch(() => {
        /* ignore */
      })
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  })

  // Plans available for the selected vehicle class (computed after watch is available)
  const selectedVehicleClassId = watch('vehicleClassId')
  const availablePlans = vehicleClasses.find((c) => c.id === selectedVehicleClassId)?.plans || []

  // Load draft on mount + apply cobertura prefill from query param
  useEffect(() => {
    const draft = sessionStorage.getItem('seguros_draft')
    if (draft) {
      try {
        const data = JSON.parse(draft)
        Object.keys(data).forEach((k) => {
          if (data[k]) setValue(k as keyof FormData, data[k])
        })
        toast.info('Borrador recuperado')
      } catch {
        /* ignore */
      }
    }
    // Apply cobertura prefill from landing page plan selection (takes priority)
    if (prefillCobertura) {
      setValue('tipoCobertura', prefillCobertura)
      // Jump to coverage step (step 2) so the user sees the pre-selected value
      setTimeout(() => setStep(2), 300)
      toast.success(`Plan "${prefillCobertura}" preseleccionado`)
    }
  }, [])

  // Auto-save draft (debounced via watch)
  const watched = watch()
  useEffect(() => {
    const t = setTimeout(() => {
      const hasData = watched.nombre || watched.cedula
      if (hasData) {
        sessionStorage.setItem('seguros_draft', JSON.stringify(watched))
        setDraftSaved(true)
      }
    }, 800)
    return () => clearTimeout(t)
  }, [watched])

  async function uploadDoc(id: string, file: File, tipo: string) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('tipo', tipo)
    const res = await fetch(`/api/policies/${id}/documents`, {
      method: 'POST',
      body: fd,
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Error al subir documento')
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const payload = { ...data, email: data.email || undefined, actor: 'public' }
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('No se pudo crear la solicitud')
      const { policy } = await res.json()

      if (cedulaFile) {
        try {
          await uploadDoc(policy.id, cedulaFile, 'CEDULA')
        } catch (e) {
          toast.error(`Cédula: ${(e as Error).message}`)
        }
      }
      if (tituloFile) {
        try {
          await uploadDoc(policy.id, tituloFile, 'TITULO')
        } catch (e) {
          toast.error(`Título: ${(e as Error).message}`)
        }
      }

      sessionStorage.removeItem('seguros_draft')
      setSuccess({ code: policy.verifyCode, id: policy.id })
      toast.success('Solicitud creada correctamente')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function nextStep() {
    const fields = STEP_REQUIRED_FIELDS[step] || []
    const valid = await trigger(fields as (keyof FormData)[])
    if (valid) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toast.error('Completa los campos requeridos para continuar')
    }
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function saveDraft() {
    sessionStorage.setItem('seguros_draft', JSON.stringify(getValues()))
    toast.success('Borrador guardado')
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <header className="border-b border-white/10">
          <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="font-bold">Seguros Líder</span>
            </div>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-lg border-white/10 bg-slate-900/80">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-4 ring-emerald-500/10">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold">¡Solicitud enviada!</h1>
              <p className="mt-2 text-slate-400">
                Tu solicitud fue registrada con el código:
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-2">
                <span className="font-mono text-2xl font-bold tracking-widest text-emerald-300">
                  {success.code}
                </span>
              </div>
              <p className="mt-5 text-sm text-slate-400">
                Guarda este código. Nuestro equipo revisará tu solicitud y la
                aprobará en breve. Puedes consultar el estado con el botón
                siguiente.
              </p>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  onClick={() => onDone(success.code)}
                >
                  Ver mi certificado
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={onBack}
                >
                  Volver al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <footer className="mt-auto border-t border-white/10 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Seguros Líder
        </footer>
      </div>
    )
  }

  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="font-bold">Solicitud de Póliza</span>
          </div>
          <button
            onClick={saveDraft}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300"
            title="Guardar borrador"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{draftSaved ? 'Guardado' : 'Guardar'}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const isDone = i < step
              const isCurrent = i === step
              return (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                          : isCurrent
                            ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 ring-4 ring-emerald-500/10'
                            : 'border-white/15 bg-slate-900 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <s.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isCurrent ? 'text-emerald-300' : isDone ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="mx-2 h-0.5 flex-1 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: isDone ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Paso {step + 1} de {STEPS.length}: {currentStep.label}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{currentStep.description}</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-500">Progreso</p>
              <p className="text-lg font-bold text-emerald-300">{Math.round(progress)}%</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* STEP 0: CLIENTE */}
          {step === 0 && (
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-emerald-400" />
                  Datos del Cliente (Tomador)
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Información personal del solicitante de la póliza.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" required error={errors.nombre?.message}>
                  <Input {...register('nombre')} placeholder="Juan" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Apellido">
                  <Input {...register('apellido')} placeholder="Pérez" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Tipo de Cédula / RIF">
                  <SelectField
                    value={watch('tipoCedula') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('tipoCedula', v)}
                    options={['V', 'E', 'J', 'G']}
                  />
                </Field>
                <Field label="Cédula / RIF" required error={errors.cedula?.message}>
                  <Input {...register('cedula')} placeholder="12345678" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Fecha de Nacimiento">
                  <Input type="date" {...register('fechaNacimiento')} className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Nacionalidad">
                  <SelectField
                    value={watch('nacionalidad') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('nacionalidad', v)}
                    options={['Venezolana', 'Extranjera']}
                  />
                </Field>
                <Field label="Estado Civil">
                  <SelectField
                    value={watch('estadoCivil') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('estadoCivil', v)}
                    options={['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)']}
                  />
                </Field>
                <Field label="Sexo">
                  <SelectField
                    value={watch('sexo') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('sexo', v)}
                    options={['Masculino', 'Femenino']}
                  />
                </Field>
                <Field label="Teléfono" required error={errors.telefono?.message}>
                  <Input {...register('telefono')} placeholder="0412-XXXXXXX" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Teléfono Alternativo">
                  <Input {...register('telefonoAlt')} placeholder="0212-XXXXXXX" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Correo Electrónico" error={errors.email?.message}>
                  <Input type="email" {...register('email')} placeholder="correo@ejemplo.com" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Ocupación">
                  <Input {...register('ocupacion')} placeholder="Comerciante" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Dirección">
                  <Input {...register('direccion')} placeholder="Av. Principal, Edif..." className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Ciudad">
                  <Input {...register('ciudad')} placeholder="Caracas" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Estado">
                  <SelectField
                    value={watch('estado') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('estado', v)}
                    options={ESTADOS_VENEZUELA}
                  />
                </Field>
              </CardContent>
            </Card>
          )}

          {/* STEP 1: VEHÍCULO */}
          {step === 1 && (
            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-5 w-5 text-emerald-400" />
                  Datos del Vehículo
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Información técnica del vehículo a asegurar.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Placa o Matrícula">
                  <Input {...register('placa')} placeholder="ABC-123" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Marca">
                  <Input {...register('marca')} placeholder="Toyota" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Modelo">
                  <Input {...register('modelo')} placeholder="Corolla" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Tipo">
                  <SelectField
                    value={watch('tipoVehiculo') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('tipoVehiculo', v)}
                    options={options?.VEHICLE_TYPES || []}
                  />
                </Field>
                <Field label="Año">
                  <Input {...register('ano')} placeholder="2022" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Uso del Vehículo">
                  <SelectField
                    value={watch('uso') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('uso', v)}
                    options={['Particular', 'Carga', 'Público', 'Diplomático']}
                  />
                </Field>
                <Field label="¿Posee Trailer?">
                  <SelectField
                    value={watch('poseeTrailer') || 'No'}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('poseeTrailer', v)}
                    options={['No', 'Sí']}
                  />
                </Field>
                <Field label="¿Posee Placa Extranjera?">
                  <SelectField
                    value={watch('placaExtranjera') || 'No'}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('placaExtranjera', v)}
                    options={['No', 'Sí']}
                  />
                </Field>
                <Field label="Serial de Carrocería">
                  <Input {...register('serialCarroceria')} placeholder="8XJKL..." className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Serial del Motor">
                  <Input {...register('serialMotor')} placeholder="MR20..." className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Cantidad de Puestos">
                  <Input {...register('cantidadPuestos')} placeholder="5" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Capacidad de Carga (Kg)">
                  <Input {...register('capacidadCarga')} placeholder="0" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Color">
                  <Input {...register('color')} placeholder="Blanco" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Clase">
                  <Input {...register('clase')} placeholder="Sedan" className="bg-slate-950/50 border-white/10" />
                </Field>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: COBERTURA */}
          {step === 2 && (
            <>
            <Card className="border-emerald-500/20 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Póliza — Clase de Vehículo y Plan
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Selecciona la clase de vehículo y el plan correspondiente. Los precios se cargan desde la lista oficial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Clase de Vehículo">
                    <SelectField
                      value={watch('vehicleClassId') || ''}
                      placeholder="- Seleccionar clase de vehículo -"
                      onCng={(v) => {
                        setValue('vehicleClassId', v)
                        setValue('planId', '')
                        setValue('plan', '')
                        setValue('primaEur', '')
                        setValue('primaUsd', '')
                        setValue('primaBs', '')
                      }}
                      options={[]}
                      optionsRaw={
                        <SelectContent>
                          {vehicleClasses.map((vc) => (
                            <SelectItem key={vc.id} value={vc.id}>
                              {vc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      }
                    />
                  </Field>
                  <Field label="Seleccionar Plan">
                    {watch('vehicleClassId') ? (
                      <SelectField
                        value={watch('planId') || ''}
                        placeholder="- Seleccionar -"
                        onCng={(v) => {
                          const plan = availablePlans.find((p) => p.id === v)
                          if (plan) {
                            setValue('planId', v)
                            setValue('plan', plan.name)
                            setValue('primaEur', plan.priceEur)
                            setValue('primaUsd', plan.priceUsd)
                            setValue('primaBs', plan.priceBs)
                            setValue('prima', plan.priceEur)
                          }
                        }}
                        options={[]}
                        optionsRaw={
                          <SelectContent>
                            {availablePlans.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — {p.priceEur}€ / {p.priceUsd}$ / {p.priceBs}Bs
                              </SelectItem>
                            ))}
                          </SelectContent>
                        }
                      />
                    ) : (
                      <p className="flex h-9 items-center text-xs text-slate-500">Primero selecciona una clase de vehículo</p>
                    )}
                  </Field>
                </div>

                {/* Price summary */}
                {watch('planId') && (
                  <div className="grid gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 sm:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Euro className="h-5 w-5 text-emerald-300" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">EUR</p>
                        <p className="text-lg font-bold text-white">{watch('primaEur')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-300" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">USD</p>
                        <p className="text-lg font-bold text-white">{watch('primaUsd')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-emerald-300" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Bs</p>
                        <p className="text-lg font-bold text-white">{watch('primaBs')}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5">
                  <p className="text-xs text-slate-400">
                    ¿Quieres ver todos los planes disponibles?
                  </p>
                  <a
                    href="?view=admin"
                    className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
                  >
                    Ver lista de precios completa →
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-slate-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Cobertura y Condiciones Adicionales
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Datos complementarios (pueden completarse luego por el equipo).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Aseguradora">
                  {options && options.ASEGURADORAS.length > 0 ? (
                    <SelectField
                      value={watch('compania') || ''}
                      placeholder="Seleccionar"
                      onCng={(v) => setValue('compania', v)}
                      options={options.ASEGURADORAS}
                    />
                  ) : (
                    <Input {...register('compania')} placeholder="Seguros..." className="bg-slate-950/50 border-white/10" />
                  )}
                </Field>
                <Field label="Plan">
                  {options && options.PLAN_TYPES.length > 0 ? (
                    <SelectField
                      value={watch('plan') || ''}
                      placeholder="Seleccionar"
                      onCng={(v) => setValue('plan', v)}
                      options={options.PLAN_TYPES}
                    />
                  ) : (
                    <Input {...register('plan')} placeholder="Plan Total" className="bg-slate-950/50 border-white/10" />
                  )}
                </Field>
                <Field label="Tipo de Cobertura">
                  <SelectField
                    value={watch('tipoCobertura') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('tipoCobertura', v)}
                    options={options?.COVERAGE_TYPES || []}
                  />
                </Field>
                <Field label="Suma Asegurada">
                  <Input {...register('sumaAsegurada')} placeholder="$ 25.000" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Prima">
                  <Input {...register('prima')} placeholder="$ 1.200" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Deducible">
                  <Input {...register('deducible')} placeholder="5%" className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Vigencia Desde">
                  <Input type="date" {...register('vigenciaDesde')} className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Vigencia Hasta">
                  <Input type="date" {...register('vigenciaHasta')} className="bg-slate-950/50 border-white/10" />
                </Field>
                <Field label="Frecuencia de Pago">
                  <SelectField
                    value={watch('frecuenciaPago') || ''}
                    placeholder="Seleccionar"
                    onCng={(v) => setValue('frecuenciaPago', v)}
                    options={['Mensual', 'Trimestral', 'Semestral', 'Anual']}
                  />
                </Field>
                <Field label="Observaciones">
                  <Textarea {...register('notes')} placeholder="Comentarios adicionales..." className="bg-slate-950/50 border-white/10 min-h-[80px]" />
                </Field>
              </CardContent>
            </Card>
            </>
          )}

          {/* STEP 3: DOCUMENTOS */}
          {step === 3 && (
            <>
              <Card className="border-white/10 bg-slate-900/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IdCard className="h-5 w-5 text-emerald-400" />
                    Documentos (Opcionales)
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Adjunta tu cédula y título de propiedad. Formatos: JPG, PNG, WEBP, PDF. Máx 10 MB cada uno.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FileDrop
                    label="Cédula de Identidad"
                    file={cedulaFile}
                    onPick={setCedulaFile}
                  />
                  <FileDrop
                    label="Título de Propiedad"
                    file={tituloFile}
                    onPick={setTituloFile}
                  />
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <div className="text-sm">
                      <p className="font-medium text-emerald-200">Listo para enviar</p>
                      <p className="mt-1 text-slate-300">
                        Revisa que los datos sean correctos. Una vez enviada, recibirás un código de verificación para consultar el estado de tu solicitud.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={step === 0 ? onBack : prevStep}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 0 ? 'Cancelar' : 'Anterior'}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Enviar Solicitud
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </main>

      <footer className="mt-auto border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Seguros Líder — Solicitud de Póliza
      </footer>
    </div>
  )
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-300">
        {label} {required && <span className="text-emerald-400">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function SelectField({
  value,
  placeholder,
  onCng,
  options,
  optionsRaw,
}: {
  value: string
  placeholder: string
  onCng: (v: string) => void
  options: string[]
  optionsRaw?: React.ReactNode
}) {
  return (
    <Select value={value} onValueChange={onCng}>
      <SelectTrigger className="bg-slate-950/50 border-white/10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      {optionsRaw ? (
        optionsRaw
      ) : (
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      )}
    </Select>
  )
}

function FileDrop({
  label,
  file,
  onPick,
}: {
  label: string
  file: File | null
  onPick: (f: File | null) => void
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-slate-300">{label}</Label>
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <FileText className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(0)} KB · {file.type}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onPick(null)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-slate-950/30 p-6 text-center transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5">
          <Upload className="h-6 w-6 text-slate-400" />
          <span className="text-sm text-slate-300">
            <span className="font-medium text-emerald-400">Haz clic</span> para subir
          </span>
          <span className="text-[10px] text-slate-500">
            {ACCEPTED_DOC_EXT.join(', ')}
          </span>
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_DOC_EXT.join(',')}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onPick(f)
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}
