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
"[project]/src/app/api/policies/expiring/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10)));
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + days);
    const policies = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].policy.findMany({
        where: {
            status: 'APROBADA',
            vigenciaHasta: {
                not: null,
                gte: now.toISOString().slice(0, 10),
                lte: limit.toISOString().slice(0, 10)
            }
        },
        orderBy: {
            vigenciaHasta: 'asc'
        },
        take: 20,
        select: {
            id: true,
            verifyCode: true,
            policyNumber: true,
            nombre: true,
            apellido: true,
            marca: true,
            modelo: true,
            placa: true,
            vigenciaHasta: true,
            compania: true
        }
    });
    // Also get already-expired policies (vigenciaHasta < today)
    const expired = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].policy.findMany({
        where: {
            status: 'APROBADA',
            vigenciaHasta: {
                not: null,
                lt: now.toISOString().slice(0, 10)
            }
        },
        orderBy: {
            vigenciaHasta: 'desc'
        },
        take: 20,
        select: {
            id: true,
            verifyCode: true,
            policyNumber: true,
            nombre: true,
            apellido: true,
            marca: true,
            modelo: true,
            placa: true,
            vigenciaHasta: true,
            compania: true
        }
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        expiring: policies,
        expired,
        days
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__98786302._.js.map