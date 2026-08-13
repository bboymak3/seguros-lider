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
5. **Notifications**: Email/SMS on approval (resend/twilio).

---

## Task ID: 2 (cron review — enhancements)
Agent: main (Z.ai Code) — webDevReview cron round 1
Task: QA assessment + bug fixes + new features + styling improvements.

### Work Log
**QA Assessment (agent-browser)**
- Verified landing page (HTTP 200, no console errors), solicitud form submission (success), admin login + dashboard, policy detail, verification page. All golden paths intact.
- VLM analysis of dashboard identified gaps: missing charts, no CSV export, no bulk actions, KPI contrast issues, truncated names, duplicate icons.

**Bug Fixes / Styling**
- Fixed KPI number contrast (now `text-white text-3xl font-bold`).
- Fixed name truncation in list rows (full name shown, initials badge with gradient).
- Fixed duplicate icons (Tasa Aprobación now uses `Percent` icon).
- Added ring accents + hover scale on stat cards.
- Added skeleton loaders for list rows + recent list.
- Added empty states with icons for all list views.
- Added pending-count badge in sidebar nav item.
- Added mini stats panel in sidebar (aprobadas hoy, con docs, total).
- Added bulk-action sticky bar with approve/reject/anular/delete.

**New Database Model**
- Added `ActivityLog` model (id, policyId, action, description, actor, metadata JSON, createdAt).
- Created `src/lib/activity.ts` helper with `logActivity()` + `ACTION_LABELS`.
- Wired activity logging into: POST /policies (CREATED), PATCH /policies/[id] (UPDATED/STATUS_CHANGED/APPROVED/REJECTED/ANULADA), POST /approve (APPROVED+PDF_GENERATED), POST /documents (DOCUMENT_UPLOADED), DELETE /documents/[docId] (DOCUMENT_DELETED).

**New API Endpoints**
- Enhanced `GET /api/stats` — now returns: counts, today/yesterday deltas, aprobadasHoy, withDocs, 14-day timeseries, statusDistribution (pie), topBrands (bar), topEstados (bar), tipoDistribution.
- `GET /api/policies/export` — CSV export with BOM (UTF-8 for Excel), 30 columns, supports status/q filters.
- `GET /api/policies/lookup?q=` — public lookup by cédula/placa/policyNumber/verifyCode, returns minimal info (10 results max).
- `POST /api/policies/bulk` — bulk approve/reject/anular/delete with sequential policy-number assignment + per-policy activity logging.
- `GET /api/policies/[id]/activities` — audit trail (last 100 events).

**New Frontend Components**
- `src/components/seguros/dashboard-charts.tsx` — recharts visualizations:
  - Area chart: 14-day timeseries (total/aprobadas/pendientes with gradient fills)
  - Pie chart: status distribution (donut with legend)
  - Horizontal bar: top vehicle brands
  - Horizontal bar: top geographic estados
  - Skeleton + empty states for all charts
- `src/components/seguros/public-lookup.tsx` — public search widget (cedula/placa/code) with result cards linking to verification page.

**Enhanced Existing Components**
- `admin-dashboard.tsx` — full rewrite:
  - 6 KPI cards with trend deltas (↑/↓ vs ayer), ring accents, hover scale
  - Dashboard charts section (4 charts)
  - Bulk selection: per-row checkboxes + "Seleccionar todo" + sticky bulk-action bar
  - CSV export button in header
  - Status filter dropdown on "Todas las Pólizas"
  - Skeleton loaders + empty states
- `admin-policy-detail.tsx` — added 4th tab "Historial":
  - ActivityTimeline component with vertical timeline UI
  - Color-coded action icons (emerald=approved, red=rejected, sky=created, violet=doc uploaded, amber=doc deleted)
  - Connector lines between events
- `landing-page.tsx` — added public lookup section between hero and stats strip.

### Stage Summary / Verification (agent-browser)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Dashboard renders 4 charts (area/pie/2 bars) + 6 KPI cards with trend deltas.
- ✅ CSV export returns `text/csv; charset=utf-8` with BOM, 30 columns.
- ✅ Bulk approve: tested via API → 1 policy approved, activities logged (APPROVED + PDF_GENERATED).
- ✅ Public lookup: searched "98765432" → found Maria's policy → clicked → navigated to verification page showing APROBADA + N° 000002.
- ✅ Activity timeline: shows "Póliza aprobada masivamente con N° 000002" + "Certificado PDF generado (aprobación masiva)".
- ✅ Status filter dropdown + "Seleccionar todo" + bulk-action bar all present.
- ✅ Sidebar shows pending badge (count) + mini stats panel.
- ✅ `bun run lint` passes clean (0 errors).

