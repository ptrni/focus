# Focus — Todo List

แอป Todo หน้าตาเรียบง่าย โทนม่วงอ่อน ใช้ **React 19 + TypeScript + Vite**, **AdonisJS 7 + Lucid ORM** และ **PostgreSQL 16** แยก frontend/backend ชัดเจน ไม่มีการสร้างหรือ push GitHub repository

## ฟีเจอร์

- เพิ่ม แก้ไข ลบ และทำเครื่องหมายงานเสร็จ/กลับมาทำต่อ
- สร้าง เปลี่ยนชื่อ ลบ และสลับดูงานแยกตาม workspace ได้
- กรอง All / Active / Completed, ค้นหา และสรุปจำนวนงาน
- ทุกการบันทึกผ่าน RESTful API ลง PostgreSQL โหลดหน้าใหม่แล้วข้อมูลยังอยู่
- ตรวจ title 1–200 ตัวอักษร ตัดช่องว่างหัวท้าย ตรวจ boolean และปฏิเสธฟิลด์ที่ไม่รู้จัก
- ยืนยันก่อนลบ แสดง loading/error/retry และแจ้งผลการบันทึก
- รองรับคีย์บอร์ดและจอมือถือ มี empty state โดยไม่สร้างข้อมูลตัวอย่างแทนข้อมูลจริง
- ไม่มีระบบบัญชีผู้ใช้ ทุกคนที่เข้าถึง API ใช้ workspace ชุดเดียวกัน เหมาะกับขอบเขตแบบทดสอบในเครื่อง

## เริ่มใช้งาน

ต้องมี Node.js 24+ และ Docker Compose (หรือ PostgreSQL ที่ติดตั้งเอง) เปิด Terminal ที่โฟลเดอร์นี้

### 1. ฐานข้อมูล

```bash
docker compose up -d db
```

ฐานข้อมูล `todo`, user `todo`, password `todo_local_password`, port `5432` เก็บข้อมูลใน Docker volume `todo_data` หากพอร์ตชนให้เปลี่ยนฝั่งซ้ายใน `compose.yaml` และ `PG_PORT` ใน backend `.env` อย่าใช้ `docker compose down -v` หากต้องการเก็บข้อมูล

### 2. Backend

```bash
cd backend
npm ci
cp .env.example .env
node ace generate:key
node ace migration:run
npm run dev
```

API: http://localhost:3333/api — ตรวจสถานะ process ได้ที่ `/api/health` (ไม่ใช่ database readiness check)

### 3. Frontend (Terminal ใหม่)

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

เปิด **http://localhost:5173** ใช้ hostname นี้ให้ตรงกับ `FRONTEND_ORIGIN` ใน backend ถ้าเปลี่ยน URL ให้แก้ CORS และ `VITE_API_URL` ตาม แล้ว restart dev server

ไฟล์ `.env` ที่อาจมีอยู่จากการตรวจงานเป็นค่าทดสอบเฉพาะเครื่อง ให้ใช้ `.env.example` ตามขั้นตอนข้างต้นสำหรับติดตั้งใหม่

## ตรวจงาน

เปิด database/API ก่อนทดสอบ:

```bash
cd backend
npm test
npm run build
```

```bash
cd frontend
npm run build
npm run test:e2e
```

Browser tests ต้องเปิด frontend ด้วย ใช้ Google Chrome ที่ `/usr/bin/google-chrome` โดยค่าเริ่มต้น กำหนด `CHROME_PATH` หากติดตั้งที่อื่น ทดสอบที่ขนาด 1440×1000 และ 390×844 ครอบคลุม workspace CRUD, todo CRUD, reload, filter, search, cancel delete และ retry เมื่อเชื่อมต่อไม่ได้

API tests ใช้ `http://127.0.0.1:3333/api` โดยกำหนด `API_URL` เพื่อเปลี่ยนได้ มีการทดสอบ workspace CRUD, scoped todo lists, cascade delete, ข้อมูลภาษาไทย/emoji, validation, ID ที่ไม่ถูกต้อง และ CORS

### Postman

Import `postman/Focus-Todo.postman_collection.json` แล้วเปิด Collection Runner รันทุก request ตามลำดับ มี assertions ในแต่ละ request และเก็บ `todoId` อัตโนมัติ ค่า `baseUrl` เริ่มต้นคือ `http://localhost:3333/api` ควรรันกับฐานข้อมูลทดสอบ

## REST API

