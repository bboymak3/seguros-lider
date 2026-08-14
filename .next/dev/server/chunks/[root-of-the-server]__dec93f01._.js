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
"[project]/src/app/api/stats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/d1.ts [app-route] (ecmascript)");
;
;
const dynamic = 'force-dynamic';
async function GET(_req) {
    try {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            const startOfTodayISO = startOfToday.toISOString();
            const startOfYesterdayISO = startOfYesterday.toISOString();
            const fourteenDaysAgo = new Date(now);
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
            fourteenDaysAgo.setHours(0, 0, 0, 0);
            const fourteenDaysAgoISO = fourteenDaysAgo.toISOString();
            const stats = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])(`
        SELECT
          (SELECT COUNT(*) FROM Policy) as total,
          (SELECT COUNT(*) FROM Policy WHERE status = 'PENDIENTE') as pendientes,
          (SELECT COUNT(*) FROM Policy WHERE status = 'APROBADA') as aprobadas,
          (SELECT COUNT(*) FROM Policy WHERE status = 'RECHAZADA') as rechazadas,
          (SELECT COUNT(*) FROM Policy WHERE status = 'ANULADA') as anuladas,
          (SELECT COUNT(*) FROM Policy WHERE createdAt >= ?) as hoy,
          (SELECT COUNT(*) FROM Policy WHERE createdAt >= ? AND createdAt < ?) as ayer,
          (SELECT COUNT(*) FROM Policy WHERE aprobadoAt >= ?) as aprobadasHoy,
          (SELECT COUNT(*) FROM Policy WHERE cedulaDocPath IS NOT NULL) as withDocs
      `, [
                startOfTodayISO,
                startOfYesterdayISO,
                startOfTodayISO,
                startOfTodayISO
            ]);
            const total = Number(stats?.total || 0);
            const pendientes = Number(stats?.pendientes || 0);
            const aprobadas = Number(stats?.aprobadas || 0);
            const rechazadas = Number(stats?.rechazadas || 0);
            const anuladas = Number(stats?.anuladas || 0);
            const hoy = Number(stats?.hoy || 0);
            const ayer = Number(stats?.ayer || 0);
            const aprobadasHoy = Number(stats?.aprobadasHoy || 0);
            const withDocs = Number(stats?.withDocs || 0);
            // Timeseries: last 14 days (group by date string)
            const tsRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])(`
        SELECT
          substr(createdAt, 1, 10) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'APROBADA' THEN 1 ELSE 0 END) as aprobadas,
          SUM(CASE WHEN status = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes
        FROM Policy
        WHERE createdAt >= ?
        GROUP BY substr(createdAt, 1, 10)
      `, [
                fourteenDaysAgoISO
            ]);
            const tsMap = new Map(tsRows.map((r)=>[
                    r.date,
                    r
                ]));
            const timeseries = [];
            for(let i = 13; i >= 0; i--){
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const dateKey = d.toISOString().slice(0, 10);
                const row = tsMap.get(dateKey);
                timeseries.push({
                    date: dateKey,
                    label: d.toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: '2-digit'
                    }),
                    total: Number(row?.total || 0),
                    aprobadas: Number(row?.aprobadas || 0),
                    pendientes: Number(row?.pendientes || 0)
                });
            }
            // Status distribution
            const statusDistribution = [
                {
                    name: 'Aprobadas',
                    value: aprobadas,
                    color: '#10b981'
                },
                {
                    name: 'Pendientes',
                    value: pendientes,
                    color: '#f59e0b'
                },
                {
                    name: 'Rechazadas',
                    value: rechazadas,
                    color: '#ef4444'
                },
                {
                    name: 'Anuladas',
                    value: anuladas,
                    color: '#6b7280'
                }
            ].filter((s)=>s.value > 0);
            // Top vehicle brands
            const brandRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])(`
        SELECT trim(marca) as name, COUNT(*) as value
        FROM Policy
        WHERE marca IS NOT NULL AND trim(marca) != ''
        GROUP BY trim(marca)
        ORDER BY value DESC
        LIMIT 6
      `);
            const topBrands = brandRows.map((r)=>({
                    name: r.name,
                    value: Number(r.value)
                }));
            // Top estados (geographic)
            const estadoRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])(`
        SELECT trim(estado) as name, COUNT(*) as value
        FROM Policy
        WHERE estado IS NOT NULL AND trim(estado) != ''
        GROUP BY trim(estado)
        ORDER BY value DESC
        LIMIT 6
      `);
            const topEstados = estadoRows.map((r)=>({
                    name: r.name,
                    value: Number(r.value)
                }));
            // Vehicle type distribution
            const tipoRows = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1Query"])(`
        SELECT trim(tipoVehiculo) as name, COUNT(*) as value
        FROM Policy
        WHERE tipoVehiculo IS NOT NULL AND trim(tipoVehiculo) != ''
        GROUP BY trim(tipoVehiculo)
        ORDER BY value DESC
      `);
            const tipoDistribution = tipoRows.map((r)=>({
                    name: r.name,
                    value: Number(r.value)
                }));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                total,
                pendientes,
                aprobadas,
                rechazadas,
                anuladas,
                hoy,
                ayer,
                aprobadasHoy,
                withDocs,
                deltaHoy: hoy - ayer,
                deltaPercent: ayer > 0 ? Math.round((hoy - ayer) / ayer * 100) : hoy > 0 ? 100 : 0,
                timeseries,
                statusDistribution,
                topBrands,
                topEstados,
                tipoDistribution
            });
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const [total, pendientes, aprobadas, rechazadas, anuladas, hoy, ayer, aprobadasHoy, withDocs] = await Promise.all([
                db.policy.count(),
                db.policy.count({
                    where: {
                        status: 'PENDIENTE'
                    }
                }),
                db.policy.count({
                    where: {
                        status: 'APROBADA'
                    }
                }),
                db.policy.count({
                    where: {
                        status: 'RECHAZADA'
                    }
                }),
                db.policy.count({
                    where: {
                        status: 'ANULADA'
                    }
                }),
                db.policy.count({
                    where: {
                        createdAt: {
                            gte: startOfToday
                        }
                    }
                }),
                db.policy.count({
                    where: {
                        createdAt: {
                            gte: startOfYesterday,
                            lt: startOfToday
                        }
                    }
                }),
                db.policy.count({
                    where: {
                        aprobadoAt: {
                            gte: startOfToday
                        }
                    }
                }),
                db.policy.count({
                    where: {
                        NOT: {
                            cedulaDocPath: null
                        }
                    }
                })
            ]);
            // Timeseries: last 14 days
            const fourteenDaysAgo = new Date(now);
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
            fourteenDaysAgo.setHours(0, 0, 0, 0);
            const recentPolicies = await db.policy.findMany({
                where: {
                    createdAt: {
                        gte: fourteenDaysAgo
                    }
                },
                select: {
                    createdAt: true,
                    status: true,
                    marca: true,
                    estado: true,
                    tipoVehiculo: true
                }
            });
            const timeseries = [];
            for(let i = 13; i >= 0; i--){
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const next = new Date(d);
                next.setDate(next.getDate() + 1);
                const dayPolicies = recentPolicies.filter((p)=>p.createdAt >= d && p.createdAt < next);
                timeseries.push({
                    date: d.toISOString().slice(0, 10),
                    label: d.toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: '2-digit'
                    }),
                    total: dayPolicies.length,
                    aprobadas: dayPolicies.filter((p)=>p.status === 'APROBADA').length,
                    pendientes: dayPolicies.filter((p)=>p.status === 'PENDIENTE').length
                });
            }
            // Status distribution
            const statusDistribution = [
                {
                    name: 'Aprobadas',
                    value: aprobadas,
                    color: '#10b981'
                },
                {
                    name: 'Pendientes',
                    value: pendientes,
                    color: '#f59e0b'
                },
                {
                    name: 'Rechazadas',
                    value: rechazadas,
                    color: '#ef4444'
                },
                {
                    name: 'Anuladas',
                    value: anuladas,
                    color: '#6b7280'
                }
            ].filter((s)=>s.value > 0);
            // Top vehicle brands
            const allBrands = await db.policy.findMany({
                where: {
                    marca: {
                        not: null
                    }
                },
                select: {
                    marca: true
                }
            });
            const brandCountsAll = new Map();
            for (const p of allBrands){
                if (p.marca) {
                    const b = p.marca.trim();
                    brandCountsAll.set(b, (brandCountsAll.get(b) || 0) + 1);
                }
            }
            const topBrands = Array.from(brandCountsAll.entries()).map(([name, value])=>({
                    name,
                    value
                })).sort((a, b)=>b.value - a.value).slice(0, 6);
            // Top estados (geographic)
            const allEstados = await db.policy.findMany({
                where: {
                    estado: {
                        not: null
                    }
                },
                select: {
                    estado: true
                }
            });
            const estadoCounts = new Map();
            for (const p of allEstados){
                if (p.estado) {
                    const e = p.estado.trim();
                    estadoCounts.set(e, (estadoCounts.get(e) || 0) + 1);
                }
            }
            const topEstados = Array.from(estadoCounts.entries()).map(([name, value])=>({
                    name,
                    value
                })).sort((a, b)=>b.value - a.value).slice(0, 6);
            // Vehicle type distribution
            const allTipos = await db.policy.findMany({
                where: {
                    tipoVehiculo: {
                        not: null
                    }
                },
                select: {
                    tipoVehiculo: true
                }
            });
            const tipoCounts = new Map();
            for (const p of allTipos){
                if (p.tipoVehiculo) {
                    const t = p.tipoVehiculo.trim();
                    tipoCounts.set(t, (tipoCounts.get(t) || 0) + 1);
                }
            }
            const tipoDistribution = Array.from(tipoCounts.entries()).map(([name, value])=>({
                    name,
                    value
                })).sort((a, b)=>b.value - a.value);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                total,
                pendientes,
                aprobadas,
                rechazadas,
                anuladas,
                hoy,
                ayer,
                aprobadasHoy,
                withDocs,
                // delta = today - yesterday (for trend arrows)
                deltaHoy: hoy - ayer,
                deltaPercent: ayer > 0 ? Math.round((hoy - ayer) / ayer * 100) : hoy > 0 ? 100 : 0,
                timeseries,
                statusDistribution,
                topBrands,
                topEstados,
                tipoDistribution
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
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__dec93f01._.js.map