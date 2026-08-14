import { NextResponse } from 'next/server'
import { isD1, d1Run, d1First } from '@/lib/d1'
import { generateVerifyCode } from '@/lib/policy-utils'

export const dynamic = 'force-dynamic'

const NOMBRES = ['JUAN', 'MARIA', 'CARLOS', 'JOSE', 'ANA', 'LUIS', 'PEDRO', 'MILAGROS', 'FRANCISCO', 'MERCEDES']
const APELLIDOS = ['PEREZ', 'GONZALEZ', 'MIRABAL', 'RODRIGUEZ', 'GARCIA', 'MARTINEZ', 'LOPEZ', 'VALENCIA', 'SANCHEZ', 'RAMIREZ']
const MARCAS = ['TOYOTA', 'HONDA', 'HAOJIN', 'CHEVROLET', 'FORD', 'HYUNDAI', 'KIA', 'NISSAN']
const COLORES = ['BLANCO', 'NEGRO', 'GRIS', 'ROJO', 'AZUL', 'PLATA']
const USOS = ['Particular', 'Carga', 'Público']
const CLASES = ['vc_12', 'vc_18', 'vc_03', 'vc_25', 'vc_13'] // MOTO, PARTICULAR, CARGA, AUTOBUSES, RUSTICO

/** POST /api/policies/seed-test — creates a fake policy for testing */
export async function POST() {
  try {
    const verifyCode = await generateVerifyCode()
    const id = 'pol_test_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    const now = new Date().toISOString()
    
    const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)]
    const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]
    const cedula = String(Math.floor(1000000 + Math.random() * 8999999))
    const marca = MARCAS[Math.floor(Math.random() * MARCAS.length)]
    const modelo = String(2018 + Math.floor(Math.random() * 8))
    const color = COLORES[Math.floor(Math.random() * COLORES.length)]
    const uso = USOS[Math.floor(Math.random() * USOS.length)]
    const placa = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '-' +
      Math.floor(100 + Math.random() * 899)
    const serialMotor = 'MR' + Math.floor(100000000 + Math.random() * 899999999)
    const serialCarroceria = '8X' + Math.floor(1000000000 + Math.random() * 8999999999)
    const vehicleClassId = CLASES[Math.floor(Math.random() * CLASES.length)]
    
    // Get a random plan for the class
    let planId = ''
    let planName = ''
    let primaEur = ''
    let primaUsd = ''
    let primaBs = ''
    
    if (isD1()) {
      const plan = await d1First<{ id: string; name: string; priceEur: string; priceUsd: string; priceBs: string }>(
        'SELECT id, name, priceEur, priceUsd, priceBs FROM Plan WHERE vehicleClassId = ? AND active = 1 ORDER BY RANDOM() LIMIT 1',
        [vehicleClassId]
      )
      if (plan) {
        planId = plan.id
        planName = plan.name
        primaEur = plan.priceEur
        primaUsd = plan.priceUsd
        primaBs = plan.priceBs
      }
    }

    if (isD1()) {
      const fields = [
        'id', 'verifyCode', 'status', 'createdAt', 'updatedAt',
        'nombre', 'apellido', 'cedula', 'telefono',
        'asegNombre', 'asegApellido', 'asegCedula',
        'tomNombre', 'tomApellido', 'tomCedula', 'tomTelefono',
        'tomEstado', 'tomMunicipio', 'tomParroquia', 'tomDireccion',
        'placa', 'marca', 'modelo', 'ano', 'color', 'uso',
        'serialCarroceria', 'serialMotor',
        'poseeTrailer', 'placaExtranjera',
        'vehicleClassId', 'planId', 'plan',
        'primaEur', 'primaUsd', 'primaBs',
        'vigenciaDesde', 'vigenciaHasta',
      ]
      const values = [
        id, verifyCode, 'PENDIENTE', now, now,
        nombre, apellido, cedula, '0412' + Math.floor(1000000 + Math.random() * 8999999),
        nombre, apellido, cedula,
        nombre, apellido, cedula, '0412' + Math.floor(1000000 + Math.random() * 8999999),
        'ARAGUA', 'GIRARDOT', 'JOSE CASANOVA GODOY', 'AV PRINCIPAL, SECTOR CENTRO',
        placa, marca, modelo, modelo, color, uso,
        serialCarroceria, serialMotor,
        'No', 'No',
        vehicleClassId, planId, planName,
        primaEur, primaUsd, primaBs,
        '', '',
      ]
      
      const placeholders = fields.map(() => '?').join(', ')
      await d1Run(`INSERT INTO Policy (${fields.join(', ')}) VALUES (${placeholders})`, values)
      
      // Log activity
      await d1Run(
        `INSERT INTO ActivityLog (id, policyId, action, description, actor, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        ['act_test_' + Date.now(), id, 'CREATED', `Solicitud ficticia creada: ${nombre} ${apellido} (V-${cedula})`, 'test', now]
      )

      return NextResponse.json({ 
        policy: { id, verifyCode, status: 'PENDIENTE', nombre, apellido, marca, placa, plan: planName },
        message: `Solicitud ficticia creada: ${nombre} ${apellido} — Código: ${verifyCode}`
      }, { status: 201 })
    } else {
      return NextResponse.json({ error: 'Solo disponible en producción' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Error: ' + (e as Error).message }, { status: 500 })
  }
}
