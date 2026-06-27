# Nard — Advanced Retail Inventory & Sales Management System

A full-stack inventory and sales management platform for retail stores. Store
employees and managers can manage products and categories, run advanced
searches, process sales through a cart, generate invoices, see **real-time**
stock updates, and review reports — all behind JWT auth with role-based access.

> **Status:** under active development. This README is filled in incrementally
> as features land. See the roadmap below.

---

## Tech Stack

| Layer      | Technology                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Frontend   | Angular (standalone components), TypeScript, SCSS, TailwindCSS, RxJS, Signals, ngx-translate, Socket.IO client |
| Backend    | NestJS, TypeScript, TypeORM, JWT, RBAC, Socket.IO, Swagger                                                     |
| Database   | MySQL 8                                                                                                        |
| Deployment | Docker, Docker Compose                                                                                         |
| Testing    | Jest (backend), Jasmine + Karma (frontend)                                                                     |

---

## Architecture

Single repository, two independently-tooled applications orchestrated by Docker
Compose:

```
nard-inventory-managment-system/
├── backend/                  # NestJS API
│   ├── Dockerfile, docker-entrypoint.sh
│   └── src/
│       ├── auth/             # JWT + refresh rotation, RolesGuard, @Roles, @Public
│       ├── users/            # user entity + repository service
│       ├── categories/       # category CRUD
│       ├── products/         # CRUD + full-text search / filter / pagination
│       ├── sales/            # transactional checkout, invoices, history
│       ├── reports/          # sales + stock aggregations
│       ├── realtime/         # Socket.IO StockGateway (stock.updated)
│       ├── common/           # base entity, filters, interceptors, pagination DTOs
│       ├── config/           # typed config + Joi env validation
│       └── database/         # data-source, migrations, seed
├── frontend/                 # Angular SPA
│   ├── Dockerfile, nginx.conf
│   └── src/app/
│       ├── core/             # models, services, interceptors, guards
│       ├── shared/           # modal, confirm, pagination, toast, spinner, stat-card
│       ├── layout/           # responsive admin shell
│       └── features/         # auth, dashboard, products, categories, pos, sales, reports
├── docker-compose.yml        # db + api + web orchestration (full profile)
├── .env.example              # environment template
└── README.md
```

Both apps follow a clean, feature-based structure with clear separation of
concerns: NestJS uses one module per domain (controller → service → repository,
DTO-validated boundaries); Angular uses standalone, lazy-loaded feature
components with `OnPush`, signals, typed API services, interceptors and guards.

---

## Getting Started

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- Docker & Docker Compose v2
- npm 10+

### Environment

```bash
cp .env.example .env
# edit .env and set secrets/passwords
```

### Run the database

```bash
docker compose up -d db
```

### Run everything in Docker

```bash
docker compose --profile full up --build
```

This brings up MySQL, the API (which auto-runs migrations + seed on start), and
the Angular app served by nginx. Then open:

- **App:** http://localhost:4200
- **API (proxied):** http://localhost:4200/api
- **Swagger:** http://localhost:3000/api/docs

### Stop everything in Docker

```bash
docker compose --profile full down
```

### Seeded accounts

| Role     | Email              | Password       |
| -------- | ------------------ | -------------- |
| Manager  | `manager@nard.io`  | `Manager123!`  |
| Employee | `employee@nard.io` | `Employee123!` |

> Managers can mutate inventory, run sales, and view reports. Employees can
> browse products and process sales.

### Local development (without Docker)

```bash
docker compose up -d db                 # just the database
cd backend  && npm install && npm run migration:run && npm run seed && npm run start:dev
cd frontend && npm install && npm start  # serves on http://localhost:4200
```

To seed a large dataset for performance testing:

```bash
cd backend && SEED_PRODUCTS=50000 npm run seed
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full, documented list (database
credentials, JWT secrets, ports, CORS origins).

---

## Testing

- **Backend (Jest):** `cd backend && npm test` — covers auth, the transactional
  checkout (stock decrement, oversell + duplicate-cart rejection), product search
  and report aggregation.
- **Frontend (Jasmine/Karma):** `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
  — covers the auth service, route guard, cart, notifications and the API services.

---

## API Documentation

Swagger UI is served at `http://localhost:3000/api/docs` once the backend is
running.

---

## Roadmap

- [x] Repo foundation (tooling, Docker Compose, env templates)
- [x] Backend core (config, TypeORM, Swagger, global filters/pipes)
- [x] Authentication & RBAC (JWT + refresh tokens)
- [x] Categories CRUD
- [x] Products CRUD + advanced search/filter/pagination
- [x] Sales, cart, invoices, real-time stock (Socket.IO)
- [x] Reports
- [x] Angular frontend (auth, dashboard, products, categories, POS, sales, reports)
- [x] i18n (EN/AR + RTL)
- [x] Full Dockerization & deployment

---

## Future Improvements

- **Redis** for refresh-token storage (multi-instance logout/rotation) and
  response/report caching.
- **RabbitMQ** to offload invoice generation / notifications from the request path.
- **CI/CD** pipeline running both test suites and building images on push.
- **E2E tests** (Cypress/Playwright) for the full checkout + real-time flow.
- **Observability** — structured logging, metrics and tracing.

---

## License

This project is a technical assessment deliverable.