### Files Added/Modified
- Added: `src/lib/activity.ts`, `src/components/seguros/dashboard-charts.tsx`, `src/components/seguros/public-lookup.tsx`
- Added API: `src/app/api/policies/export/route.ts`, `src/app/api/policies/lookup/route.ts`, `src/app/api/policies/bulk/route.ts`, `src/app/api/policies/[id]/activities/route.ts`
- Modified: `prisma/schema.prisma` (ActivityLog model), `src/app/api/stats/route.ts` (charts data), `src/app/api/policies/route.ts`, `src/app/api/policies/[id]/route.ts`, `src/app/api/policies/[id]/approve/route.ts`, `src/app/api/policies/[id]/documents/route.ts`, `src/app/api/policies/[id]/documents/[docId]/route.ts` (activity logging)
- Modified: `src/components/seguros/admin-dashboard.tsx` (full rewrite), `src/components/seguros/admin-policy-detail.tsx` (historial tab), `src/components/seguros/landing-page.tsx` (public lookup section)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Date-range filter**: Add date picker to list views for historical analysis.
5. **Notifications**: Email/SMS on approval.
6. **Dashboard drill-down**: Click a chart segment to filter the list.
7. **Pagination**: For lists exceeding 100 items.
8. **Document replace**: One-click replace (delete+upload) in admin.


---

## Task ID: 3 (cron review — wizard form + pagination + filters)
Agent: main (Z.ai Code) — webDevReview cron round 2
Task: QA assessment + multi-step wizard form + pagination + date filters + print styles.

### Work Log
**QA Assessment (agent-browser + VLM)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- VLM analysis of dashboard: professional design confirmed; identified needs for pagination, date filters, wizard form, print support.
- VLM analysis of form: long-form fatigue identified → recommended wizard/stepper approach.

**Major Feature: Multi-step Wizard Form (solicitud-form.tsx full rewrite)**
- Converted single-page long form into 4-step wizard: Cliente → Vehículo → Cobertura → Documentos.
- Visual stepper with icons (User/Car/ShieldCheck/IdCard), done/current/inactive states, connector lines with animated progress fill.
- Progress bar (gradient emerald→teal) + "Paso X de 4" heading + percentage indicator.
- Per-step validation: required fields validated before advancing (trigger from react-hook-form).
- Auto-save draft to sessionStorage (debounced 800ms) with "Guardar" button + "Borrador recuperado" toast on reload.
- Draft cleared on successful submission.
- Siguiente/Anterior navigation with smooth scroll-to-top.
- Summary confirmation card on final step before submit.
- Improved success screen with ring accent on check icon.

**Major Feature: Pagination (API + UI)**
- Enhanced `GET /api/policies` to support `page` + `pageSize` params (default 20, max 100).
- Returns `{ policies, pagination: { page, pageSize, total, totalPages, hasNext, hasPrev } }`.
- Admin list views now paginate at 10 per page.
- Pagination footer with: "Página X de Y (Z total)", prev/next chevrons, numbered page buttons (smart window of 5).
- Active page highlighted in emerald.

**Major Feature: Date-range Filter (API + UI)**
- Enhanced `GET /api/policies` to support `from` + `to` date params (ISO date strings).
- Admin list views show a date-range filter row: two date inputs (Desde/Hasta) + "Filtrar" + "Limpiar" buttons.
- Total result count displayed inline.
- Filter persists across page navigation.

**Feature: Print-friendly Verification Page**
- Added `@media print` styles to globals.css (white bg, black text, hide `.no-print` elements).
- Added "Imprimir" button to verify-page (calls `window.print()`).
- Header, footer, and action buttons marked `.no-print` so they don't appear in printed output.
- Certificate data sections use `.print-break-inside-avoid` for clean page breaks.

**Styling Improvements**
- Custom scrollbar styles (`.scrollbar-thin`) for dark theme.
- Wizard stepper with ring-4 accent on current step.
- Gradient progress bar (emerald→teal).
- Pagination buttons with hover states.
- Date filter row in a bordered container with labeled inputs.

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Wizard form: Step 1 (Cliente) → fill required → "Siguiente" → Step 2 (Vehículo) with "Anterior" button. Stepper shows progress.
- ✅ VLM confirms wizard stepper is clear and professional.
- ✅ VLM confirms dashboard KPIs + charts render well.
- ✅ Pagination API: `?page=1&pageSize=5` returns correct `{ policies, pagination }` shape.
- ✅ Date filter UI present (Desde/Hasta inputs + Filtrar button).
- ✅ Status filter dropdown present (Todos los estados / Pendientes / Aprobadas / etc).
- ✅ CSV export button present in header.
- ✅ Print button on verification page.
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200 (stats, policies, export, lookup).

