'use client'

import {
  ShieldCheck,
  FileText,
  QrCode,
  Car,
  ArrowRight,
  Lock,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage({
  onSolicitud,
  onAdmin,
}: {
  onSolicitud: () => void
  onAdmin: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="h-5 w-5 text-slate-950" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight">Seguros Líder</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-400">
                Gestión de Pólizas
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#servicios" className="hover:text-white transition-colors">
              Servicios
            </a>
            <a href="#como" className="hover:text-white transition-colors">
              Cómo funciona
            </a>
            <a href="#contacto" className="hover:text-white transition-colors">
              Contacto
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdmin}
              className="text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Lock className="mr-1.5 h-4 w-4" />
              Admin
            </Button>
            <Button
              size="sm"
              onClick={onSolicitud}
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              Solicitar Póliza
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge className="mb-5 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Plataforma digital de pólizas
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Tu póliza de seguro
                <span className="block bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  vehicular en minutos
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
                Completa la solicitud en línea, adjunta tus documentos y recibe
                tu certificado digital con código QR de verificación. Todo
                gestionado desde un panel administrativo profesional.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={onSolicitud}
                  className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Iniciar Solicitud
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onAdmin}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Lock className="mr-2 h-5 w-5" />
                  Acceso Administrativo
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Sin trámites presenciales
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Verificación QR instantánea
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Documentos seguros
                </span>
              </div>
            </div>

            {/* Hero card mockup */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 blur-2xl" />
              <Card className="relative border-white/10 bg-slate-900/80 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-emerald-400">
                        Certificado
                      </p>
                      <p className="text-xl font-bold">Póliza N° 576501</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
                      <QrCode className="h-7 w-7 text-emerald-300" />
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Tomador', 'Juan Pérez'],
                      ['Cédula', 'V-12.345.678'],
                      ['Vehículo', 'Toyota Corolla'],
                      ['Placa', 'ABC-123'],
                      ['Cobertura', 'Total'],
                      ['Vigencia', '12 meses'],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5"
                      >
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">
                          {k}
                        </p>
                        <p className="font-medium text-slate-100">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                      <ShieldCheck className="h-4 w-4" />
                      Póliza Aprobada — Vigente
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/20 text-emerald-200"
                    >
                      Verificado
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-white/10 bg-slate-900/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 md:grid-cols-4">
          {[
            ['+15.000', 'Pólizas emitidas'],
            ['99.8%', 'Tasa de aprobación'],
            ['< 24h', 'Tiempo de respuesta'],
            ['24/7', 'Verificación QR'],
          ].map(([n, l]) => (
            <div key={l} className="px-2 py-6 text-center sm:px-6">
              <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">{n}</p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="servicios" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Servicios integrados
          </h2>
          <p className="mt-4 text-slate-400">
            Una plataforma completa para la gestión del ciclo de vida de tu
            póliza vehicular.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: 'Solicitud digital',
              desc: 'Formulario guiado con validación. Adjunta cédula y título de propiedad opcionalmente.',
            },
            {
              icon: QrCode,
              title: 'Certificado con QR',
              desc: 'Cada póliza genera un PDF con un código QR único que enlaza a su página de verificación pública.',
            },
            {
              icon: ShieldCheck,
              title: 'Verificación pública',
              desc: 'Al escanear el QR se abre una página con los datos validados de la póliza, como un certificado digital.',
            },
            {
              icon: Car,
              title: 'Cobertura vehicular',
              desc: 'Soporte para automóviles, motos y vehículos comerciales con datos técnicos completos.',
            },
            {
              icon: Clock,
              title: 'Panel administrativo',
              desc: 'Gestiona solicitudes pendientes, aprueba, edita datos y administra documentos desde un dashboard.',
            },
            {
              icon: Lock,
              title: 'Almacenamiento seguro',
              desc: 'Los documentos se almacenan en buckets con organización por carpeta y control de acceso.',
            },
          ].map((s) => (
            <Card
              key={s.title}
              className="border-white/10 bg-slate-900/60 transition-colors hover:border-emerald-500/30 hover:bg-slate-900"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                  <s.icon className="h-5 w-5 text-emerald-300" />
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {s.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como" className="border-t border-white/10 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Cómo funciona
            </h2>
            <p className="mt-4 text-slate-400">
              Cuatro pasos desde la solicitud hasta la verificación.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              ['01', 'Completa el formulario', 'Datos del tomador y vehículo.'],
              ['02', 'Adjunta documentos', 'Cédula y título (opcional).'],
              ['03', 'Revisión y aprobación', 'El equipo valida la solicitud.'],
              ['04', 'Recibe tu certificado', 'PDF con QR para verificación.'],
            ].map(([n, t, d], i) => (
              <div key={n} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  <span className="text-sm font-bold">{n}</span>
                </div>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-slate-400">{d}</p>
                {i < 3 && (
                  <ArrowRight className="absolute -right-3 top-4 hidden h-5 w-5 text-slate-600 md:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              size="lg"
              onClick={onSolicitud}
              className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              Comenzar ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['María G.', 'El proceso fue rapidísimo, en un día tenía mi póliza lista.'],
            ['Carlos R.', 'El QR de verificación es genial, lo presento donde quiera.'],
            ['Andrea P.', 'Subí mis documentos desde el celular sin complicaciones.'],
          ].map(([name, quote]) => (
            <Card key={name} className="border-white/10 bg-slate-900/60">
              <CardContent className="p-6">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  &ldquo;{quote}&rdquo;
                </p>
                <p className="mt-4 text-sm font-medium text-emerald-300">{name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="border-t border-white/10 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium">Teléfono</p>
                <p className="text-sm text-slate-400">+58 212-XXXXXXX</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium">Correo</p>
                <p className="text-sm text-slate-400">contacto@seguroslider.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium">Oficina</p>
                <p className="text-sm text-slate-400">Caracas, Venezuela</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-slate-400">
              © {new Date().getFullYear()} Seguros Líder. Todos los derechos reservados.
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Términos</span>
            <span>Privacidad</span>
            <span>Política de Cookies</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
