'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCircle2, XCircle, Clock, FilePlus2, FileEdit, FileCheck2, FileX, Ban, Paperclip, FileMinus, FileText, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Notification = {
  id: string
  action: string
  description: string
  actor: string
  createdAt: string
  policy: {
    verifyCode: string
    policyNumber: string | null
    nombre: string
    apellido: string | null
    status: string
  }
}

const ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CREATED: { icon: FilePlus2, color: 'text-sky-300' },
  UPDATED: { icon: FileEdit, color: 'text-slate-600' },
  APPROVED: { icon: FileCheck2, color: 'text-emerald-300' },
  REJECTED: { icon: FileX, color: 'text-red-300' },
  ANULADA: { icon: Ban, color: 'text-slate-600' },
  DOCUMENT_UPLOADED: { icon: Paperclip, color: 'text-violet-300' },
  DOCUMENT_DELETED: { icon: FileMinus, color: 'text-amber-300' },
  PDF_GENERATED: { icon: FileText, color: 'text-teal-300' },
  STATUS_CHANGED: { icon: Activity, color: 'text-slate-600' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-VE')
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const lastSeen = useRef<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/notifications?limit=15')
      if (r.ok) {
        const { activities } = await r.json()
        setNotifications(activities)
        // count unread = notifications newer than lastSeen
        if (activities.length > 0) {
          const newest = activities[0].createdAt
          if (!lastSeen.current) {
            setUnreadCount(activities.length)
          } else {
            const count = activities.filter((a: Notification) => a.createdAt > (lastSeen.current || '')).length
            setUnreadCount(count)
          }
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && notifications.length > 0) {
      lastSeen.current = notifications[0].createdAt
      setUnreadCount(0)
    }
    if (willOpen) load()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-300 hover:text-slate-900"
        title="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-slate-300 bg-slate-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-300 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold">Notificaciones</h3>
            </div>
            <Badge variant="secondary" className="bg-slate-200 text-slate-500">
              {notifications.length} recientes
            </Badge>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = ICONS[n.action] || { icon: Activity, color: 'text-slate-600' }
                const Icon = cfg.icon
                return (
                  <div
                    key={n.id}
                    className="flex gap-3 border-b border-slate-200 px-4 py-3 transition-colors last:border-0 hover:bg-slate-200"
                  >
                    <div className="mt-0.5 shrink-0">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-slate-800">
                        {n.description}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="font-medium text-slate-500">
                          {n.policy.nombre} {n.policy.apellido || ''}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-emerald-400">
                          {n.policy.policyNumber || n.policy.verifyCode}
                        </span>
                        <span>·</span>
                        <span>{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="border-t border-slate-300 px-4 py-2 text-center">
            <p className="text-[10px] text-slate-500">
              Actualizado cada 30 segundos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