### Files Modified
- `src/components/seguros/solicitud-form.tsx` — full rewrite as 4-step wizard
- `src/app/api/policies/route.ts` — added pagination + date-range filter
- `src/components/seguros/admin-dashboard.tsx` — added pagination UI, date filter UI, new state (pagination, page, dateFrom, dateTo), goToPage/applyDateFilter/clearDateFilter functions
- `src/components/seguros/verify-page.tsx` — added Print button + no-print classes
- `src/app/globals.css` — print styles + custom scrollbar

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Dashboard drill-down**: Click a chart segment to filter the list.
5. **Document preview lightbox**: Click to enlarge images in admin.
6. **Notifications**: Email/SMS on approval.
7. **Contrast improvements**: Some secondary text (dates, sub-labels) could be brighter for accessibility.
8. **Form autosave indicator**: Show "Guardado hace Xs" toast.

---

## Task ID: 4 (cron review — drill-down + lightbox + summary card + contrast)
Agent: main (Z.ai Code) — webDevReview cron round 3
Task: QA assessment + dashboard drill-down + document lightbox + summary card + contrast improvements.

### Work Log
**QA Assessment (agent-browser)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- VLM analysis of dashboard confirmed professional design; identified remaining next-phase items.

**Major Feature: Dashboard Drill-down (click chart to filter list)**
- Updated `dashboard-charts.tsx` to accept `onDrillDown?: (type, value) => void` callback.
- Pie chart (status distribution): clicking a slice maps "Aprobadas"→APROBADA etc. and triggers drill-down.
- Bar chart (top brands): clicking a bar triggers `onDrillDown('brand', name)`.
- Bar chart (top estados): clicking a bar triggers `onDrillDown('estado', name)`.
- All clickable charts show "Clic para filtrar" hint + cursor-pointer + hover opacity.
- Admin dashboard wires `onDrillDown` to: set status filter or search query → switch to "Todas las Pólizas" view → reload policies → show toast "Filtrando por...".

**Major Feature: Document Preview Lightbox (admin-policy-detail.tsx)**
- Rewrote `DocCard` component with 3 action buttons: Vista previa (Eye), Abrir en pestaña (ExternalLink), Eliminar (Trash2).
- Clicking the document thumbnail or "Vista previa" opens a full-screen Lightbox modal.
- New `Lightbox` component:
  - Full-screen overlay with backdrop blur, click-outside-to-close.
  - Header with filename + "Abrir" link + "Cerrar" button (with Esc hint).
  - Body: image (object-contain, max 75vh) or PDF (iframe, 75vh).
  - Esc key closes, body scroll locked while open.
- Hover effect on thumbnail (scale-105).

**Feature: Policy Summary Card (admin-policy-detail.tsx)**
- Added summary card between action bar and tabs.
- Status-colored top accent bar (emerald/red/slate/amber based on status).
- 8-field grid (4 cols on lg): Tomador, Cédula, Vehículo, Placa, Cobertura, Vigencia, Creada, Aprobada.
- Each field has an icon badge (emerald bg) + label + value.
- New `SummaryItem` helper component.

**Accessibility: Contrast Improvements**
- KPI card sub-text: `text-slate-500` → `text-slate-400` (brighter, better WCAG ratio).
- Date filter labels (Desde/Hasta): `text-slate-500` → `text-slate-400`.
- All `text-[10px] uppercase tracking-wider` labels: `text-slate-500` → `text-slate-400`.

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Summary card renders with 8 fields (Tomador, Cédula, Vehículo, Placa, Cobertura, Vigencia, Creada, Aprobada).
- ✅ VLM confirms summary card is "bien estructurada" with "jerarquía visual efectiva".
- ✅ Document lightbox: "Vista previa" button present → click opens modal with image + filename header + Abrir/Cerrar buttons.
- ✅ Dashboard drill-down: clicked pie sector → navigated to "Todas las Pólizas" with status filter set to "Aprobadas" + toast "Filtrando por estado: APROBADA".
- ✅ "Clic para filtrar" hints visible on all 3 clickable charts.
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200.

### Files Modified
- `src/components/seguros/dashboard-charts.tsx` — added `onDrillDown` prop + click handlers on Pie/Bar/Bar
- `src/components/seguros/admin-dashboard.tsx` — wired `onDrillDown` in DashboardView, contrast improvements (slate-500→slate-400)
- `src/components/seguros/admin-policy-detail.tsx` — new Lightbox + SummaryItem components, rewrote DocCard, added summary card, new icon imports (Eye, X, Calendar, Phone, Mail, Hash, Clock)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Notifications**: Email/SMS on approval.
5. **Keyboard shortcuts**: Add "/" to focus search, "g d" to go to dashboard, etc.
6. **Document replace**: One-click replace (delete+upload) in admin.
7. **Policy expiry alerts**: Highlight policies nearing vigencia end.
8. **Admin settings page**: Configure aseguradoras, coverage types, etc.

---

## Task ID: 5 (cron review — settings page + expiry alerts + notifications + shortcuts)
Agent: main (Z.ai Code) — webDevReview cron round 4
Task: QA assessment + admin settings page + expiry alerts + notifications bell + keyboard shortcuts.

