'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, ShieldCheck, ArrowRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Result = {
  verifyCode: string
  policyNumber?: string | null
  status: string
  nombre: string
  apellido?: string | null
  marca?: string | null
  modelo?: string | null
  placa?: string | null
  createdAt: string
}

export function PublicLookup() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [searched, setSearched] = useState(false)

  async function search(e?: React.FormEvent) {
    e?.preventDefault()
    if (q.trim().length < 3) return
    setLoading(true)
    setSearched(true)
    try {
      const r = await fetch(`/api/policies/lookup?q=${encodeURIComponent(q.trim())}`)
      if (r.ok) {
        const { results } = await r.json()
        setResults(results)
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (s: string) =>
    s === 'APROBADA'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : s === 'RECHAZADA'
        ? 'border-red-500/30 bg-red-500/10 text-red-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cédula, placa o código de verificación..."
            className="border-white/15 bg-white/5 pl-9 text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || q.trim().length < 3}
          className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-1.5 h-4 w-4" />
          )}
          Consultar
        </Button>
      </form>

      {searched && (
        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
              No se encontraron pólizas con ese criterio.
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.verifyCode}
                onClick={() => router.push(`?v=${r.verifyCode}`)}
                className="group flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                  <FileText className="h-5 w-5 text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-white">
                      {r.nombre} {r.apellido || ''}
                    </p>
                    <Badge variant="outline" className={statusColor(r.status)}>
                      {r.status}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {r.policyNumber ? `Póliza N° ${r.policyNumber}` : `Código ${r.verifyCode}`}
                    {r.marca ? ` · ${r.marca} ${r.modelo || ''}` : ''}
                    {r.placa ? ` · Placa ${r.placa}` : ''}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-emerald-300" />
              </button>
            ))
          )}
        </div>
      )}

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        Consulta pública y segura · Ingresa cédula, placa o código de 6 dígitos
      </p>
    </div>
  )
}
