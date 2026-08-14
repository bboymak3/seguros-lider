'use client'

import { useRouter } from 'next/navigation'
import { Check, X, Shield, ShieldCheck, Crown, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Plan = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  price: string
  period: string
  popular?: boolean
  color: string
  ring: string
  features: { label: string; included: boolean }[]
}

const PLANS: Plan[] = [
  {
    name: 'Responsabilidad Civil',
    icon: Shield,
    price: '$ 25',
    period: '/mes',
    color: 'text-sky-300',
    ring: 'ring-sky-500/20',
    features: [
      { label: 'Cobertura de daños a terceros', included: true },
      { label: 'Defensa legal', included: true },
      { label: 'Asistencia vial básica', included: true },
      { label: 'Robo total del vehículo', included: false },
      { label: 'Daños propios del vehículo', included: false },
      { label: 'Pérdida total', included: false },
    ],
  },
  {
    name: 'Cobertura Total',
    icon: ShieldCheck,
    price: '$ 65',
    period: '/mes',
    popular: true,
    color: 'text-emerald-300',
    ring: 'ring-emerald-500/30',
    features: [
      { label: 'Cobertura de daños a terceros', included: true },
      { label: 'Defensa legal', included: true },
      { label: 'Asistencia vial 24/7', included: true },
      { label: 'Robo total del vehículo', included: true },
      { label: 'Daños propios del vehículo', included: true },
      { label: 'Pérdida total', included: false },
    ],
  },
  {
    name: 'Cobertura Amplia',
    icon: Crown,
    price: '$ 95',
    period: '/mes',
    color: 'text-violet-300',
    ring: 'ring-violet-500/20',
    features: [
      { label: 'Cobertura de daños a terceros', included: true },
      { label: 'Defensa legal premium', included: true },
      { label: 'Asistencia vial 24/7 + grúa', included: true },
      { label: 'Robo total y parcial', included: true },
      { label: 'Daños propios + cristales', included: true },
      { label: 'Pérdida total y parcial', included: true },
    ],
  },
]

export function CoverageComparison() {
  const router = useRouter()

  function selectPlan(plan: Plan) {
    router.push(`?view=solicitud&cobertura=${encodeURIComponent(plan.name)}`)
  }

  return (
    <section id="coberturas" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="mb-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10">
          Compara y elige
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Nuestros planes de cobertura
        </h2>
        <p className="mt-3 text-slate-400">
          Encuentra la protección ideal para tu vehículo. Precios de referencia, las condiciones
          finales se ajustan según tu perfil.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`group relative flex flex-col overflow-hidden border-white/10 bg-slate-900/60 ring-1 ${plan.ring} transition-all hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 ${
              plan.popular ? 'lg:scale-105 lg:shadow-2xl lg:shadow-emerald-500/10' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute right-0 top-0 bg-gradient-to-l from-emerald-500 to-teal-500 px-4 py-1 text-xs font-bold text-slate-950">
                MÁS POPULAR
              </div>
            )}
            <CardContent className="flex flex-1 flex-col p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                  <plan.icon className={`h-5 w-5 ${plan.color}`} />
                </div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-slate-400">{plan.period}</span>
              </div>

              <ul className="flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-sm">
                    {f.included ? (
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                        <Check className="h-3 w-3 text-emerald-300" />
                      </div>
                    ) : (
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5">
                        <X className="h-3 w-3 text-slate-500" />
                      </div>
                    )}
                    <span className={f.included ? 'text-slate-200' : 'text-slate-500 line-through'}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-slate-400">
                  Deducible desde <span className="font-semibold text-slate-200">5%</span> · Suma
                  asegurada hasta <span className="font-semibold text-slate-200">$ 25.000</span>
                </p>
              </div>

              <Button
                onClick={() => selectPlan(plan)}
                variant={plan.popular ? 'default' : 'outline'}
                className={`mt-4 w-full ${
                  plan.popular
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white'
                }`}
              >
                Elegir este plan
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        * Los precios mostrados son referenciales y pueden variar según el vehículo, antigüedad y
        perfil del conductor. Solicita tu cotización personalizada.
      </p>
    </section>
  )
}
