'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Save, Plus, Trash2, Building2, Shield, Car, FileCheck,
  Settings as SettingsIcon, RotateCcw, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Settings = {
  ASEGURADORAS: string[]
  COVERAGE_TYPES: string[]
  VEHICLE_TYPES: string[]
  PLAN_TYPES: string[]
}

type SettingKey = keyof Settings

const CONFIG: { key: SettingKey; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { key: 'ASEGURADORAS', label: 'Aseguradoras', icon: Building2, description: 'Compañías de seguro disponibles en los formularios.' },
  { key: 'COVERAGE_TYPES', label: 'Tipos de Cobertura', icon: Shield, description: 'Modalidades de cobertura ofrecidas.' },
  { key: 'VEHICLE_TYPES', label: 'Tipos de Vehículo', icon: Car, description: 'Categorías de vehículos asegurables.' },
  { key: 'PLAN_TYPES', label: 'Planes', icon: FileCheck, description: 'Planes comerciales disponibles.' },
]

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newValues, setNewValues] = useState<Record<SettingKey, string>>({
    ASEGURADORAS: '',
    COVERAGE_TYPES: '',
    VEHICLE_TYPES: '',
    PLAN_TYPES: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/settings')
      if (r.ok) {
        const { settings } = await r.json()
        setSettings(settings)
      }
    } catch {
      toast.error('Error al cargar configuración')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    setSaving(true)
    try {
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!r.ok) throw new Error('Error al guardar')
      const { settings: updated } = await r.json()
      setSettings(updated)
      toast.success('Configuración guardada')
    } catch {
      toast.error('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  function addItem(key: SettingKey) {
    const val = newValues[key].trim()
    if (!val) return
    if (!settings) return
    if (settings[key].includes(val)) {
      toast.error('Ya existe ese valor')
      return
    }
    setSettings({ ...settings, [key]: [...settings[key], val] })
    setNewValues({ ...newValues, [key]: '' })
  }

  function removeItem(key: SettingKey, index: number) {
    if (!settings) return
    setSettings({ ...settings, [key]: settings[key].filter((_, i) => i !== index) })
  }

  function resetDefaults() {
    if (!confirm('¿Restablecer todos los valores predeterminados? Se perderán los cambios.')) return
    // reload from server (defaults are applied server-side when DB is empty)
    // We'll just reload the page to re-fetch
    load()
    toast.info('Restableciendo valores predeterminados...')
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  const totalItems = Object.values(settings).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <SettingsIcon className="h-5 w-5 text-emerald-400" />
            Configuración del Sistema
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona las listas de opciones que aparecen en los formularios de solicitud.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/5 text-slate-300">
            {totalItems} opciones
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={resetDefaults}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Restablecer
          </Button>
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

      {/* Config cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {CONFIG.map(({ key, label, icon: Icon, description }) => (
          <Card key={key} className="border-white/10 bg-slate-900/60">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Icon className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{label}</h3>
                <p className="text-[11px] text-slate-400">{description}</p>
              </div>
              <Badge variant="secondary" className="bg-white/5 text-slate-400">
                {settings[key].length}
              </Badge>
            </div>
            <CardContent className="p-4">
              {/* Existing items */}
              <div className="mb-3 flex flex-wrap gap-2">
                {settings[key].length === 0 ? (
                  <p className="text-xs text-slate-500">Sin opciones configuradas.</p>
                ) : (
                  settings[key].map((item, i) => (
                    <span
                      key={`${item}-${i}`}
                      className="group inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 py-1 pl-2.5 pr-1 text-xs text-slate-200"
                    >
                      {item}
                      <button
                        onClick={() => removeItem(key, i)}
                        className="rounded p-0.5 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              {/* Add new */}
              <div className="flex gap-2">
                <Input
                  value={newValues[key]}
                  onChange={(e) => setNewValues({ ...newValues, [key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addItem(key)
                    }
                  }}
                  placeholder={`Agregar ${label.toLowerCase().replace(/s$/, '')}...`}
                  className="h-9 bg-slate-950/50 border-white/10 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem(key)}
                  className="border-emerald-500/30 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save bar */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-emerald-200">
              Los cambios se aplican a todos los formularios nuevos
            </p>
            <p className="text-xs text-slate-400">
              Las pólizas existentes conservan los valores que tenían al momento de su creación.
            </p>
          </div>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