### Work Log
**QA Assessment (agent-browser)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- Confirmed previous round's features (drill-down, lightbox, summary card) all working.

**New Database Model: Setting**
- Added `Setting` model (id, key @unique, value JSON string, updatedAt).
- Created `src/lib/settings.ts` with `getSetting`, `setSetting`, `getAllSettings` helpers.
- Defaults seeded: 8 aseguradoras, 4 coverage types, 6 vehicle types, 4 plan types.

**New API Endpoints**
- `GET /api/settings` — returns all configurable lists (ASEGURADORAS, COVERAGE_TYPES, VEHICLE_TYPES, PLAN_TYPES).
- `PUT /api/settings` — update one or more lists (upserts to DB).
- `GET /api/policies/expiring?days=30` — returns approved policies expiring within N days + already-expired policies.
- `GET /api/notifications?limit=10` — returns recent global activity (across all policies) with policy info joined.

**Major Feature: Admin Settings Page (admin-settings.tsx)**
- New `AdminSettings` component rendered when view === 'settings'.
- 4 config cards in 2x2 grid: Aseguradoras, Tipos de Cobertura, Tipos de Vehículo, Planes.
- Each card shows: icon badge, label, description, count badge, existing items as removable chips, add-new input + "+" button.
- Enter key adds item; chip trash button removes item.
- Save button (header + footer bar) persists all changes via PUT /api/settings.
- "Restablecer" button reloads from server.
- Green confirmation bar at bottom explaining scope.
- Added "Configuración" nav item with Settings icon.

**Major Feature: Expiry Alerts Widget (expiry-alerts.tsx)**
- New `ExpiryAlerts` component on the dashboard (between charts and recent list).
- Two tabs: "Por vencer" (next 30 days) and "Vencidas" (already expired).
- Each policy row: icon badge (amber/red by urgency), name, policy number, vehicle info, expiry date, days-remaining badge.
- Color coding: red for expired or ≤7 days, amber for 8-30 days.
- Click navigates to admin view.
- Auto-hides if no expiring/expired policies.
- Uses scrollbar-thin for the scrollable list.

**Major Feature: Notifications Bell (notifications-bell.tsx)**
- New `NotificationsBell` component in admin header (next to CSV export button).
- Bell icon with unread count badge (red, top-right).
- Click opens dropdown panel (80-96 width) with recent 15 activities.
- Each notification: action-specific icon (color-coded), description, policy name + number, time-ago.
- Auto-polls every 30 seconds for new notifications.
- Click-outside-to-close, unread count resets on open.
- Icons mapped per action: CREATED (sky), APPROVED (emerald), REJECTED (red), DOCUMENT_UPLOADED (violet), etc.

**Feature: Keyboard Shortcuts**
- "/" — focuses the search input (when not already typing).
- "g d" — go to Dashboard.
- "g p" — go to Pendientes.
- "g t" — go to Todas.
- "g s" — go to Configuración.
- "g n" — go to Nueva Solicitud.
- Shortcuts disabled when typing in inputs/textareas.
- "Atajos de teclado" hint panel added to sidebar with kbd-styled keys.

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Settings page: renders 4 config cards (Aseguradoras 8, Cobertura 4, Vehículos 6, Planes 4).
- ✅ VLM confirms settings page is "Excelente estructura" with "jerarquía visual clara".
- ✅ Notifications bell: click opens panel showing "Póliza aprobada masivamente con N° 000002" + other recent activities.
- ✅ Keyboard shortcut "/": pressed → focused the search input (verified activeElement).
- ✅ "Atajos de teclado" hint panel visible in sidebar.
- ✅ "Configuración" nav item present and clickable.
- ✅ ExpiryAlerts widget on dashboard (auto-hides when no expiring policies, which is the case with current test data).
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200 (stats, policies, export, lookup, settings, expiring, notifications).

### Files Added/Modified
- Added: `src/lib/settings.ts`, `src/components/seguros/admin-settings.tsx`, `src/components/seguros/expiry-alerts.tsx`, `src/components/seguros/notifications-bell.tsx`
- Added API: `src/app/api/settings/route.ts`, `src/app/api/policies/expiring/route.ts`, `src/app/api/notifications/route.ts`
- Modified: `prisma/schema.prisma` (Setting model), `src/components/seguros/admin-dashboard.tsx` (settings view, notifications bell, expiry alerts, keyboard shortcuts, shortcuts hint panel, new icon imports)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Notifications (email/SMS)**: External notification delivery on approval.
5. **Landing page FAQ**: Add FAQ section + animated stat counters.
6. **Policy expiry email**: Send reminder emails before vigencia ends.
7. **Settings → form integration**: Make solicitud-form load options dynamically from /api/settings instead of hardcoded arrays.
8. **Audit log export**: Export activity log as CSV/JSON.

---

## Task ID: 6 (cron review — form settings integration + FAQ + audit export)
Agent: main (Z.ai Code) — webDevReview cron round 5
Task: QA assessment + dynamic form options + landing FAQ/animated stats + audit log export.

