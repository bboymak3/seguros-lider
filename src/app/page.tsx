'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import LandingPage from '@/components/seguros/landing-page'
import SolicitudForm from '@/components/seguros/solicitud-form'
import AdminDashboard from '@/components/seguros/admin-dashboard'
import VerifyPage from '@/components/seguros/verify-page'

function Router() {
  const sp = useSearchParams()
  const router = useRouter()
  const v = sp.get('v')
  const view = sp.get('view')

  // ?v=CODE -> public verification page (from QR)
  if (v) {
    return <VerifyPage code={v} onBack={() => router.push('/')} />
  }

  // ?view=admin -> admin dashboard (client-side gate inside)
  if (view === 'admin') {
    return <AdminDashboard onExit={() => router.push('/')} />
  }

  // ?view=solicitud -> the request form
  if (view === 'solicitud') {
    const cobertura = sp.get('cobertura')
    return (
      <SolicitudForm
        prefillCobertura={cobertura || undefined}
        onDone={(code) => router.push(`?v=${code}`)}
        onBack={() => router.push('/')}
      />
    )
  }

  return (
    <LandingPage
      onSolicitud={() => router.push('?view=solicitud')}
      onAdmin={() => router.push('?view=admin')}
    />
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Router />
    </Suspense>
  )
}
