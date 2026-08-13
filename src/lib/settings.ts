import { db } from './db'

/**
 * Settings helper — stores configurable lists (aseguradoras, coverage types,
 * vehicle types, plan types) as JSON in the Setting table.
 *
 * On Cloudflare D1 these would be the same model; the storage is just key/value.
 */

export const SETTING_KEYS = {
  ASEGURADORAS: 'ASEGURADORAS',
  COVERAGE_TYPES: 'COVERAGE_TYPES',
  VEHICLE_TYPES: 'VEHICLE_TYPES',
  PLAN_TYPES: 'PLAN_TYPES',
} as const

type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]

const DEFAULTS: Record<SettingKey, string[]> = {
  ASEGURADORAS: [
    'Seguros Caracas',
    'Mapfre La Seguridad',
    'Oriental de Seguros',
    'Seguros La Previsora',
    'Banesco Seguros',
    'Multinacional de Seguros',
    'Seguros Carabobo',
    'Mappfre',
  ],
  COVERAGE_TYPES: [
    'Responsabilidad Civil',
    'Cobertura Total',
    'Cobertura Amplia',
    'Pérdida Total',
  ],
  VEHICLE_TYPES: [
    'Automóvil',
    'Moto',
    'Camión',
    'Camioneta',
    'Pickup',
    'Autobús',
  ],
  PLAN_TYPES: ['Plan Básico', 'Plan Total', 'Plan Premium', 'Plan Ejecutivo'],
}

export async function getSetting(key: SettingKey): Promise<string[]> {
  const row = await db.setting.findUnique({ where: { key } })
  if (row) {
    try {
      return JSON.parse(row.value)
    } catch {
      // fall through to default
    }
  }
  return DEFAULTS[key]
}

export async function setSetting(key: SettingKey, values: string[]): Promise<void> {
  const value = JSON.stringify(values.filter((v) => v.trim().length > 0))
  await db.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export async function getAllSettings(): Promise<Record<SettingKey, string[]>> {
  const [aseguradoras, coverageTypes, vehicleTypes, planTypes] = await Promise.all([
    getSetting(SETTING_KEYS.ASEGURADORAS),
    getSetting(SETTING_KEYS.COVERAGE_TYPES),
    getSetting(SETTING_KEYS.VEHICLE_TYPES),
    getSetting(SETTING_KEYS.PLAN_TYPES),
  ])
  return {
    ASEGURADORAS: aseguradoras,
    COVERAGE_TYPES: coverageTypes,
    VEHICLE_TYPES: vehicleTypes,
    PLAN_TYPES: planTypes,
  }
}