### Work Log
**QA Assessment (agent-browser)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- Confirmed previous round's features (settings page, notifications bell, expiry alerts, keyboard shortcuts) all working.

**Major Feature: Settings → Form Integration (solicitud-form.tsx)**
- Added `options` state + useEffect to fetch configurable lists from `/api/settings` on mount.
- Replaced hardcoded vehicle types array with `options?.VEHICLE_TYPES || []`.
- Replaced hardcoded coverage types array with `options?.COVERAGE_TYPES || []`.
- Converted Aseguradora field from plain text Input to SelectField with `options.ASEGURADORAS` (falls back to text Input if no settings loaded).
- Converted Plan field from plain text Input to SelectField with `options.PLAN_TYPES` (same fallback).
- Non-configurable options (tipoCedula, nacionalidad, estadoCivil, sexo, uso, frecuenciaPago) remain hardcoded as they're fixed enumerations.

**Major Feature: Landing Page FAQ + Animated Stats**
- New `src/components/seguros/use-count-up.ts` — `useCountUp` hook (ease-out cubic animation) + `useInView` hook (IntersectionObserver).
- New `src/components/seguros/faq-section.tsx` with two exports:
  - `AnimatedStats` — 4 stat cards with count-up animation triggered on scroll into view (15.000+, 99%, <24h, 7/24).
  - `FaqSection` — 6-question accordion with smooth expand/collapse (grid-rows transition), email CTA card.
- Updated `landing-page.tsx`: replaced old hardcoded stats strip with `<AnimatedStats />`, added `<FaqSection />` between testimonials and contact sections.

**Major Feature: Audit Log Export (API + UI)**
- New `GET /api/policies/[id]/activities/export?format=csv|json` endpoint:
  - CSV: BOM + headers (Fecha, Acción, Descripción, Actor, Metadata), proper escaping.
  - JSON: structured response with policy info + activities array + export timestamp.
  - Both return as downloadable file attachment.
- Updated `admin-policy-detail.tsx` ActivityTimeline component:
  - Added CSV and JSON export download buttons in the Historial tab header.
  - Buttons only appear when `activities.length > 0`.
  - Each button is an `<a download>` link with icon (Download/FileJson) + label.
  - Added `FileJson` icon import.

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Solicitud form: vehicle types dropdown loads options from /api/settings (verified "Automóvil", "Moto", "Camión" appearing).
- ✅ Aseguradora + Plan fields now use SelectField with loaded options (fallback to text input if no settings).
- ✅ Animated stats: 4 counters visible on landing page (Pólizas emitidas, Tasa de aprobación, Tiempo de respuesta, Verificación QR).
- ✅ FAQ section: "Preguntas frecuentes" heading + 6 question accordions visible; clicking expands answer with smooth animation.
- ✅ FAQ email CTA card present ("¿Tienes otra pregunta?").
- ✅ Audit log export: CSV and JSON download links present in Historial tab (when activities exist).
- ✅ CSV export content verified: correct headers + 2 activity rows with proper data.
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200.

### Files Added/Modified
- Added: `src/components/seguros/use-count-up.ts`, `src/components/seguros/faq-section.tsx`, `src/app/api/policies/[id]/activities/export/route.ts`
- Modified: `src/components/seguros/solicitud-form.tsx` (dynamic options from /api/settings), `src/components/seguros/landing-page.tsx` (AnimatedStats + FaqSection), `src/components/seguros/admin-policy-detail.tsx` (audit export buttons + FileJson import)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Notifications (email/SMS)**: External notification delivery on approval.
5. **Policy expiry email**: Send reminder emails before vigencia ends.
6. **Document replace**: One-click replace (delete+upload) in admin.
7. **Admin settings → admin detail**: Make admin detail edit fields also use settings-backed dropdowns.
8. **Global activity feed page**: Dedicated page showing all activity across all policies (not just the bell dropdown).

---

## Task ID: 7 (cron review — activity feed + document replace + landing timeline)
Agent: main (Z.ai Code) — webDevReview cron round 6
Task: QA assessment + global activity feed page + document replace + landing timeline redesign.

### Work Log
**QA Assessment (agent-browser)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- Confirmed previous round's features (settings→form integration, FAQ, audit export) all working.

**Major Feature: Global Activity Feed Page**
- New `GET /api/activities` endpoint with pagination + filters (action, from, to date range).
- Returns activities with joined policy info (verifyCode, policyNumber, nombre, status).
- New `ActivityFeed` component (`activity-feed.tsx`):
  - Filter row: action dropdown (8 options), date-from/to inputs, Filtrar + Limpiar buttons, total count.
  - Activity list: each item has color-coded icon badge (9 action types), description, policy name + number + status badge + time-ago.
  - Click any item → opens that policy's detail.
  - Pagination footer with numbered buttons + prev/next chevrons.
  - Skeleton loaders + empty state.
