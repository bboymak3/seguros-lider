'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Plus, Trash2, Save, Search, Car, Tag, Edit3, X, Check,
  Euro, DollarSign, Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type VehicleClass = {
  id: string
  code: number
  name: string
  sortOrder: number
  plans: Plan[]
}

type Plan = {
  id: string
  externalId: number
  name: string
  vehicleClassId: string
  priceEur: string
  priceUsd: string
  priceBs: string
  active: boolean
  vehicleClass?: VehicleClass
}

export function PriceListManager() {
  const [classes, setClasses] = useState<VehicleClass[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('ALL')
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    externalId: '',
    vehicleClassId: '',
    priceEur: '',
    priceUsd: '',
    priceBs: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/vehicle-classes')
      if (r.ok) {
        const { vehicleClasses } = await r.json()
        setClasses(vehicleClasses)
      }
    } catch {
      toast.error('Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function savePlan(plan: Plan) {
    try {
      const r = await fetch(`/api/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          priceEur: plan.priceEur,
          priceUsd: plan.priceUsd,
          priceBs: plan.priceBs,
          active: plan.active,
        }),
      })
      if (!r.ok) throw new Error('Error')
      const { plan: updated } = await r.json()
      toast.success('Plan actualizado')
      setEditingPlan(null)
      await load()
    } catch {
      toast.error('No se pudo actualizar')
    }
  }

  async function deletePlan(id: string) {
    if (!confirm('¿Eliminar este plan?')) return
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' })
      toast.success('Plan eliminado')
      await load()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function addPlan() {
    if (!newPlan.name || !newPlan.vehicleClassId || !newPlan.priceEur) {
      toast.error('Completa nombre, clase y precio EUR')
      return
    }
    try {
      const r = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          externalId: parseInt(newPlan.externalId) || Date.now(),
        }),
      })
      if (!r.ok) throw new Error('Error')
      toast.success('Plan creado')
      setShowAddPlan(false)
      setNewPlan({ name: '', externalId: '', vehicleClassId: '', priceEur: '', priceUsd: '', priceBs: '' })
      await load()
    } catch {
      toast.error('No se pudo crear')
    }
  }

  // Flatten all plans for display
  const allPlans = classes.flatMap((c) =>
    (c.plans || []).map((p) => ({ ...p, vehicleClass: c }))
  )

  const filtered = allPlans.filter((p) => {
    if (selectedClass !== 'ALL' && p.vehicleClassId !== selectedClass) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.vehicleClass?.name.toLowerCase().includes(q) ||
        String(p.externalId).includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Tag className="h-5 w-5 text-emerald-400" />
            Lista de Precios
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Gestiona las clases de vehículo y planes con precios en €, $ y Bs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/5 text-slate-300">
            {classes.length} clases · {allPlans.length} planes
          </Badge>
          <Button
            size="sm"
            onClick={() => setShowAddPlan(!showAddPlan)}
            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            <Plus className="mr-1 h-4 w-4" />
            Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Add plan form */}
      {showAddPlan && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <Label className="text-[11px] uppercase text-slate-400">ID</Label>
              <Input
                type="number"
                value={newPlan.externalId}
                onChange={(e) => setNewPlan({ ...newPlan, externalId: e.target.value })}
                placeholder="999"
                className="h-9 bg-slate-950/50 border-white/10"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] uppercase text-slate-400">Nombre del plan</Label>
              <Input
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="PLAN LIDER..."
                className="h-9 bg-slate-950/50 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase text-slate-400">Clase</Label>
              <Select
                value={newPlan.vehicleClassId}
                onValueChange={(v) => setNewPlan({ ...newPlan, vehicleClassId: v })}
              >
                <SelectTrigger className="h-9 bg-slate-950/50 border-white/10">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase text-slate-400">EUR</Label>
              <Input
                value={newPlan.priceEur}
                onChange={(e) => setNewPlan({ ...newPlan, priceEur: e.target.value })}
                placeholder="15.00"
                className="h-9 bg-slate-950/50 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] uppercase text-slate-400">USD</Label>
              <Input
                value={newPlan.priceUsd}
                onChange={(e) => setNewPlan({ ...newPlan, priceUsd: e.target.value })}
                placeholder="17.31"
                className="h-9 bg-slate-950/50 border-white/10"
              />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <Label className="text-[11px] uppercase text-slate-400">Bs</Label>
              <Input
                value={newPlan.priceBs}
                onChange={(e) => setNewPlan({ ...newPlan, priceBs: e.target.value })}
                placeholder="13,276.20"
                className="h-9 bg-slate-950/50 border-white/10"
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-1 lg:col-span-6">
              <Button size="sm" onClick={addPlan} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Check className="mr-1 h-4 w-4" /> Crear
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddPlan(false)} className="text-slate-400 hover:text-white">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar por nombre, clase o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900/60 border-white/10"
          />
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[200px] bg-slate-900/60 border-white/10">
            <SelectValue placeholder="Todas las clases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las clases</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plans table */}
      <Card className="border-white/10 bg-slate-900/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <Car className="h-8 w-8 opacity-30" />
              <p className="text-sm">No se encontraron planes.</p>
            </div>
          ) : (
            <div className="max-h-[36rem] overflow-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2.5">ID</th>
                    <th className="px-3 py-2.5">Clase</th>
                    <th className="px-3 py-2.5">Plan</th>
                    <th className="px-3 py-2.5 text-right">EUR</th>
                    <th className="px-3 py-2.5 text-right">USD</th>
                    <th className="px-3 py-2.5 text-right">Bs</th>
                    <th className="px-3 py-2.5 text-center">Estado</th>
                    <th className="px-3 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/5"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{p.externalId}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant="secondary" className="bg-white/5 text-slate-300">
                          {p.vehicleClass?.name || '—'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-slate-200">{p.name}</td>
                      {editingPlan?.id === p.id ? (
                        <>
                          <td className="px-3 py-2.5">
                            <Input
                              value={editingPlan.priceEur}
                              onChange={(e) => setEditingPlan({ ...editingPlan, priceEur: e.target.value })}
                              className="h-8 w-20 bg-slate-950/50 border-white/10 text-right"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              value={editingPlan.priceUsd}
                              onChange={(e) => setEditingPlan({ ...editingPlan, priceUsd: e.target.value })}
                              className="h-8 w-20 bg-slate-950/50 border-white/10 text-right"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <Input
                              value={editingPlan.priceBs}
                              onChange={(e) => setEditingPlan({ ...editingPlan, priceBs: e.target.value })}
                              className="h-8 w-28 bg-slate-950/50 border-white/10 text-right"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => setEditingPlan({ ...editingPlan, active: !editingPlan.active })}
                              className={`rounded px-2 py-0.5 text-xs font-medium ${
                                editingPlan.active
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-slate-500/15 text-slate-400'
                              }`}
                            >
                              {editingPlan.active ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => savePlan(editingPlan)}
                                className="rounded p-1 text-emerald-400 hover:bg-emerald-500/10"
                                title="Guardar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingPlan(null)}
                                className="rounded p-1 text-slate-400 hover:bg-white/10"
                                title="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-right text-slate-200">
                            <span className="flex items-center justify-end gap-1">
                              <Euro className="h-3 w-3 text-slate-500" />
                              {p.priceEur}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-200">
                            <span className="flex items-center justify-end gap-1">
                              <DollarSign className="h-3 w-3 text-slate-500" />
                              {p.priceUsd}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-200">
                            <span className="flex items-center justify-end gap-1">
                              <Coins className="h-3 w-3 text-slate-500" />
                              {p.priceBs}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              variant="outline"
                              className={
                                p.active
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                              }
                            >
                              {p.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingPlan(p)}
                                className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deletePlan(p.id)}
                                className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