| Method | Path | ผลลัพธ์ |
| --- | --- | --- |
| GET | `/api/workspaces` | `200 { data: Workspace[] }` |
| POST | `/api/workspaces` | `201 { data: Workspace }` |
| GET | `/api/workspaces/:id` | `200 { data: Workspace }` |
| PATCH | `/api/workspaces/:id` | `200 { data: Workspace }` |
| DELETE | `/api/workspaces/:id` | `204` ไม่มี body และลบ todo ใน workspace นั้นด้วย |
| GET | `/api/todos?workspaceId=1` | `200 { data: Todo[] }` เรียงงานใหม่ก่อน |
| POST | `/api/todos` | `201 { data: Todo }` |
| GET | `/api/todos/:id` | `200 { data: Todo }` |
| PATCH | `/api/todos/:id` | `200 { data: Todo }` |
| DELETE | `/api/todos/:id` | `204` ไม่มี body |

POST workspace: `{ "name": "School" }`

PATCH workspace: `{ "name": "School projects" }`

POST todo: `{ "title": "Read a book", "workspaceId": 1 }` และใส่ `completed` แบบ boolean ได้ หากไม่ส่ง `workspaceId` จะใช้ workspace แรก

PATCH: `{ "title": "Read two chapters", "completed": true }` ส่งอย่างน้อยหนึ่งฟิลด์

Workspace: `{ id, name, createdAt, updatedAt }`

Todo: `{ id, workspaceId, title, completed, createdAt, updatedAt }` โดย timestamps เป็น ISO string ข้อมูลผิดตอบ `422 { message }` และไม่พบงาน/workspace ตอบ `404 { message }`

## โครงสร้าง

- `frontend/src/App.tsx` — UI และสถานะหน้าเว็บ
- `frontend/src/api.ts` — HTTP client และ types
- `backend/app/Controllers/Http/TodosController.ts` — CRUD และ validation
- `backend/app/Controllers/Http/WorkspacesController.ts` — สร้างและอ่าน workspace
- `backend/app/Models/Todo.ts` — Lucid model
- `backend/database/migrations/` — PostgreSQL schema
- `backend/tests/` / `frontend/tests/` — integration และ browser tests
- `postman/` — Collection พร้อม assertions

สามารถแยก `frontend` และ `backend` เป็นสอง Repository ภายหลังได้ แต่ละส่วนมี package-lock และ README ของตัวเอง

## เวอร์ชันและการแก้ช่องโหว่

อัปเกรดจาก AdonisJS 5 เป็น AdonisJS 7 และ Lucid 22 เพื่อเปลี่ยน dependencies ที่มีช่องโหว่เป็นรุ่นที่แก้ไขแล้ว อ้างอิง [คู่มือ AdonisJS 7](https://docs.adonisjs.com/v6-to-v7) จึงไม่ได้ใช้เวอร์ชัน 5 ที่โจทย์ให้พิจารณาเป็นพิเศษ แต่ยังใช้ AdonisJS ตามตัวเลือกของโจทย์

Backend ต้องใช้ **Node.js 24+** (`backend/.nvmrc` ระบุ 24) และ `.npmrc` ป้องกันการติดตั้งด้วย Node ที่ไม่รองรับ หากใช้ nvm ให้รัน `nvm install 24` และ `nvm use 24` ก่อน `npm ci`

ใช้ตารางและชื่อ migration เดิมได้ ไม่ต้อง reset ฐานข้อมูล หลังอัปเกรดให้รัน `npm ci` และ `node ace migration:run` โดยเก็บ `.env` และข้อมูลเดิมไว้

API รับ POST/PATCH/PUT เฉพาะ `application/json` (อื่น ๆ ตอบ 415) จำกัด JSON 16 KB (เกินตอบ 413) และกำหนดฟิลด์ที่บันทึกได้เฉพาะ title/completed ปิด form/multipart parsing ชุดทดสอบตรวจ malformed JSON, ขนาดคำขอ, ฟิลด์ภายใน ORM และ prototype-related keys เพิ่มเติมจาก CRUD

ตรวจ dependencies ทั้งหมดรวม dev ด้วย `npm audit` และ `npm audit --omit=dev` ได้จาก `backend` ผลวันที่ 16 กันยายน 2026: **0 ช่องโหว่ที่ npm รายงาน** ผลนี้ไม่ใช่การรับรองว่าไม่มีความเสี่ยงอื่น และควรตรวจใหม่เมื่ออัปเดต dependencies

Google Fonts เป็นส่วนเสริม หากโหลดไม่ได้จะใช้ system font และแอปยังทำงานได้