- Added "Actividad" nav item (Activity icon) in admin sidebar.
- New view 'actividad' in admin dashboard.

**Feature: Document One-Click Replace**
- Added `replaceDoc` function in admin-policy-detail: opens file picker → confirms replacement → deletes old doc → uploads new doc with same tipo.
- Added "Reemplazar" button (RefreshCw icon) to DocCard header (between Abrir and Eliminar).
- Button hover: emerald accent. Tooltip: "Reemplazar".
- Confirmation dialog shows old and new filenames.

**Feature: Landing Page "How it Works" Timeline Redesign**
- Replaced simple 4-column horizontal grid with a vertical timeline:
  - Gradient vertical line (emerald, fading down).
  - 4 nodes with icons (FileText, Upload, Clock, QrCode) in bordered circles.
  - Each step: number (01-04), title, time badge (~5 min, ~2 min, <24 h, Inmediato), description.
  - Responsive: adapts from mobile (narrow) to desktop.
  - "Proceso simple" badge + CTA button at bottom.
- Added Upload icon import to landing page.

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Activity feed: "Actividad Global" heading + 3 activities visible (CREATED carlos, APPROVED Maria, PDF_GENERATED Maria) with policy info, status badges, time-ago.
- ✅ Activity feed filters: action dropdown + date inputs + Filtrar/Limpiar buttons present.
- ✅ Activity feed pagination UI present.
- ✅ VLM confirms activity feed is "limpio, moderno y coherente" with "buena estructura".
- ✅ Document replace: "Reemplazar" button present on DocCard (verified 3 button titles: Vista previa, Reemplazar, Eliminar).
- ✅ Landing timeline: 4 steps render with time badges (~5 min, ~2 min, <24 h, Inmediato).
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200 (including new /api/activities).

### Files Added/Modified
- Added: `src/app/api/activities/route.ts`, `src/components/seguros/activity-feed.tsx`
- Modified: `src/components/seguros/admin-dashboard.tsx` (actividad view + nav item + ActivityFeed import), `src/components/seguros/admin-policy-detail.tsx` (replaceDoc function + DocCard onReplace prop + Reemplazar button), `src/components/seguros/landing-page.tsx` (vertical timeline redesign + Upload icon import)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Notifications (email/SMS)**: External notification delivery on approval.
5. **Policy expiry email**: Send reminder emails before vigencia ends.
6. **Admin detail → settings dropdowns**: Make admin detail edit fields use settings-backed dropdowns (currently plain text inputs).
7. **Activity feed → CSV export**: Export the global activity feed as CSV.
8. **Dashboard quick-stats cards clickable**: Make KPI cards navigate to filtered lists.

---

## Task ID: 8 (cron review — clickable KPIs + coverage comparison + activity CSV export)
Agent: main (Z.ai Code) — webDevReview cron round 7
Task: QA assessment + clickable dashboard KPI cards + landing coverage comparison + activity feed CSV export.

### Work Log
**QA Assessment (agent-browser)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- Confirmed previous round's features (activity feed, document replace, landing timeline) all working.

**Major Feature: Clickable Dashboard KPI Cards**
- Added `onCardClick?: (filter: string) => void` prop to DashboardView.
- Each KPI card now has a `filter` property: Total→ALL, Pendientes→PENDIENTE, Aprobadas→APROBADA, Rechazadas→RECHAZADA, Tasa Aprobación→APROBADA. "Solicitudes Hoy" has filter=null (not status-based, so not clickable).
- Cards with filter !== null are clickable: cursor-pointer, hover bg + shadow-lg + emerald glow.
- Clicking a card: sets statusFilter, clears search, resets to page 1, switches to "todas" view, reloads policies with that status, shows toast ("Filtrando por estado: X" or "Mostrando todas las pólizas").
- Wired `onCardClick` in AdminShell DashboardView usage.

**Major Feature: Landing Page Coverage Comparison Section**
- New `CoverageComparison` component (`coverage-comparison.tsx`):
  - 3 plan cards: Responsabilidad Civil ($25/mes), Cobertura Total ($65/mes, "MÁS POPULAR"), Cobertura Amplia ($95/mes).
  - Each card: icon badge (Shield/ShieldCheck/Crown), name, price, 6 feature rows with check/X icons (included/excluded).
  - Popular plan: scaled up (lg:scale-105), emerald gradient badge, shadow glow.
  - Deducible + suma asegurada info box at bottom of each card.
  - Disclaimer text below grid.
- Added "Coberturas" nav link in header.
- Placed between Services and How-it-works sections.
- VLM confirms: "precios y features con estructura lógica", "jerarquía visual clara", "diseño moderno y profesional".

