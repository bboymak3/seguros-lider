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
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

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
"[project]/src/lib/qr.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generatePolicyQr",
    ()=>generatePolicyQr
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/qrcode/lib/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/storage.ts [app-route] (ecmascript)");
;
;
async function generatePolicyQr(verifyCode, publicBaseUrl) {
    const base = publicBaseUrl || 'https://app-seguro-activo.pages.dev';
    const targetUrl = `${base.replace(/\/$/, '')}/?v=${verifyCode}`;
    const buffer = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].toBuffer(targetUrl, {
        type: 'png',
        margin: 2,
        width: 600,
        errorCorrectionLevel: 'H',
        color: {
            dark: '#0b1f3a',
            light: '#ffffff'
        }
    });
    // Try to store in R2, but don't fail if storage is unavailable
    let storageKey = '';
    try {
        storageKey = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].keyFor(verifyCode, 'qr.png', 'assets');
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["storage"].put(storageKey, buffer, 'image/png');
    } catch  {
    /* storage might not be available in Workers — QR still works in memory */ }
    return {
        buffer,
        url: targetUrl,
        storageKey
    };
}
}),
"[project]/src/app/api/policies/[id]/qr/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/d1.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qr$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/qr.ts [app-route] (ecmascript)");
;
;
;
const dynamic = 'force-dynamic';
async function GET(_req, { params }) {
    const { id } = await params;
    try {
        let verifyCode = '';
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isD1"])()) {
            const row = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$d1$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["d1First"])('SELECT verifyCode FROM Policy WHERE id = ?', [
                id
            ]);
            if (!row) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No encontrada'
            }, {
                status: 404
            });
            verifyCode = row.verifyCode;
        } else {
            const { db } = await __turbopack_context__.A("[project]/src/lib/db.ts [app-route] (ecmascript, async loader)");
            const policy = await db.policy.findUnique({
                where: {
                    id
                },
                select: {
                    verifyCode: true
                }
            });
            if (!policy) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No encontrada'
            }, {
                status: 404
            });
            verifyCode = policy.verifyCode;
        }
        const { buffer } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$qr$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["generatePolicyQr"])(verifyCode);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-store'
            }
        });
    } catch (e) {
        console.error('QR error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error generando QR: ' + e.message
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__70b7f11a._.js.map