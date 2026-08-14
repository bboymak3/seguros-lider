module.exports = [
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
];

//# sourceMappingURL=src_lib_db_ts_86d9618b._.js.map