**Feature: Activity Feed CSV Export**
- New `GET /api/activities/export?action=&from=&to=` endpoint:
  - Returns all activities (up to 5000) with joined policy info as CSV.
  - 9 columns: Fecha, Acción, Descripción, Actor, Código Verificación, N° Póliza, Tomador, Cédula, Estado Póliza.
  - BOM UTF-8 for Excel, proper CSV escaping.
  - Respects action + date range filters.
- Added "Exportar CSV" button (Download icon) to ActivityFeed header.
  - Only appears when pagination.total > 0.
  - Opens export URL in new tab with current filters applied.

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ KPI cards clickable: verified cursor:pointer + onclick attributes; "Ver lista →" hint text present.
- ✅ KPI click navigation: clicked "Aprobadas" card → navigated to "Todas las Pólizas" with status filter set to "Aprobadas".
- ✅ Coverage comparison: 3 plan cards render (Responsabilidad Civil, Cobertura Total, Cobertura Amplia) with "MÁS POPULAR" badge on Cobertura Total.
- ✅ VLM confirms coverage section has "estructura lógica" and "jerarquía visual clara".
- ✅ Activity feed export: "Exportar CSV" button present; CSV endpoint returns 200 with correct headers + data rows.
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200 (including new /api/activities/export).

### Files Added/Modified
- Added: `src/components/seguros/coverage-comparison.tsx`, `src/app/api/activities/export/route.ts`
- Modified: `src/components/seguros/admin-dashboard.tsx` (onCardClick prop + clickable cards + wiring), `src/components/seguros/landing-page.tsx` (CoverageComparison section + Coberturas nav link), `src/components/seguros/activity-feed.tsx` (exportCsv function + Exportar CSV button + Download icon import)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Notifications (email/SMS)**: External notification delivery on approval.
5. **Policy expiry email**: Send reminder emails before vigencia ends.
6. **Admin detail → settings dropdowns**: Make admin detail edit fields use settings-backed dropdowns.
7. **Coverage comparison → solicitud**: Click a plan card to pre-fill the form with that coverage type.
8. **Dashboard date-range selector**: Add a global date range filter affecting all dashboard stats.

---

## Task ID: 9 (cron review — coverage prefill + admin detail dropdowns)
Agent: main (Z.ai Code) — webDevReview cron round 8
Task: QA assessment + coverage comparison prefill + admin detail settings-backed dropdowns.

### Work Log
**QA Assessment (agent-browser)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- Confirmed previous round's features (clickable KPIs, coverage comparison, activity CSV export) all working.

**Major Feature: Coverage Comparison → Solicitud Prefill**
- Made CoverageComparison cards clickable with "Elegir este plan" CTA buttons.
- Each card now has a Button that calls `selectPlan(plan)` → navigates to `?view=solicitud&cobertura=<planName>`.
- Plan cards restructured: flex-col layout, features list flex-1 so CTA sits at bottom consistently.
- Popular plan uses emerald variant; others use outline variant.
- ArrowRight icon with group-hover translate animation.
- Updated `page.tsx` Router to read `cobertura` query param and pass as `prefillCobertura` prop to SolicitudForm.
- Updated SolicitudForm to accept `prefillCobertura?: string`:
  - On mount, if prefillCobertura is set: `setValue('tipoCobertura', prefillCobertura)`.
  - Jumps to step 2 (Cobertura) after 300ms so user sees the pre-selected value.
  - Shows toast: `Plan "Cobertura Total" preseleccionado`.
- Cards have hover effects: border-emerald glow, shadow-xl, group-hover translate on arrow.

**Major Feature: Admin Detail Settings-Backed Dropdowns**
- Updated GroupCard component to accept `fieldOptions?: Record<string, string[]>` prop.
- When a field has options in fieldOptions, renders a Select dropdown instead of plain Input.
- AdminPolicyDetail now loads settings from `/api/settings` on mount and builds fieldOptions map:
  - `tipoVehiculo` → VEHICLE_TYPES
  - `tipoCobertura` → COVERAGE_TYPES
  - `compania` → ASEGURADORAS
  - `plan` → PLAN_TYPES
- All 3 GroupCards (Cliente, Vehículo, Cobertura) receive fieldOptions.
- Fields without configured options remain plain text inputs (graceful fallback).
- Editing a dropdown field updates form state same as text inputs.

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Coverage comparison: 3 "Elegir este plan" buttons present on plan cards.
- ✅ Plan prefill: clicked "Elegir este plan" (Cobertura Total) → navigated to solicitud → step jumped to "Paso 3 de 4: Cobertura" → Tipo de Cobertura dropdown shows "Cobertura Total" pre-selected.
- ✅ Admin detail dropdowns: 4 comboboxes on Datos tab (Tipo de Vehículo, Tipo de Cobertura, Aseguradora, Plan).
- ✅ Aseguradora dropdown loads options dynamically (verified: Seguros Caracas, Mapfre, Oriental, La Previsora, Banesco).
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200.

