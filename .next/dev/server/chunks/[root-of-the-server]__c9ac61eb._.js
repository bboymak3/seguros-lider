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
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/src/lib/storage.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
/**
 * Storage abstraction — supports both local filesystem (dev) and Cloudflare R2 (prod).
 *
 * In development (Node.js), uses the local filesystem under ./storage/seguros/.
 * In production (Cloudflare Workers), uses the R2 bucket binding `BUCKET`.
 *
 * The bucket path convention is: my-emdash-media/seguros/{verifyCode}/...
 */ const BUCKET_PREFIX = 'my-emdash-media/seguros/';
// Detect if we're running in Cloudflare Workers (has R2 binding)
function getR2Bucket() {
    // Check globalThis first (set by our patched Worker fetch handler)
    try {
        const g = globalThis;
        const bucket = g.BUCKET ?? g.__BUCKET;
        if (bucket && typeof bucket.put === 'function') {
            return bucket;
        }
    } catch  {
    /* not in Workers */ }
    // Try @opennextjs/cloudflare getRequestContext
    try {
        const { getRequestContext } = (()=>{
            const e = new Error("Cannot find module '@opennextjs/cloudflare/next'");
            e.code = 'MODULE_NOT_FOUND';
            throw e;
        })();
        const env = getRequestContext().env;
        const bucket = env.BUCKET;
        if (bucket && typeof bucket.put === 'function') {
            return bucket;
        }
    } catch  {
    /* not in Workers */ }
    return null;
}
// Local filesystem root (dev only)
const BUCKET_ROOT = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'storage', 'seguros');
function resolvePath(key) {
    let clean = key.replace(/^\/+/, '');
    if (clean.startsWith(BUCKET_PREFIX)) {
        clean = clean.slice(BUCKET_PREFIX.length);
    }
    clean = clean.split('/').filter(Boolean).join('/');
    return __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(BUCKET_ROOT, clean);
}
function toKey(localPath) {
    const rel = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].relative(BUCKET_ROOT, localPath).split(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].sep).join('/');
    return BUCKET_PREFIX + rel;
}
function stripPrefix(key) {
    return key.startsWith(BUCKET_PREFIX) ? key.slice(BUCKET_PREFIX.length) : key.replace(/^\/+/, '');
}
const storage = {
    async put (key, data, mimeType = 'application/octet-stream') {
        const cleanKey = stripPrefix(key);
        // R2 path (Cloudflare Workers)
        const bucket = getR2Bucket();
        if (bucket) {
            const buf = data instanceof ArrayBuffer ? data : new Uint8Array(data);
            await bucket.put(cleanKey, buf, {
                httpMetadata: {
                    contentType: mimeType
                }
            });
            return {
                key: BUCKET_PREFIX + cleanKey,
                size: buf.byteLength,
                mimeType
            };
        }
        // Filesystem path (local dev)
        const fullPath = resolvePath(key);
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].mkdir(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(fullPath), {
            recursive: true
        });
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(fullPath, buf);
        return {
            key: toKey(fullPath),
            size: buf.length,
            mimeType
        };
    },
    async get (key) {
        const cleanKey = stripPrefix(key);
        // R2 path
        const bucket = getR2Bucket();
        if (bucket) {
            const obj = await bucket.get(cleanKey);
            if (!obj) return null;
            const arrayBuf = await obj.arrayBuffer();
            return Buffer.from(arrayBuf);
        }
        // Filesystem path
        try {
            return await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(resolvePath(key));
        } catch  {
            return null;
        }
    },
    async delete (key) {
        const cleanKey = stripPrefix(key);
        // R2 path
        const bucket = getR2Bucket();
        if (bucket) {
            await bucket.delete(cleanKey);
            return;
        }
        // Filesystem path
        try {
            await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].unlink(resolvePath(key));
        } catch  {
        /* ignore missing */ }
    },
    getSignedUrl (key) {
        const rel = stripPrefix(key);
        return `/api/files/${rel.split('/').map(encodeURIComponent).join('/')}`;
    },
    keyFor (verifyCode, fileName, subfolder = '') {
        const base = `${BUCKET_PREFIX}${verifyCode}/`;
        const folder = subfolder ? `${subfolder}/` : '';
        return `${base}${folder}${fileName}`;
    }
};
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
/**
 * Database client — supports both local SQLite (dev) and Cloudflare D1 (prod).
 * 
 * Prisma is loaded via eval-require to prevent bundlers from including it
 * in the Cloudflare Workers bundle (which would cause fs.readdir errors).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/d1.ts [app-route] (ecmascript)");
;
let _db = null;
// Load Prisma only in local dev (not in Cloudflare D1)
if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
    try {
        // eval-require prevents the bundler from resolving @prisma/client at build time
        const req = eval('require');
        const { PrismaClient } = req('@prisma/client');
        _db = new PrismaClient({
            log: [
                'error',
                'warn'
            ]
        });
    } catch  {
    /* Prisma not available */ }
}
// In production (D1), db is a proxy that throws helpful errors
const _proxy = new Proxy({}, {
    get () {
        throw new Error('Prisma not available in production — use D1 queries');
    }
});
const db = _db || _proxy;
}),
"[project]/src/lib/activity.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACTION_LABELS",
    ()=>ACTION_LABELS,
    "logActivity",
    ()=>logActivity
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
async function logActivity(policyId, action, description, actor = 'admin', metadata) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].activityLog.create({
            data: {
                policyId,
                action,
                description,
                actor,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });
    } catch (e) {
        // never fail the parent operation because of logging
        console.error('logActivity error', e);
    }
}
const ACTION_LABELS = {
    CREATED: 'Solicitud creada',
    UPDATED: 'Datos actualizados',
    APPROVED: 'Póliza aprobada',
    REJECTED: 'Solicitud rechazada',
    DOCUMENT_UPLOADED: 'Documento adjuntado',
    DOCUMENT_DELETED: 'Documento eliminado',
    STATUS_CHANGED: 'Estado cambiado',
    PDF_GENERATED: 'Certificado PDF generado',
    ANULADA: 'Póliza anulada'
};
}),
"[project]/src/app/api/policies/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/d1.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/storage.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$activity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/activity.ts [app-route] (ecmascript)");
;
;
;
;
const dynamic = 'force-dynamic';
async function GET(_req, { params }) {
    const { id } = await params;
    try {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            const policy = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])('SELECT * FROM Policy WHERE id = ?', [
                id
            ]);
            if (!policy) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No encontrada'
                }, {
                    status: 404
                });
            }
            const documents = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])('SELECT * FROM Document WHERE policyId = ? ORDER BY createdAt ASC', [
                id
            ]);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policy: {
                    ...policy,
                    documents
                }
            });
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const policy = await db.policy.findUnique({
                where: {
                    id
                },
                include: {
                    documents: true
                }
            });
            if (!policy) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No encontrada'
                }, {
                    status: 404
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policy
            });
        }
    } catch (e) {
        console.error('get policy error', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'No se pudo cargar la póliza'
        }, {
            status: 500
        });
    }
}
async function PATCH(req, { params }) {
    const { id } = await params;
    const body = await req.json();
    const allowed = {};
    const fields = [
        'nombre',
        'apellido',
        'cedula',
        'tipoCedula',
        'fechaNacimiento',
        'nacionalidad',
        'estadoCivil',
        'sexo',
        'telefono',
        'telefonoAlt',
        'email',
        'direccion',
        'ciudad',
        'estado',
        'ocupacion',
        'tipoVehiculo',
        'marca',
        'modelo',
        'ano',
        'placa',
        'color',
        'serialCarroceria',
        'serialMotor',
        'uso',
        'capacidad',
        'clase',
        'tipo',
        'tipoCobertura',
        'compania',
        'plan',
        'prima',
        'sumaAsegurada',
        'deducible',
        'vigenciaDesde',
        'vigenciaHasta',
        'frecuenciaPago',
        'policyNumber',
        'status',
        'notes',
        'cedulaDocPath',
        'cedulaDocName',
        'cedulaDocType',
        'tituloDocPath',
        'tituloDocName',
        'tituloDocType'
    ];
    for (const f of fields){
        if (f in body) allowed[f] = body[f] === '' ? null : body[f];
    }
    try {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            const before = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])('SELECT * FROM Policy WHERE id = ?', [
                id
            ]);
            if (!before) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No encontrada'
                }, {
                    status: 404
                });
            }
            // Build UPDATE statement dynamically from allowed fields
            const setClauses = [];
            const values = [];
            for (const [k, v] of Object.entries(allowed)){
                setClauses.push(`${k} = ?`);
                values.push(v);
            }
            const now = new Date().toISOString();
            setClauses.push('updatedAt = ?');
            values.push(now);
            values.push(id);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Run"])(`UPDATE Policy SET ${setClauses.join(', ')} WHERE id = ?`, values);
            // Activity log (inline SQL — logActivity uses Prisma)
            const actId = 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            let action = 'UPDATED';
            let description = 'Datos actualizados';
            let metadata = {};
            if (allowed.status && before.status !== allowed.status) {
                action = allowed.status === 'APROBADA' ? 'APPROVED' : allowed.status === 'RECHAZADA' ? 'REJECTED' : allowed.status === 'ANULADA' ? 'ANULADA' : 'STATUS_CHANGED';
                description = `Estado cambiado de "${before.status}" a "${allowed.status}"`;
                metadata = {
                    from: before.status,
                    to: allowed.status
                };
            } else {
                const changedFields = Object.keys(allowed);
                description = `Datos actualizados${changedFields.length ? ` (${changedFields.length} campo${changedFields.length > 1 ? 's' : ''})` : ''}`;
                metadata = {
                    fields: changedFields
                };
            }
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Run"])(`INSERT INTO ActivityLog (id, policyId, action, description, actor, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                actId,
                id,
                action,
                description,
                'admin',
                JSON.stringify(metadata),
                now
            ]);
            // Fetch updated policy + documents to return
            const updated = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])('SELECT * FROM Policy WHERE id = ?', [
                id
            ]);
            const documents = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])('SELECT * FROM Document WHERE policyId = ? ORDER BY createdAt ASC', [
                id
            ]);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policy: {
                    ...updated,
                    documents
                }
            });
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const before = await db.policy.findUnique({
                where: {
                    id
                }
            });
            if (!before) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No encontrada'
                }, {
                    status: 404
                });
            }
            const updated = await db.policy.update({
                where: {
                    id
                },
                data: allowed,
                include: {
                    documents: true
                }
            });
            // detect status change vs general update
            if (allowed.status && before.status !== allowed.status) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$activity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logActivity"])(id, allowed.status === 'APROBADA' ? 'APPROVED' : allowed.status === 'RECHAZADA' ? 'REJECTED' : allowed.status === 'ANULADA' ? 'ANULADA' : 'STATUS_CHANGED', `Estado cambiado de "${before.status}" a "${allowed.status}"`, 'admin', {
                    from: before.status,
                    to: allowed.status
                });
            } else {
                const changedFields = Object.keys(allowed);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$activity$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logActivity"])(id, 'UPDATED', `Datos actualizados${changedFields.length ? ` (${changedFields.length} campo${changedFields.length > 1 ? 's' : ''})` : ''}`, 'admin', {
                    fields: changedFields
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                policy: updated
            });
        }
    } catch (e) {
        console.error('update error', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'No se pudo actualizar'
        }, {
            status: 500
        });
    }
}
async function DELETE(_req, { params }) {
    const { id } = await params;
    try {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            const policy = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])('SELECT * FROM Policy WHERE id = ?', [
                id
            ]);
            if (!policy) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No encontrada'
                }, {
                    status: 404
                });
            }
            const docs = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])('SELECT * FROM Document WHERE policyId = ?', [
                id
            ]);
            // remove stored files (best-effort — never block the DB delete on storage errors)
            for (const d of docs){
                try {
                    if (d.filePath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(d.filePath);
                } catch (e) {
                    console.error('storage delete error (doc)', e);
                }
            }
            try {
                if (policy.cedulaDocPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.cedulaDocPath);
            } catch (e) {
                console.error('storage delete error (cedula)', e);
            }
            try {
                if (policy.tituloDocPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.tituloDocPath);
            } catch (e) {
                console.error('storage delete error (titulo)', e);
            }
            try {
                if (policy.pdfPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.pdfPath);
            } catch (e) {
                console.error('storage delete error (pdf)', e);
            }
            try {
                if (policy.qrPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.qrPath);
            } catch (e) {
                console.error('storage delete error (qr)', e);
            }
            // cascade delete
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Run"])('DELETE FROM Document WHERE policyId = ?', [
                id
            ]);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Run"])('DELETE FROM ActivityLog WHERE policyId = ?', [
                id
            ]);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Run"])('DELETE FROM Policy WHERE id = ?', [
                id
            ]);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true
            });
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const policy = await db.policy.findUnique({
                where: {
                    id
                },
                include: {
                    documents: true
                }
            });
            if (!policy) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'No encontrada'
                }, {
                    status: 404
                });
            }
            // remove stored files
            for (const d of policy.documents){
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(d.filePath);
            }
            if (policy.cedulaDocPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.cedulaDocPath);
            if (policy.tituloDocPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.tituloDocPath);
            if (policy.pdfPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.pdfPath);
            if (policy.qrPath) await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].delete(policy.qrPath);
            await db.policy.delete({
                where: {
                    id
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: true
            });
        }
    } catch (e) {
        console.error('delete policy error', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'No se pudo eliminar'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c9ac61eb._.js.map