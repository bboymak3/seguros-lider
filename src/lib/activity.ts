import { db } from './db'

export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'STATUS_CHANGED'
  | 'PDF_GENERATED'
  | 'ANULADA'

export async function logActivity(
  policyId: string,
  action: ActivityAction,
  description: string,
  actor = 'admin',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        policyId,
        action,
        description,
        actor,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (e) {
    // never fail the parent operation because of logging
    console.error('logActivity error', e)
  }
}

export const ACTION_LABELS: Record<ActivityAction, string> = {
  CREATED: 'Solicitud creada',
  UPDATED: 'Datos actualizados',
  APPROVED: 'Póliza aprobada',
  REJECTED: 'Solicitud rechazada',
  DOCUMENT_UPLOADED: 'Documento adjuntado',
  DOCUMENT_DELETED: 'Documento eliminado',
  STATUS_CHANGED: 'Estado cambiado',
  PDF_GENERATED: 'Certificado PDF generado',
  ANULADA: 'Póliza anulada',
}