### Files Modified
- `src/components/seguros/coverage-comparison.tsx` (useRouter + selectPlan + CTA buttons + flex layout)
- `src/app/page.tsx` (read cobertura query param + pass as prefillCobertura prop)
- `src/components/seguros/solicitud-form.tsx` (prefillCobertura prop + apply on mount + jump to step 2)
- `src/components/seguros/admin-policy-detail.tsx` (fieldOptions state + load from /api/settings + GroupCard fieldOptions prop + Select rendering)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Notifications (email/SMS)**: External notification delivery on approval.
5. **Policy expiry email**: Send reminder emails before vigencia ends.
6. **Dashboard global date-range**: Add a date filter affecting all dashboard stats + charts.
7. **Inline edit confirmation**: Show "unsaved changes" indicator + discard button in admin detail.
8. **Policy clone/duplicate**: Button to clone an existing policy's data into a new solicitud.

---

## Task ID: 10 (cron review — unsaved changes indicator + policy clone)
Agent: main (Z.ai Code) — webDevReview cron round 9
Task: QA assessment + inline unsaved-changes indicator + policy clone/duplicate feature.

### Work Log
**QA Assessment (agent-browser)**
- All golden paths intact (landing, form, admin, verify, PDF, docs). No console errors.
- Confirmed previous round's features (coverage prefill, admin detail dropdowns) all working.

**Major Feature: Inline Unsaved-Changes Indicator**
- Added `originalForm` state to track the saved version of the form.
- Added `hasChanges` computed via `useMemo` — compares current form to originalForm field by field.
- Added `beforeunload` event listener that warns before navigating away with unsaved changes.
- Header now shows:
  - "Cambios sin guardar" badge (amber, pulsing dot) when hasChanges=true.
  - "Descartar cambios" button (RotateCcw icon, red hover) — only when hasChanges.
  - "Guardar" button disabled when !hasChanges (prevents redundant saves).
- Bottom of Datos tab (save bar):
  - Shows "Tienes cambios sin guardar" (amber) when hasChanges, or "Todos los cambios guardados" (emerald check) when !hasChanges.
  - "Descartar" button + "Guardar cambios" button (disabled when !hasChanges).
- `discardChanges()` function: confirms then resets form to originalForm.
- `save()` now updates originalForm after successful save (clears hasChanges).

**Major Feature: Policy Clone/Duplicate**
- Added "Clonar" button (Copy icon) in the action bar of admin policy detail.
- `clonePolicy()` function:
  - Confirms with user ("¿Crear una nueva solicitud con los mismos datos?").
  - Builds payload from current form, excluding policyNumber, status, and notes.
  - POSTs to /api/policies (creates new solicitud with PENDIENTE status).
  - On success: toast "Solicitud clonada con código XXXXXX" + navigates to the new policy.
- Added `onNavigate?: (newId: string) => void` prop to AdminPolicyDetail.
- AdminDashboard passes `onNavigate={(newId) => setSelectedId(newId)}` so clone navigates to the new policy detail.
- Added `cloning` state for button loading spinner.
- Verificado: cloned Maria's policy → new policy created with code 398239, status PENDIENTE, same name "Maria Editada".

### Stage Summary / Verification (agent-browser + curl)
- ✅ All pages compile (HTTP 200), no console errors.
- ✅ Unsaved indicator: "Guardar" button disabled when no changes; editing a field → "Cambios sin guardar" badge appears in header + "Descartar cambios" button + "Guardar" enabled.
- ✅ Bottom save bar: shows "Tienes cambios sin guardar" (amber) when dirty, "Todos los cambios guardados" (emerald) when clean.
- ✅ Clone: clicked "Clonar" → new policy created (code 398239, PENDIENTE) → navigated to new policy detail → toast confirmed.
- ✅ `bun run lint` passes clean (0 errors).
- ✅ All API endpoints return 200.

### Files Modified
- `src/components/seguros/admin-policy-detail.tsx` (originalForm state + hasChanges useMemo + beforeunload + discardChanges + clonePolicy + Clonar button + unsaved indicator badges + disabled save logic + RotateCcw/Check icon imports + onNavigate prop)
- `src/components/seguros/admin-dashboard.tsx` (pass onNavigate to AdminPolicyDetail)

### Unresolved / Next-phase recommendations (updated)
1. **Auth**: Still demo password — migrate to NextAuth.js v4.
2. **Cloudflare deployment**: storage.ts → R2; Prisma → D1.
3. **PDF template**: Integrate user's `pdfclean` template.
4. **Notifications (email/SMS)**: External notification delivery on approval.
5. **Policy expiry email**: Send reminder emails before vigencia ends.
6. **Dashboard global date-range**: Add a date filter affecting all dashboard stats + charts.
7. **Policy clone with documents**: Currently clones data only; could also copy document references.
8. **Admin detail keyboard shortcut**: Cmd/Ctrl+S to save from anywhere in the detail.
