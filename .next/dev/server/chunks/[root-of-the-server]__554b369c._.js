module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/d1.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "d1First",
    ()=>d1First,
    "d1Query",
    ()=>d1Query,
    "d1Run",
    ()=>d1Run,
    "isD1",
    ()=>isD1
]);
/**
 * D1 Database adapter — uses raw SQL queries on Cloudflare D1.
 * Falls back to Prisma on local dev.
 */ function getD1() {
    try {
        const g = globalThis;
        const d1 = g.DB;
        if (d1 && typeof d1.prepare === 'function') return d1;
    } catch  {}
    try {
        const { getRequestContext } = (()=>{
            const e = new Error("Cannot find module '@opennextjs/cloudflare/next'");
            e.code = 'MODULE_NOT_FOUND';
            throw e;
        })();
        const env = getRequestContext().env;
        const d1 = env.DB;
        if (d1 && typeof d1.prepare === 'function') return d1;
    } catch  {}
    return null;
}
const isD1 = ()=>getD1() !== null;
async function d1Query(sql, params = []) {
    const d1 = getD1();
    if (!d1) throw new Error('D1 not available');
    const stmt = params.length > 0 ? d1.prepare(sql).bind(...params) : d1.prepare(sql);
    const result = await stmt.all();
    return result.results || [];
}
async function d1Run(sql, params = []) {
    const d1 = getD1();
    if (!d1) throw new Error('D1 not available');
    const stmt = params.length > 0 ? d1.prepare(sql).bind(...params) : d1.prepare(sql);
    await stmt.run();
}
async function d1First(sql, params = []) {
    const rows = await d1Query(sql, params);
    return rows[0] || null;
}
}),
"[project]/src/lib/policy-utils.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACCEPTED_DOC_EXT",
    ()=>ACCEPTED_DOC_EXT,
    "ACCEPTED_DOC_MIMES",
    ()=>ACCEPTED_DOC_MIMES,
    "formatPolicyNumber",
    ()=>formatPolicyNumber,
    "generateVerifyCode",
    ()=>generateVerifyCode,
    "nextPolicyNumber",
    ()=>nextPolicyNumber,
    "safeFileName",
    ()=>safeFileName,
    "validateDocFile",
    ()=>validateDocFile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/d1.ts [app-route] (ecmascript)");
