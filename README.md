# C-LOL — Plataforma de Logística de Transporte

Plataforma web completa para la gestión logística de transporte. Incluye un portal administrativo para empresas transportistas y una PWA móvil para conductores.

---

## 🏗️ Arquitectura

```
C-LOL/
├── shared/               # Tipos TypeScript compartidos
│   └── types/index.ts
├── backend/              # API REST (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── data/         # Capa de datos (JSON para demo, Prisma para producción)
│   │   ├── middleware/   # Auth JWT
│   │   └── routes/       # Endpoints API
│   ├── data/             # Archivos JSON (simulación de base de datos)
│   └── prisma/           # Schema PostgreSQL (para producción)
├── frontend-company/     # Portal empresa (React + Vite + Tailwind)
├── frontend-driver/      # PWA conductor (React + Vite + PWA)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## 🚀 Cómo levantar el proyecto

### Requisitos
- Node.js 20+
- npm

### Desarrollo local

**1. Instalar dependencias**

```bash
# Backend
cd backend && npm install

# Portal empresa
cd frontend-company && npm install

# PWA conductores
cd frontend-driver && npm install
```

**2. Generar datos de prueba**

```bash
cd backend
npm run seed
```

**3. Levantar servicios** (en terminales separadas)

```bash
# Terminal 1 - Backend API
cd backend && npm run dev

# Terminal 2 - Portal empresa
cd frontend-company && npm run dev

# Terminal 3 - PWA conductor
cd frontend-driver && npm run dev
```

**URLs:**
- Portal empresa: http://localhost:5173
- PWA conductor: http://localhost:5174
- API: http://localhost:3001
- Swagger docs: http://localhost:3001/api/docs

### Docker (todo en uno)

```bash
docker-compose up --build
```

---

## 🔐 Credenciales de demo

### Portal Empresa
| Campo | Valor |
|-------|-------|
| Email | `admin@transportesdelsur.com.ar` |
| Contraseña | `admin123` |

### Acceso Conductor
Los conductores acceden mediante un link temporal generado desde el portal empresa:
1. Ir a un viaje → "Enviar link al chofer"
2. Copiar el link generado
3. Abrirlo desde el celular

---

## 📱 Portal Conductor (PWA)

Diseñado exclusivamente para celular:
- Pantallas grandes, botones grandes
- Flujo guiado por estados del viaje
- GPS en tiempo real
- Fotos y evidencias
- Reporte de incidencias
- Instalable como app (sin Play Store / App Store)

---

## 🗃️ Base de Datos

**Demo (actual):** Archivos JSON en `backend/data/`

**Producción (PostgreSQL):**
```bash
# Configurar DATABASE_URL en .env
# Ejecutar migraciones
cd backend && npx prisma migrate dev
cd backend && npx prisma db seed
```

---

## 🛣️ API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login empresa |
| POST | `/api/auth/driver/access` | Acceso conductor vía token |
| POST | `/api/auth/driver/token/generate` | Generar link conductor |
| GET | `/api/trips` | Listar viajes |
| POST | `/api/trips` | Crear viaje |
| GET | `/api/trips/:id` | Detalle del viaje |
| PUT | `/api/trips/:id` | Editar viaje |
| PUT | `/api/trips/:id/status` | Cambiar estado (empresa) |
| POST | `/api/trips/:id/duplicate` | Duplicar viaje |
| GET | `/api/drivers` | Listar conductores |
| POST | `/api/drivers` | Crear conductor |
| GET | `/api/vehicles` | Listar vehículos |
| POST | `/api/vehicles` | Crear vehículo |
| GET | `/api/driver/trip` | Mi viaje (conductor) |
| PUT | `/api/driver/trip/status` | Avanzar estado (conductor) |
| POST | `/api/driver/trip/location` | Actualizar GPS |
| POST | `/api/driver/trip/event` | Agregar evento/evidencia |
| POST | `/api/driver/trip/incident` | Reportar incidencia |

Documentación completa: http://localhost:3001/api/docs

---

## 📊 Estados del viaje

```
pendiente → asignado → chofer_notificado
  → en_camino_al_origen → llegó_al_origen → cargando
  → carga_finalizada → en_tránsito → llegó_al_destino
  → descargando → entregado → finalizado
```

---

## 🔔 Notificaciones (arquitectura preparada)

El sistema está preparado para integrar:
- **WhatsApp** vía Twilio
- **SMS** vía Twilio
- **Email** vía SendGrid
- **Push Notifications** vía Firebase

Configurar variables de entorno en `.env` (ver `.env.example`).

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 20, Express, TypeScript |
| Auth | JWT (jsonwebtoken) |
| ORM | Prisma (PostgreSQL en producción) |
| Demo DB | JSON files |
| Company Frontend | React 18, Vite, Tailwind CSS |
| Driver PWA | React 18, Vite, Tailwind CSS, vite-plugin-pwa |
| Iconos | Lucide React |
| Contenedores | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## 🔮 Roadmap futuro

- [ ] Integración WhatsApp (Twilio)
- [ ] Mapa en tiempo real (Google Maps / Mapbox)
- [ ] Firma digital en la PWA
- [ ] Integración con ERP (SAP, Odoo)
- [ ] Reportes en PDF/Excel
- [ ] App nativa iOS/Android
- [ ] PostgreSQL + Redis cache
- [ ] WebSockets para actualización en tiempo real
- [ ] Multi-empresa (multi-tenancy)
