# Focus Todo — Project Overview & Interview Guide

> **โปรเจกต์นี้เป็นโจทย์ทดสอบความสามารถ (Take-home Test)** สำหรับตำแหน่ง Fullstack Developer
> เอกสารนี้จัดทำเพื่อเตรียมพร้อมสัมภาษณ์ — อธิบายรายละเอียดทุกส่วน เน้น AdonisJS เพราะเป็น framework ใหม่ที่ไม่เคยใช้

---

## 1. ภาพรวมโปรเจกต์ (Project Summary)

| รายการ | รายละเอียด |
|----------|-------------|
| **ชื่อโปรเจกต์** | Focus — Todo List App |
| **ประเภท** | Fullstack Todo App (แยก Frontend/Backend ชัดเจน) |
| **สถานะ** | เสร็จสมบูรณ์ พร้อมทดสอบ ครอบคลุม CRUD, validation, error handling, E2E tests |
| **Base URL** | Frontend: `http://localhost:5173` · Backend API: `http://localhost:3333/api` |

### Stack หลัก

| Layer | Technology | Version | หมายเหตุ |
|-------|------------|---------|----------|
| **Frontend** | React + TypeScript + Vite | React 19, TS 5.7, Vite 6.1 | Single-file App.tsx (90 บรรทัด) |
| **Backend** | **AdonisJS + Lucid ORM** | **AdonisJS 7, Lucid 22** | **Framework ใหม่ — เรียนรู้จากโปรเจกต์นี้** |
| **Database** | PostgreSQL | 16 (Docker Alpine) | Volume persist: `todo_data` |
| **Testing** | Node.js test runner + Playwright | Node 24+, Playwright 1.63 | API + Browser E2E tests |
| **Icons** | Lucide React | 0.468 | Tree-shakable SVG icons |

### ฟีเจอร์หลัก (Requirements ที่ทำได้ครบ)

- ✅ CRUD งาน: เพิ่ม/แก้ไข/ลบ/Toggle completed
- ✅ กรอง: All / Active / Completed + ค้นหา + สรุปสถิติ
- ✅ Validation: Title 1–200 chars, trim, completed = boolean, reject unknown fields
- ✅ UX: Loading/Error/Retry, Confirm delete dialog, Keyboard accessible, Mobile responsive
- ✅ Persistence: PostgreSQL, reload หน้าใหม่ข้อมูลยังอยู่
- ✅ Security: JSON-only API, 16KB limit, prototype pollution protection, CORS
- ✅ No auth: Single shared list (เหมาะสำหรับ local testing)

---

## 2. โครงสร้างโปรเจกต์ (Project Structure)

```
ice/
├── compose.yaml                    # Docker Compose: PostgreSQL 16
├── README.md                       # คู่มือเริ่มต้นใช้งาน
├── docs/                           # 📁 เอกสารสำหรับสัมภาษณ์ (สร้างใหม่)
│   ├── PROJECT_OVERVIEW.md         # ไฟล์นี้
│   ├── ADONISJS_DEEP_DIVE.md       # AdonisJS รายละเอียด
│   ├── ARCHITECTURE.md             # สถาปัตยกรรม & Data Flow
│   ├── API_REFERENCE.md            # API Spec พร้อมตัวอย่าง
│   ├── TESTING_STRATEGY.md         # กลยุทธ์การทดสอบ
│   └── INTERVIEW_QA.md             # คำถามที่อาจโดนถาม + คำตอบ
├── focus/                          # 📁 โปรเจกต์ทั้งหมด (ย้ายมาไว้ที่นี่)
│   ├── backend/                    # AdonisJS 7 API Server
│   │   ├── app/
│   │   │   ├── Controllers/Http/TodosController.ts
│   │   │   ├── Models/Todo.ts
│   │   │   └── middleware/json_only_middleware.ts
│   │   ├── config/
│   │   │   ├── app.ts, cors.ts, database.ts, bodyparser.ts, logger.ts, encryption.ts
│   │   ├── database/migrations/1700000000000_todos.ts
│   │   ├── start/routes.ts, env.ts, kernel.ts
│   │   ├── tests/api.test.mjs
│   │   ├── adonisrc.ts, package.json, tsconfig.json
│   │   └── .env.example
│   ├── frontend/                   # React 19 + Vite
│   │   ├── src/
│   │   │   ├── App.tsx, api.ts, main.tsx, styles.css
│   │   ├── tests/todo.spec.ts
│   │   ├── vite.config.ts, playwright.config.ts
│   │   └── package.json, .env.example
│   └── postman/Focus-Todo.postman_collection.json
```

---

## 3. จุดสำคัญสำหรับสัมภาษณ์ (Key Talking Points)

### 3.1 ทำไมเลือก AdonisJS 7? (Upgrade from v5)
- **Security**: โจทย์ระบุ AdonisJS 5 มีช่องโหว่ → อัปเกรดเป็น v7 + Lucid 22 ที่ patch แล้ว
- **Modern**: ใช้ ESM, TypeScript native, ไม่ต้อง用别的 transpiler
- **Opinionated**: มี structure ชัดเจน (MVC, IoC container, providers) ลด decision fatigue
- **Migration path**: เก็บ table/schema เดิมได้ ไม่ต้อง reset DB (`npm ci && node ace migration:run`)

