# Seguros Líder — Worklog

## Project Status: ✅ Core MVP Complete & Browser-Verified

A full insurance policy management platform (solicitud → admin approval → QR-verified certificate) built on Next.js 16 + Prisma/SQLite. All golden-path flows verified end-to-end with agent-browser.

### Architecture Note (deployment)
The user requested Astro + Cloudflare D1 + R2. This sandbox is locked to Next.js 16 + Prisma/SQLite, so the app was built with a **storage abstraction layer** (`src/lib/storage.ts`) that emulates the R2 bucket `my-emdash-media/seguros/` on the local filesystem. To deploy to Cloudflare, swap the 4 methods in `storage.ts` (`put/get/delete/getSignedUrl`) for the R2 S3-compatible API — no call-site changes needed. D1 migration is similarly isolated to `prisma/schema.prisma` + `src/lib/db.ts`.

---

## Task ID: 1 (initial build)
Agent: main (Z.ai Code)
Task: Build the complete seguros platform from scratch.

### Work Log
- Installed `qrcode`, `pdf-lib`, `@pdf-lib/fontkit`, `@types/qrcode`.
- Designed Prisma schema: `Policy` (40+ fields: cliente, vehículo, cobertura, documentos, status) + `Document` model. Pushed to SQLite.
- Built storage abstraction (`src/lib/storage.ts`) emulating R2 bucket `my-emdash-media/seguros/`.
- Built QR generator (`src/lib/qr.ts`) — encodes `/?v=<code>`, stores PNG in bucket.
- Built PDF generator (`src/lib/pdf.ts`) — A4 certificate with header band, cliente/vehículo/cobertura sections, green QR box (bottom-right), watermark, footer. Embeds generated QR.
- Built API routes:
  - `POST/GET /api/policies` — create + list (with status/q filters)
  - `GET/PATCH/DELETE /api/policies/[id]` — full edit + cascade delete
  - `POST /api/policies/[id]/approve` — approve + assign policy number + regenerate PDF
  - `POST /api/policies/[id]/documents` — multipart upload (CEDULA/TITULO/OTRO), validates JPG/PNG/WEBP/PDF ≤10MB
  - `DELETE /api/policies/[id]/documents/[docId]` — remove + clear mirror fields
  - `GET /api/policies/[id]/pdf` — generate & stream PDF
  - `GET /api/policies/[id]/qr` — QR PNG
  - `GET /api/policies/verify?code=` — public lookup
  - `GET /api/files/[...path]` — serve stored objects
  - `GET /api/stats` — dashboard counts
- Built frontend (single `/` route, view-switching via query params):
  - `landing-page.tsx` — dark navy/emerald hero, services grid, how-it-works, testimonials, contact, sticky footer
  - `solicitud-form.tsx` — 3-section form (cliente/vehículo/cobertura) + optional doc uploads, success screen with verify code
  - `verify-page.tsx` — public certificate view (mirrors liderdeseguros.com/v/576501), status banner, QR, cliente/vehículo/cobertura sections, PDF download
  - `admin-dashboard.tsx` — password gate (`admin123`), sidebar nav, 6 stat cards, pendientes/todas list views with search, recent list
  - `admin-policy-detail.tsx` — 3 tabs (Datos edit all fields / Documentos manage uploads / Certificado QR+PDF), approve/reject, copy verify URL
- Fixed lint errors (SelectValue naming collision, setState-in-effect, unused eslint directives).

### Stage Summary / Verification (agent-browser)
- ✅ Landing page renders (HTTP 200), VLM confirms professional design, no layout issues.
- ✅ Solicitud form → submit → success screen with verify code (e.g. `321686`).
- ✅ Admin login (`admin123`) → dashboard with stats + recent list.
- ✅ Policy detail → edit → approve → "Póliza aprobada y certificado generado".
- ✅ PDF endpoint returns 17KB application/pdf; QR endpoint returns 4KB image/png.
- ✅ Verification page (`?v=321686`) shows APROBADA, "Póliza N° 000001", "Póliza válida y vigente", QR image, PDF download.
- ✅ Document upload stores at `my-emdash-media/seguros/321686/cedula/test-cedula.png`, served back via `/api/files/...`.
- ✅ Admin Documents tab shows uploaded cédula with delete button + upload slots for both doc types.
- ✅ `bun run lint` passes clean (0 errors).

### Unresolved / Next-phase recommendations
1. **Auth**: Replace demo password gate (`admin123`) with NextAuth.js v4 (already in deps).
2. **Cloudflare deployment**: Swap `storage.ts` → R2 binding; migrate Prisma SQLite → D1; deploy via `wrangler`. (User has D1 `seguros_db` ID `5f2737c7-...` and R2 path `my-emdash-media/seguros/`.)
3. **PDF template**: Currently generated from scratch with pdf-lib. To use the user's `pdfclean` template from `github.com/bboymak3/pdf-seguros`, load it via `PDFDocument.load()` + `copyPages` and overlay fields.
4. **Edit document flow**: Currently supports upload + delete; could add "replace" (delete+upload in one action) and inline image preview/lightbox.
5. **Search/Filter**: Add date-range and status-multi-select filters to admin list views.
6. **Notifications**: Email/SMS on approval (resend/twilio).
