'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { useCountUp, useInView } from './use-count-up'

const FAQS = [
  {
    q: '¿Cuánto tiempo toma aprobar una póliza?',
    a: 'El tiempo promedio de aprobación es menor a 24 horas desde que se completa la solicitud. Una vez aprobada, recibirás tu certificado digital con código QR de verificación al instante.',
  },
  {
    q: '¿Qué documentos necesito para solicitar una póliza?',
    a: 'Los documentos principales son tu cédula de identidad y el título de propiedad del vehículo. Ambos son opcionales al momento de la solicitud, pero se recomienda adjuntarlos para agilizar el proceso. Aceptamos formatos JPG, PNG, WEBP y PDF.',
  },
  {
    q: '¿Cómo verifico la validez de mi póliza?',
    a: 'Cada certificado incluye un código QR único. Al escanearlo con cualquier cámara de celular, se abre automáticamente una página web con los datos validados de tu póliza. También puedes consultar por tu cédula o placa en nuestra página principal.',
  },
  {
    q: '¿Qué tipos de vehículos puedo asegurar?',
    a: 'Aseguramos automóviles, motos, camiones, camionetas, pickups y autobuses. La cobertura se adapta al tipo de vehículo y su uso (particular, carga, público o diplomático).',
  },
  {
    q: '¿Qué coberturas están disponibles?',
    a: 'Ofrecemos Responsabilidad Civil, Cobertura Total, Cobertura Amplia y Pérdida Total. Cada modalidad tiene diferentes niveles de protección y deducibles. Nuestro equipo puede asesorarte para elegir la que mejor se adapte a tus necesidades.',
  },
  {
    q: '¿Puedo editar mi solicitud después de enviarla?',
    a: 'Sí. Una vez enviada, nuestro equipo administrativo puede modificar cualquier dato de tu solicitud. Si necesitas corregir algo, contáctanos con tu código de verificación y haremos el ajuste.',
  },
]

function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const count = useCountUp(value, 1800, inView)
  return (
    <div ref={ref} className="px-2 py-6 text-center sm:px-6">
      <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">
        {count.toLocaleString('es-VE')}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-slate-400 sm:text-sm">{label}</p>
    </div>
  )
}

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/60 transition-colors hover:border-emerald-500/30">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-slate-100 sm:text-base">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-emerald-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{a}</p>
        </div>
      </div>
    </div>
  )
}

export function AnimatedStats() {
  return (
    <section className="border-y border-white/10 bg-slate-900/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 md:grid-cols-4">
        <AnimatedStat value={15000} label="Pólizas emitidas" suffix="+" />
        <AnimatedStat value={99} label="Tasa de aprobación" suffix="%" />
        <AnimatedStat value={24} label="Tiempo de respuesta (h)" suffix="<" />
        <AnimatedStat value={7} label="Verificación QR" suffix="/24" />
      </div>
    </section>
  )
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          <HelpCircle className="h-3.5 w-3.5" />
          Preguntas frecuentes
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Resolvemos tus dudas
        </h2>
        <p className="mt-3 text-slate-400">
          Todo lo que necesitas saber sobre el proceso de solicitud y verificación.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <FaqItem
            key={i}
            q={faq.q}
            a={faq.a}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <p className="text-sm text-slate-300">
          ¿Tienes otra pregunta? Escríbenos a{' '}
          <a
            href="mailto:contacto@seguroslider.com"
            className="font-medium text-emerald-300 underline decoration-emerald-500/30 underline-offset-2 hover:decoration-emerald-400"
          >
            contacto@seguroslider.com
          </a>{' '}
          y te responderemos a la brevedad.
        </p>
      </div>
    </section>
  )
}
