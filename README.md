# Hospital Inventory & Operations Management

A full-stack web app for managing hospital operations across two locations —
**Sirsa** and **Hanumangarh**. Covers general inventory, operation theatre
disposables, IVF injections (bundled into patient packages), and staff
attendance.

> This repo also contains **[Journée](journee/)**, a separate personal companion PWA in `journee/`.

## Features

- **Multi-location** — every module is scoped per location, with a location
  switcher in the header. Stock levels are tracked independently per site.
- **Staff & Attendance** — maintain a staff directory per location and mark
  daily attendance (Present / Absent / Half Day / Leave / Holiday).
- **Inventory** — item catalog (General, OT Disposable, IVF Injection,
  Medicine, Equipment) with per-location stock, stock-in/stock-out
  transactions, and low-stock alerts based on reorder levels.
- **OT Disposables** — log OT cases (patient, surgery, surgeon) and record
  disposable items consumed per case; stock is deducted automatically.
- **IVF Injections** — create IVF packages per patient and log injections
  administered against each package. Usage is deducted from stock and
  flagged as included in the package (no separate line-item billing).
- **Dashboard** — per-location snapshot: staff present today, low-stock
  count, active IVF packages, today's OT case count, recent stock activity.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite, JWT auth
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router

## Project Structure

```
backend/    Express API + Prisma schema/migrations/seed
frontend/   React SPA
```

## Getting Started

### 1. Backend

```bash
cd backend
cp .env.example .env      # adjust JWT_SECRET for production
npm install
npx prisma migrate dev    # creates SQLite db and applies schema
npm run seed               # seeds locations, admin user, sample staff/items
npm run dev                 # starts API on http://localhost:4000
```

Seeded admin login:
- Email: `actualshivi@gmail.com`
- Password: `admin123`

**Change this password before using in production.**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # starts on http://localhost:5173, proxies /api to :4000
```

Open http://localhost:5173 and log in.

### Production build

```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # outputs static files to frontend/dist
```

Serve `frontend/dist` with any static host / reverse proxy, pointed at the
backend API.

## Data Model Notes

- Stock is tracked per `(item, location)` pair in `InventoryStock`.
- Every stock change (manual in/out, OT disposable usage, IVF injection
  usage) writes an immutable `StockTransaction` row for audit/history.
- `IVFInjectionUsage.includedInPackage` defaults to `true` — injections
  logged against a package are treated as bundled into the package price
  rather than billed as separate line items.
- Roles: `ADMIN`, `MANAGER`, `STAFF`. Item/staff management and stock
  adjustments require `ADMIN` or `MANAGER`; attendance marking and stock
  in/out are open to any authenticated user.

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite file path, e.g. `file:./dev.db` |
| `JWT_SECRET` | Secret used to sign auth tokens — change in production |
| `PORT` | API port (default 4000) |