### 3.2 AdonisJS 7 Key Concepts ที่ใช้ในโปรเจกต์
| Concept | ไฟล์ที่เกี่ยวข้อง | อธิบาย |
|---------|------------------|--------|
| **IoC Container & Providers** | `adonisrc.ts` | ลงทะเบียน providers: `app_provider`, `hash_provider`, `database_provider`, `cors_provider` |
| **Lazy Imports** | `routes.ts`, `kernel.ts` | `() => import('#controllers/TodosController')` — โหลดเมื่อใช้จริง |
| **Path Aliases (#imports)** | `package.json#imports`, `adonisrc.ts` | `#controllers/*`, `#models/*`, `#start/*`, `#middleware/*` |
| **Env Validation** | `start/env.ts` | `Env.schema.string()`, `number()`, `enum()` — validate ตอน boot |
| **Middleware Pipeline** | `start/kernel.ts` | Server middleware (CORS) + Router middleware (JSON-only + Bodyparser) |
| **Lucid ORM** | `Todo.ts`, migration | Decorators: `@column`, `@column.dateTime`, auto timestamps |
| **Validation (Manual)** | `TodosController.ts:payload()` | ไม่ใช้ Vine — validate เองใน controller (control flow ชัดเจน) |
| **Health Check** | `routes.ts` | `GET /api/health` — process health (ไม่ใช่ DB readiness) |

### 3.3 Architecture Decisions ที่โชว์ Seniority
| Decision | Trade-off | ทำไมเลือกแบบนี้ |
|----------|-----------|----------------|
| **Manual validation in controller** | ไม่ได้ใช้ Vine/validator | ควบคุม error messages เอง, ไม่มี dependency เพิ่ม, เข้าใจง่าย |
| **Single-file frontend (App.tsx)** | ไม่แยก component | Scope เล็ก, interview demo, จัดการ state ครบในที่เดียว |
| **No auth / single list** | ไม่มี multi-user | Requirements ระบุชัดเจน — focus ที่ core CRUD + API design |
| **16KB JSON limit + strict parsing** | Reject form/multipart | ป้องกัน DoS, prototype pollution, enforce API contract |
| **Optimistic UI updates** | Frontend update ก่อน server confirm | UX ดี, rollback ผ่าน error handling |

---

## 4. เริ่มต้นใช้งาน (Quick Start)

```bash
# 1. Database
docker compose up -d db

# 2. Backend
cd focus/backend
npm ci
cp .env.example .env
node ace generate:key
node ace migration:run
npm run dev          # http://localhost:3333

# 3. Frontend (terminal ใหม่)
cd focus/frontend
npm ci
cp .env.example .env
npm run dev          # http://localhost:5173
```

**Verify:** เปิด `http://localhost:5173` → ทดสอบเพิ่ม/แก้/ลบงาน → Reload หน้า → ข้อมูลคงอยู่

---

## 5. คำสั่งที่ต้องจำ (Essential Commands)

### Backend (AdonisJS)
```bash
cd focus/backend

# Development
npm run dev              # node ace serve --watch (hot reload)
node ace serve           # production mode

# Database
node ace migration:run       # รัน migration
node ace migration:rollback  # ย้อนกลับ
node ace migration:status    # ดูสถานะ
node ace make:migration name # สร้าง migration ใหม่
node ace make:model Name     # สร้าง model
node ace make:controller Name # สร้าง controller

# Build & Typecheck
npm run build            # node ace build → output ที่ ./build
npm run typecheck        # tsc --noEmit
npm run start            # node build/bin/server.js (production)

# Testing
npm test                 # node --test tests/api.test.mjs
```

### Frontend (Vite + React)
```bash
cd focus/frontend

npm run dev              # vite --host 127.0.0.1
npm run build            # tsc -b && vite build
npm run preview          # preview production build
npm run typecheck        # tsc --noEmit
npm run test:e2e         # playwright test (ต้องเปิด frontend + backend)
```

---

## 6. ไฟล์ต่อไปที่ควรอ่าน (Next Files to Read)

1. **`ADONISJS_DEEP_DIVE.md`** — รายละเอียด AdonisJS 7: IoC, Providers, Lucid, Middleware, Validation
2. **`ARCHITECTURE.md`** — Data flow, Request lifecycle, State management
3. **`API_REFERENCE.md`** — REST API spec, Error codes, Request/Response examples
4. **`TESTING_STRATEGY.md`** — Unit/API/E2E tests, Playwright setup, Test data isolation
5. **`INTERVIEW_QA.md`** — คำถามที่พบบ่อย + คำตอบตัวอย่าง

---

## 7. Checklist ก่อนสัมภาษณ์

- [ ] รันโปรเจกต์ได้สำเร็จ (backend + frontend + db)
- [ ] อธิบายได้ว่า **AdonisJS 7 โครงสร้างยังไง** (providers, IoC, lazy imports)
- [ ] อธิบายได้ว่า **Lucid ORM ทำงานยังไง** (model, migration, query builder)
- [ ] อธิบายได้ว่า **Validation ทำที่ไหน** (controller level, manual)
- [ ] อธิบายได้ว่า **Middleware pipeline เรียงยังไง** (server vs router middleware)
- [ ] อธิบายได้ว่า **CORS config ยังไง** (origin from env)
- [ ] อธิบายได้ว่า **Bodyparser config** (json only, 16kb, strict)
- [ ] อธิบายได้ว่า **Security measures** (prototype pollution, content-type check)
- [ ] อธิบายได้ว่า **Frontend state management** (React hooks, optimistic updates)
- [ ] อธิบายได้ว่า **Testing strategy** (API tests + Playwright E2E)
- [ ] พร้อมตอบ: "ทำไมไม่ใช้ Vine validator?", "ทำไม single-file App.tsx?", "Trade-offs ของ architecture นี้คืออะไร?"