;
async function generateVerifyCode() {
    for(let i = 0; i < 20; i++){
        const code = String(Math.floor(100000 + Math.random() * 899999));
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            const row = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])('SELECT verifyCode FROM Policy WHERE verifyCode = ?', [
                code
            ]);
            if (!row) return code;
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const exists = await db.policy.findUnique({
                where: {
                    verifyCode: code
                }
            });
            if (!exists) return code;
        }
    }
    // fallback with timestamp suffix
    return String(Date.now()).slice(-6);
}
function formatPolicyNumber(n) {
    return String(n).padStart(6, '0');
}
async function nextPolicyNumber() {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
        const row = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])("SELECT COUNT(*) as c FROM Policy WHERE status = 'APROBADA'");
        return formatPolicyNumber((row?.c || 0) + 1);
    } else {
        const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
        const count = await db.policy.count({
            where: {
                status: 'APROBADA'
            }
        });
        return formatPolicyNumber(count + 1);
    }
}
const ACCEPTED_DOC_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
];
const ACCEPTED_DOC_EXT = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.pdf'
];
function validateDocFile(file) {
    if (!ACCEPTED_DOC_MIMES.includes(file.type)) {
        return `Formato no permitido: ${file.type}. Use JPG, PNG, WEBP o PDF.`;
    }
    // 10 MB cap
    if (file.size > 10 * 1024 * 1024) {
        return 'El archivo excede el tamaño máximo de 10 MB.';
    }
    return null;
}
function safeFileName(name) {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}
}),
"[project]/src/app/api/policies/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/d1.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$policy$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/policy-utils.ts [app-route] (ecmascript)");
;
;
;
const dynamic = 'force-dynamic';
async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const q = searchParams.get('q');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            const conditions = [];
            const params = [];
            if (status && status !== 'ALL') {
                conditions.push('p.status = ?');
                params.push(status);
            }
            if (q) {
                conditions.push('(p.nombre LIKE ? OR p.apellido LIKE ? OR p.cedula LIKE ? OR p.placa LIKE ? OR p.verifyCode LIKE ? OR p.policyNumber LIKE ?)');
                const pattern = `%${q}%`;
                params.push(pattern, pattern, pattern, pattern, pattern, pattern);
            }
            if (from) {
                conditions.push('p.createdAt >= ?');
                params.push(new Date(from).toISOString());
            }
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                conditions.push('p.createdAt <= ?');
                params.push(toDate.toISOString());
            }
            const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const offset = (page - 1) * pageSize;
            const [rows, totalRow] = await Promise.all([
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])(`
          SELECT p.*, (
            SELECT json_group_array(json_object(
              'id', d.id, 'policyId', d.policyId, 'tipo', d.tipo,
              'fileName', d.fileName, 'filePath', d.filePath,
              'mimeType', d.mimeType, 'size', d.size, 'createdAt', d.createdAt
            ))
            FROM Document d WHERE d.policyId = p.id
          ) as documents
          FROM Policy p
          ${whereSql}
          ORDER BY p.createdAt DESC
          LIMIT ? OFFSET ?
        `, [
                    ...params,
                    pageSize,
                    offset
                ]),
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])(`SELECT COUNT(*) as c FROM Policy p ${whereSql}`, params)
            ]);
            const total = Number(totalRow?.c || 0);
            const policies = rows.map((r)=>{
                const docsRaw = r.documents;
                delete r.documents;
                let documents = [];
                if (typeof docsRaw === 'string' && docsRaw) {
                    try {
                        documents = JSON.parse(docsRaw);
                    } catch  {
                        documents = [];
                    }
                }
                return {
                    ...r,
                    documents
                };
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policies,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                    hasNext: page * pageSize < total,
                    hasPrev: page > 1
                }
            });
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const where = {};
            if (status && status !== 'ALL') where.status = status;
            if (q) {
                where.OR = [
                    {
                        nombre: {
                            contains: q
                        }
                    },
                    {
                        apellido: {
                            contains: q
                        }
                    },
                    {
                        cedula: {
                            contains: q
                        }
                    },
                    {
                        placa: {
                            contains: q
                        }
                    },
                    {
                        verifyCode: {
                            contains: q
                        }
                    },
                    {
                        policyNumber: {
                            contains: q
                        }
                    }
                ];
            }
            if (from || to) {
                const range = {};
                if (from) range.gte = new Date(from);
                if (to) {
                    const toDate = new Date(to);
                    toDate.setHours(23, 59, 59, 999);
                    range.lte = toDate;
                }
                where.createdAt = range;
            }
            const [policies, total] = await Promise.all([
                db.policy.findMany({
                    where,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        documents: true
                    },
                    skip: (page - 1) * pageSize,
                    take: pageSize
                }),
                db.policy.count({
                    where
                })
            ]);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policies,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize),
                    hasNext: page * pageSize < total,
                    hasPrev: page > 1
                }
            });
        }
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: e.message
        }, {
            status: 500
        });
    }
}
async function POST(req) {
    try {
        const body = await req.json();
        const verifyCode = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$policy$2d$utils$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generateVerifyCode"])();
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            // D1 raw SQL insert
            const id = 'pol_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            const now = new Date().toISOString();
            const fields = [
                'id',
                'verifyCode',
                'status',
                'createdAt',
                'updatedAt',
                'nombre',
                'apellido',
                'cedula',
                'telefono',
                'email',
                'asegNombre',
                'asegApellido',
                'asegCedula',
                'asegEmail',
                'tomNombre',
                'tomApellido',
                'tomCedula',
                'tomEmail',
                'tomFechaNacimiento',
                'tomEstadoCivil',
                'tomGenero',
                'tomTelefono',
                'tomEstado',
                'tomMunicipio',
                'tomParroquia',
                'tomDireccion',
                'placa',
                'marca',
                'modelo',
                'tipoVehiculo',
                'ano',
                'color',
                'serialCarroceria',
                'serialMotor',
                'uso',
                'cantidadPuestos',
                'capacidadCarga',
                'poseeTrailer',
                'placaExtranjera',
                'vehicleClassId',
                'planId',
                'plan',
                'prima',
                'primaEur',
                'primaUsd',
                'primaBs'
            ];
            const values = [
                id,
                verifyCode,
                'PENDIENTE',
                now,
                now,
                body.nombre || 'Sin Nombre',
                body.apellido || null,
                body.cedula || '',
                body.telefono || null,
                body.email || null,
                body.asegNombre || null,
                body.asegApellido || null,
                body.asegCedula || null,
                body.asegEmail || null,
                body.tomNombre || null,
                body.tomApellido || null,
                body.tomCedula || null,
                body.tomEmail || null,
                body.tomFechaNacimiento || null,
                body.tomEstadoCivil || null,
                body.tomGenero || null,
                body.tomTelefono || null,
                body.tomEstado || null,
                body.tomMunicipio || null,
                body.tomParroquia || null,
                body.tomDireccion || null,
                body.placa || null,
                body.marca || null,
                body.modelo || null,
                body.tipoVehiculo || null,
                body.ano || null,
                body.color || null,
                body.serialCarroceria || null,
                body.serialMotor || null,
                body.uso || null,
                body.cantidadPuestos || null,
                body.capacidadCarga || null,
                body.poseeTrailer || 'No',
                body.placaExtranjera || 'No',
                body.vehicleClassId || null,
                body.planId || null,
                body.plan || null,
                body.prima || null,
                body.primaEur || null,
                body.primaUsd || null,
                body.primaBs || null
            ];
            const placeholders = fields.map(()=>'?').join(', ');
            const sql = `INSERT INTO Policy (${fields.join(', ')}) VALUES (${placeholders})`;
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Run"])(sql, values);
            // Log activity
            const actId = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Run"])(`INSERT INTO ActivityLog (id, policyId, action, description, actor, createdAt) VALUES (?, ?, ?, ?, ?, ?)`, [
                actId,
                id,
                'CREATED',
                `Solicitud creada por ${body.nombre || ''} ${body.apellido || ''} (cédula ${body.cedula || ''}) con código ${verifyCode}`,
                body.actor || 'public',
                now
            ]);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policy: {
                    id,
                    verifyCode,
                    status: 'PENDIENTE'
                }
            }, {
                status: 201
            });
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const policy = await db.policy.create({
                data: {
                    verifyCode,
                    nombre: body.nombre?.toString().trim() || 'Sin Nombre',
                    apellido: body.apellido?.toString().trim() || null,
                    cedula: body.cedula?.toString().trim() || '',
                    telefono: body.telefono || null,
                    email: body.email || null,
                    asegNombre: body.asegNombre || null,
                    asegApellido: body.asegApellido || null,
                    asegCedula: body.asegCedula || null,
                    asegEmail: body.asegEmail || null,
                    tomNombre: body.tomNombre || null,
                    tomApellido: body.tomApellido || null,
                    tomCedula: body.tomCedula || null,
                    tomEmail: body.tomEmail || null,
                    tomFechaNacimiento: body.tomFechaNacimiento || null,
                    tomEstadoCivil: body.tomEstadoCivil || null,
                    tomGenero: body.tomGenero || null,
                    tomTelefono: body.tomTelefono || null,
                    tomEstado: body.tomEstado || null,
                    tomMunicipio: body.tomMunicipio || null,
                    tomParroquia: body.tomParroquia || null,
                    tomDireccion: body.tomDireccion || null,
                    tipoVehiculo: body.tipoVehiculo || null,
                    marca: body.marca || null,
                    modelo: body.modelo || null,
                    ano: body.ano || null,
                    placa: body.placa || null,
                    color: body.color || null,
                    serialCarroceria: body.serialCarroceria || null,
                    serialMotor: body.serialMotor || null,
                    uso: body.uso || null,
                    cantidadPuestos: body.cantidadPuestos || null,
                    capacidadCarga: body.capacidadCarga || null,
                    poseeTrailer: body.poseeTrailer || 'No',
                    placaExtranjera: body.placaExtranjera || 'No',
                    vehicleClassId: body.vehicleClassId || null,
                    planId: body.planId || null,
                    plan: body.plan || null,
                    prima: body.prima || null,
                    primaEur: body.primaEur || null,
                    primaUsd: body.primaUsd || null,
                    primaBs: body.primaBs || null
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policy
            }, {
                status: 201
            });
        }
    } catch (e) {
        console.error('create policy error', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'No se pudo crear la solicitud.'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__554b369c._.js.map