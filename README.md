# Seguros Líder — Plataforma de Gestión de Pólizas Vehiculares

Plataforma digital completa para solicitud, gestión y verificación de pólizas de seguro vehicular. Incluye formulario público multi-paso, panel administrativo con dashboard, generación de certificados PDF con códigos QR, carga de documentos, y verificación pública por código QR.

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Modelo de Datos](#-modelo-de-datos)
- [API Endpoints](#-api-endpoints)
- [Flujos Principales](#-flujos-principales)
- [Instalación Local](#-instalación-local)
- [Despliegue en Cloudflare](#-despliegue-en-cloudflare)
- [Configuración](#-configuración)
- [Scripts Disponibles](#-scripts-disponibles)

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Lenguaje** | TypeScript 5 |
| **Estilos** | Tailwind CSS 4 + shadcn/ui (New York) |
| **Base de datos** | Prisma ORM + SQLite (local) / Cloudflare D1 (producción) |
| **Almacenamiento** | Filesystem local (sandbox) / Cloudflare R2 (producción) |
| **PDF** | pdf-lib + @pdf-lib/fontkit |
| **QR** | qrcode |
| **Gráficos** | recharts |
| **Formularios** | react-hook-form + zod |
| **Iconos** | lucide-react |
| **Notificaciones** | sonner |

> **Nota de portabilidad**: El proyecto fue construido en un sandbox con Next.js 16 + SQLite + filesystem. Para producción en Cloudflare, solo se necesita cambiar `src/lib/storage.ts` (filesystem → R2) y `src/lib/db.ts` (SQLite → D1). Los call-sites no cambian.

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Landing Page                      │
│  (hero, stats animadas, lookup público, servicios,  │
│   coberturas, timeline, testimonios, FAQ, contacto) │
└────────────┬────────────────────┬───────────────────┘
             │                    │
     ?view=solicitud        ?view=admin
             ▼                    ▼
┌────────────────┐    ┌───────────────────────────┐
│  Solicitud     │    │     Admin Dashboard        │
│  (4-step       │    │  (password: admin123)      │
│   wizard)      │    │                             │
│                │    │  ┌─ Dashboard (KPIs +      │
│  1. Cliente    │    │  │   gráficos + alertas)   │
│  2. Vehículo   │    │  ├─ Solicitudes Pendientes │
│  3. Póliza     │    │  ├─ Todas las Pólizas      │
│     (clase +  │    │  ├─ Lista de Precios        │
│      plan)     │    │  ├─ Actividad Global        │
│  4. Documentos │    │  ├─ Configuración           │
│                │    │  └─ Detalle de Póliza       │
└──────┬─────────┘    │     (editar, aprobar,       │
       │              │      documentos, QR,        │
       ▼              │      historial, clonar)     │
┌────────────────┐    └───────────────────────────┘
│  ?v=CODE       │
│  Verificación  │
│  Pública (QR)  │
└────────────────┘
```

### Capa de Almacenamiento (Abstracción)

```
src/lib/storage.ts  ←  Abstracción de bucket
  ├── put(key, data)     → filesystem (sandbox) / R2 (prod)
  ├── get(key)            → filesystem / R2
  ├── delete(key)         → filesystem / R2
  └── getSignedUrl(key)   → /api/files/... (sandbox) / R2 presigned (prod)

Bucket path: my-emdash-media/seguros/{verifyCode}/
  ├── cedula/{archivo}
  ├── titulo/{archivo}
  └── assets/
      ├── qr.png
      └── certificado.pdf
```

---

## 📁 Estructura del Proyecto

```
my-project/
├── prisma/
│   └── schema.prisma              # Modelos: Policy, Document, ActivityLog, Setting, VehicleClass, Plan
├── scripts/
│   └── seed-plans.ts              # Seed: 18 clases de vehículo + 162 planes con precios
├── src/
│   ├── app/
│   │   ├── page.tsx               # Router principal (query-param based)
│   │   ├── layout.tsx             # Layout + Toaster + Sonner
│   │   ├── globals.css            # Tailwind + print styles + scrollbar
│   │   └── api/
│   │       ├── activities/        # Feed global de actividad + export CSV
│   │       ├── files/[...path]/   # Servir archivos del bucket
│   │       ├── notifications/     # Notificaciones para el bell
│   │       ├── plans/             # CRUD de planes
│   │       ├── policies/          # CRUD + bulk + export + lookup + expiring
│   │       │   ├── [id]/
│   │       │   │   ├── activities/     # Historial + export
│   │       │   │   ├── approve/        # Aprobar + generar PDF
│   │       │   │   ├── documents/      # Upload/delete documentos
│   │       │   │   ├── pdf/            # Generar y servir PDF
│   │       │   │   └── qr/             # Generar QR PNG
│   │       │   ├── bulk/               # Acciones masivas
│   │       │   ├── export/             # Export CSV de pólizas
│   │       │   ├── expiring/           # Pólizas por vencer
│   │       │   ├── lookup/             # Búsqueda pública
│   │       │   └── verify/            # Verificación por código
│   │       ├── settings/          # Configuración (aseguradoras, coberturas, etc.)
│   │       ├── stats/             # Estadísticas del dashboard
│   │       └── vehicle-classes/   # CRUD de clases de vehículo
│   ├── components/
│   │   ├── seguros/
│   │   │   ├── landing-page.tsx          # Landing completa
│   │   │   ├── solicitud-form.tsx        # Formulario wizard 4 pasos
│   │   │   ├── verify-page.tsx           # Página de verificación pública
│   │   │   ├── admin-dashboard.tsx       # Shell del admin + vistas
│   │   │   ├── admin-policy-detail.tsx   # Detalle de póliza (editar/approbar/docs/QR/historial)
│   │   │   ├── admin-settings.tsx        # Configuración del sistema
│   │   │   ├── dashboard-charts.tsx      # Gráficos (recharts)
│   │   │   ├── activity-feed.tsx         # Feed global de actividad
│   │   │   ├── price-list-manager.tsx    # Gestión de planes y precios
│   │   │   ├── coverage-comparison.tsx   # Comparador de planes (landing)
│   │   │   ├── faq-section.tsx           # FAQ + stats animadas (landing)
│   │   │   ├── expiry-alerts.tsx         # Alertas de vencimiento
│   │   │   ├── notifications-bell.tsx    # Campana de notificaciones
│   │   │   ├── public-lookup.tsx         # Búsqueda pública
│   │   │   └── use-count-up.ts           # Hook animación contadores
│   │   └── ui/                           # shadcn/ui components
│   └── lib/
│       ├── db.ts                  # Prisma client
│       ├── storage.ts             # Abstracción de bucket (R2-ready)
│       ├── pdf.ts                 # Generación de PDF con QR
│       ├── qr.ts                  # Generación de QR
│       ├── activity.ts            # Helper de logging de actividades
│       ├── settings.ts            # Helper de configuración
│       └── policy-utils.ts        # Utilidades (verify code, validación, etc.)
├── storage/                       # Bucket local (emula R2)
│   └── seguros/{verifyCode}/
├── db/custom.db                   # SQLite database
├── package.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 🗄 Modelo de Datos

### Policy (Póliza)
Modelo principal con 50+ campos:

**Estado**: PENDIENTE | APROBADA | RECHAZADA | ANULADA

**Asegurado** (persona asegurada):
- asegNombre, asegApellido, asegCedula, asegEmail

**Tomador** (titular de la póliza):
- tomadorIgualAseg ("Si"/"No"), tomNombre, tomApellido, tomCedula, tomEmail
- tomFechaNacimiento, tomEstadoCivil, tomGenero, tomTelefono
- tomEstado, tomMunicipio, tomParroquia, tomDireccion

**Vehículo**:
- placa, marca, modelo, tipoVehiculo, ano, color
- serialCarroceria, serialMotor, uso, clase
- poseeTrailer, placaExtranjera, cantidadPuestos, capacidadCarga

**Póliza/Cobertura**:
- vehicleClassId (FK → VehicleClass), planId (FK → Plan)
- tipoCobertura, compania, plan
- prima, primaEur, primaUsd, primaBs
- sumaAsegurada, deducible, vigenciaDesde, vigenciaHasta, frecuenciaPago

**Documentos**: cedulaDocPath/Name/Type, tituloDocPath/Name/Type

**Artefactos**: pdfPath, qrPath

### VehicleClass (Clase de Vehículo)
- code (Int, único) — código numérico del sistema original (39, 33, 25, ...)
- name (String, único) — "AUTO ESCUELA", "MOTO", "CARGA", etc.
- sortOrder (Int)
- plans (Plan[]) — relación 1:N

**18 clases sembradas**: AUTO ESCUELA, AUTOBUS PLACA EXTRAJERA, AUTOBUSES, CARGA, CARGA CON PLACA EXTRANJERA, CHUTOS, MINIBUS, MINIBUS PLACA EXTRAJERA, MOTO, MOTO CARRO, OTRAS MAQUINAS, PARTICULAR, PARTICULAR PLACA EXTRANJERA, REMOLQUE, RUSTICO, RUTAS FORANEAS, TAXI, TAXI PLACA EXTRAJERA

### Plan (Plan de Seguro)
- externalId (Int, único) — ID numérico original (2, 3, 4, ..., 274)
- name (String) — "PLAN LIDER MOTO", etc.
- vehicleClassId (FK → VehicleClass)
- priceEur, priceUsd, priceBs (String) — precios en 3 monedas
- active (Boolean)

**162 planes sembrados** con precios en €, $ y Bs.

### Document
- policyId (FK → Policy, cascade delete)
- tipo: CEDULA | TITULO | OTRO
- fileName, filePath (bucket key), mimeType, size

### ActivityLog (Audit Trail)
- policyId (FK → Policy, cascade delete)
- action: CREATED | UPDATED | APPROVED | REJECTED | ANULADA | DOCUMENT_UPLOADED | DOCUMENT_DELETED | STATUS_CHANGED | PDF_GENERATED
- description, actor, metadata (JSON)

### Setting (Configuración)
- key (único): ASEGURADORAS | COVERAGE_TYPES | VEHICLE_TYPES | PLAN_TYPES
- value (JSON string) — array de opciones

---

## 🔌 API Endpoints

### Policies
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/policies` | Listar con paginación + filtros (status, q, from, to, page, pageSize) |
| `POST` | `/api/policies` | Crear solicitud |
| `GET` | `/api/policies/[id]` | Obtener póliza |
| `PATCH` | `/api/policies/[id]` | Actualizar campos |
| `DELETE` | `/api/policies/[id]` | Eliminar + borrar archivos |
| `POST` | `/api/policies/[id]/approve` | Aprobar + asignar N° + generar PDF |
| `POST` | `/api/policies/[id]/documents` | Subir documento (multipart) |
| `DELETE` | `/api/policies/[id]/documents/[docId]` | Eliminar documento |
| `GET` | `/api/policies/[id]/pdf` | Generar y servir PDF |
| `GET` | `/api/policies/[id]/qr` | Servir QR PNG |
| `GET` | `/api/policies/[id]/activities` | Historial de actividad |
| `GET` | `/api/policies/[id]/activities/export` | Export historial (CSV/JSON) |
| `POST` | `/api/policies/bulk` | Acciones masivas (approve/reject/anular/delete) |
| `GET` | `/api/policies/export` | Export CSV de pólizas |
| `GET` | `/api/policies/expiring` | Pólizas por vencer (days param) |
| `GET` | `/api/policies/lookup` | Búsqueda pública (cedula/placa/código) |
| `GET` | `/api/policies/verify` | Verificación por código |

### Vehicle Classes & Plans
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/vehicle-classes` | Listar clases con sus planes |
| `POST` | `/api/vehicle-classes` | Crear clase |
| `GET` | `/api/plans` | Listar planes (filter by vehicleClassId) |
| `POST` | `/api/plans` | Crear plan |
| `PATCH` | `/api/plans/[id]` | Actualizar plan |
| `DELETE` | `/api/plans/[id]` | Eliminar plan |

### Otros
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/stats` | Estadísticas del dashboard (KPIs + charts data) |
| `GET` | `/api/activities` | Feed global de actividad (paginado) |
| `GET` | `/api/activities/export` | Export CSV de actividad |
| `GET` | `/api/notifications` | Notificaciones recientes |
| `GET/PUT` | `/api/settings` | Configuración del sistema |
| `GET` | `/api/files/[...path]` | Servir archivos del bucket |

---

## 🔄 Flujos Principales

### 1. Solicitud de Póliza (Público)
```
Landing → "Solicitar Póliza" → Wizard 4 pasos:
  Paso 1: Cliente (nombre, cédula, teléfono, email, dirección...)
  Paso 2: Vehículo (placa, marca, modelo, trailer, placa extranjera, seriales, capacidad...)
  Paso 3: Póliza (clase de vehículo + plan con precios €/$/Bs + cobertura adicional)
  Paso 4: Documentos (cédula + título, opcionales)
→ POST /api/policies → código de verificación (6 dígitos)
→ Subir documentos (si los hay)
→ Pantalla de éxito con código
```

### 2. Aprobación (Admin)
```
Admin → "Solicitud de Pólizas" → pendientes
→ Click en póliza → Detalle
→ Editar datos (con indicador de cambios sin guardar)
→ "Aprobar y Generar Certificado"
  → Asigna N° de póliza secuencial
  → Genera PDF con QR embebido
  → Registra actividad (APPROVED + PDF_GENERATED)
→ Opcional: Clonar póliza, cargar/reemplazar documentos
```

### 3. Verificación Pública (QR)
```
Escanear QR del PDF → ?v=CODE
→ GET /api/policies/verify?code=CODE
→ Muestra: estado, N° póliza, tomador, vehículo, cobertura
→ Botón: Descargar PDF, Imprimir
```

### 4. Lista de Precios (Admin)
```
Admin → "Lista de Precios"
→ Tabla con 162 planes (ID, clase, nombre, EUR, USD, Bs, estado)
→ Buscar + filtrar por clase
→ Editar inline (precios + activar/desactivar)
→ Crear nuevos planes
→ Eliminar planes
```

---

## 🚀 Instalación Local

### Requisitos
- Node.js 18+ o Bun
- npm/bun

### Pasos

```bash
# 1. Instalar dependencias
bun install

# 2. Configurar base de datos
cp .env.example .env  # o crear .env con: DATABASE_URL="file:./db/custom.db"
bun run db:push       # Crear tablas
bun run db:generate   # Generar Prisma Client

# 3. Sembrar datos (clases de vehículo + planes)
bun run scripts/seed-plans.ts

# 4. Iniciar servidor de desarrollo
bun run dev
# → http://localhost:3000
```

### Credenciales de Admin (demo)
- **Contraseña**: `admin123`
- Acceso: `?view=admin` o botón "Admin" en la landing

---

## ☁️ Despliegue en Cloudflare

### Arquitectura de Producción
```
Cloudflare Pages/Workers  ←  Next.js 16 (standalone build)
    ├── D1 (seguros_db)   ←  Prisma (SQLite → D1 adapter)
    └── R2 (my-emdash-media/seguros/)  ←  storage.ts
```

### Pasos

#### 1. Migrar storage.ts a R2
En `src/lib/storage.ts`, reemplazar las implementaciones filesystem con R2 S3-compatible API:
```typescript
// Usar @aws-sdk/client-s3 o el binding R2 de Cloudflare Workers
// Las 4 funciones a migrar: put, get, delete, getSignedUrl
```

#### 2. Migrar Prisma a D1
- Cambiar `datasource` en `schema.prisma` de `sqlite` a D1 adapter
- Usar `@prisma/adapter-d1` en `src/lib/db.ts`
- Ejecutar migraciones con `wrangler d1 migrations apply`

#### 3. Configurar wrangler.toml
```toml
name = "seguros-lider"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "seguros_db"
database_id = "5f2737c7-ab51-4191-a50e-19e5bb16eeff"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-emdash-media"
```

#### 4. Variables de entorno
```bash
NEXT_PUBLIC_APP_URL=https://tu-dominio.pages.dev
```

#### 5. Desplegar
```bash
# Instalar wrangler
npm install -g wrangler

# Autenticar
wrangler login

# Push schema a D1
wrangler d1 execute seguros_db --file=prisma/migrations/init.sql

# Sembrar datos
wrangler d1 execute seguros_db --file=scripts/seed-sql.sql

# Deploy
wrangler pages deploy .next/standalone
```

---

## ⚙️ Configuración

### Variables de Entorno
```env
DATABASE_URL="file:./db/custom.db"     # SQLite local
# En Cloudflare: usar binding D1 en lugar de DATABASE_URL
```

### Configuración del Sistema (Admin → Configuración)
Editable desde el panel admin:
- **ASEGURADORAS**: Lista de compañías de seguro (8 por defecto)
- **COVERAGE_TYPES**: Tipos de cobertura (4 por defecto)
- **VEHICLE_TYPES**: Tipos de vehículo (6 por defecto)
- **PLAN_TYPES**: Planes comerciales (4 por defecto)

Estas listas se cargan dinámicamente en el formulario de solicitud.

---

## 📜 Scripts Disponibles

```bash
bun run dev          # Servidor de desarrollo (puerto 3000)
bun run build        # Build de producción
bun run start        # Servidor de producción
bun run lint         # ESLint
bun run db:push      # Push schema a DB
bun run db:generate  # Generar Prisma Client
bun run db:migrate   # Migraciones
bun run db:reset     # Reset DB
bun run scripts/seed-plans.ts  # Sembrar clases + planes
```

---

## 🎨 Características de UI

- **Dark mode** profesional (slate-950 + emerald accents)
- **Responsive** (mobile-first, breakpoints sm/md/lg/xl)
- **Sticky footer** en todas las páginas
- **Skeleton loaders** durante carga
- **Toasts** (sonner) para feedback
- **Animaciones**: contadores animados, hover effects, transitions
- **Print-friendly**: página de verificación con estilos de impresión
- **Keyboard shortcuts**: `/` (buscar), `g d/p/t/s/n` (navegación), `Ctrl+S` (guardar)
- **Accesibilidad**: contraste WCAG, ARIA labels, sr-only

---

## 📊 Funcionalidades del Admin

1. **Dashboard**: 6 KPIs clickeables + 4 gráficos (área, pie, barras) + alertas de vencimiento
2. **Solicitudes Pendientes**: lista con bulk actions (aprobar/rechazar/anular/eliminar)
3. **Todas las Pólizas**: paginación + filtros (estado, fecha) + CSV export
4. **Lista de Precios**: tabla editable de 162 planes con búsqueda
5. **Actividad Global**: feed de todas las acciones con filtros + CSV export
6. **Configuración**: editar aseguradoras, coberturas, tipos de vehículo, planes
7. **Detalle de Póliza**:
   - Tarjeta de resumen (8 campos clave)
   - Editar todos los campos (con dropdowns dinámicos desde settings)
   - Gestionar documentos (subir, reemplazar, eliminar, vista previa lightbox)
   - Generar/descargar PDF con QR
   - Historial de actividad (timeline) + export CSV/JSON
   - Clonar póliza
   - Aprobar/Rechazar/Anular
8. **Notificaciones**: campana con contador de no-leídas + auto-polling

---

## 🔒 Seguridad

> **IMPORTANTE**: El sistema usa un password gate de demostración (`admin123`). Para producción, migrar a **NextAuth.js v4** (ya en dependencias).

- Validación de archivos: JPG, PNG, WEBP, PDF (máx 10MB)
- Path traversal prevention en storage
- Cascade delete (póliza → documentos + actividades)
- beforeunload warning en formularios con cambios sin guardar

---

## 📝 Notas para Desarrolladores / IA

- **Todo el código está en TypeScript** con tipado estricto
- **Los componentes shadcn/ui** están en `src/components/ui/`
- **Las rutas son query-param based** (single `/` route): `?view=solicitud`, `?view=admin`, `?v=CODE`
- **El PDF se genera con pdf-lib** (no usa template externo — para integrar el `pdfclean` del repo `bboymak3/pdf-seguros`, cargar con `PDFDocument.load()` + `copyPages`)
- **El storage es una abstracción** — cambiar filesystem por R2 solo requiere modificar `src/lib/storage.ts`
- **Los planes y precios** están en la BD (sembrados con `scripts/seed-plans.ts`) y son editables desde el admin
- **El worklog completo** del desarrollo está en `worklog.md` (12 fases documentadas)

---

## 📄 Licencia

Propietario — Seguros Líder
