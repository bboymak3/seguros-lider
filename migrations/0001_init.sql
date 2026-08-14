-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verifyCode" TEXT NOT NULL,
    "policyNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT,
    "asegNombre" TEXT,
    "asegApellido" TEXT,
    "asegCedula" TEXT,
    "asegEmail" TEXT,
    "tomadorIgualAseg" TEXT DEFAULT 'Si',
    "tomNombre" TEXT,
    "tomApellido" TEXT,
    "tomCedula" TEXT,
    "tomEmail" TEXT,
    "tomFechaNacimiento" TEXT,
    "tomEstadoCivil" TEXT,
    "tomGenero" TEXT,
    "tomTelefono" TEXT,
    "tomEstado" TEXT,
    "tomMunicipio" TEXT,
    "tomParroquia" TEXT,
    "tomDireccion" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "cedula" TEXT NOT NULL,
    "tipoCedula" TEXT,
    "fechaNacimiento" TEXT,
    "nacionalidad" TEXT,
    "estadoCivil" TEXT,
    "sexo" TEXT,
    "telefono" TEXT,
    "telefonoAlt" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "estado" TEXT,
    "ocupacion" TEXT,
    "tipoVehiculo" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "ano" TEXT,
    "placa" TEXT,
    "color" TEXT,
    "serialCarroceria" TEXT,
    "serialMotor" TEXT,
    "uso" TEXT,
    "capacidad" TEXT,
    "clase" TEXT,
    "tipo" TEXT,
    "poseeTrailer" TEXT DEFAULT 'No',
    "placaExtranjera" TEXT DEFAULT 'No',
    "cantidadPuestos" TEXT,
    "capacidadCarga" TEXT,
    "vehicleClassId" TEXT,
    "planId" TEXT,
    "tipoCobertura" TEXT,
    "compania" TEXT,
    "plan" TEXT,
    "prima" TEXT,
    "primaEur" TEXT,
    "primaUsd" TEXT,
    "primaBs" TEXT,
    "sumaAsegurada" TEXT,
    "deducible" TEXT,
    "vigenciaDesde" TEXT,
    "vigenciaHasta" TEXT,
    "frecuenciaPago" TEXT,
    "cedulaDocPath" TEXT,
    "cedulaDocName" TEXT,
    "cedulaDocType" TEXT,
    "tituloDocPath" TEXT,
    "tituloDocName" TEXT,
    "tituloDocType" TEXT,
    "pdfPath" TEXT,
    "qrPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aprobadoAt" DATETIME,
    "aprobadoPor" TEXT,
    CONSTRAINT "Policy_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Policy_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleClassId" TEXT NOT NULL,
    "priceEur" TEXT NOT NULL,
    "priceUsd" TEXT NOT NULL,
    "priceBs" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plan_vehicleClassId_fkey" FOREIGN KEY ("vehicleClassId") REFERENCES "VehicleClass" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'system',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Policy_verifyCode_key" ON "Policy"("verifyCode");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleClass_code_key" ON "VehicleClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleClass_name_key" ON "VehicleClass"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_externalId_key" ON "Plan"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

