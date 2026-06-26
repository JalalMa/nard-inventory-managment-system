# Nard — Advanced Retail Inventory & Sales Management System

A full-stack inventory and sales management platform for retail stores. Store
employees and managers can manage products and categories, run advanced
searches, process sales through a cart, generate invoices, see **real-time**
stock updates, and review reports — all behind JWT auth with role-based access.

> **Status:** under active development. This README is filled in incrementally
> as features land. See the roadmap below.

---

## Tech Stack

| Layer       | Technology                                                            |
| ----------- | --------------------------------------------------------------------- |
| Frontend    | Angular (standalone components), TypeScript, SCSS, TailwindCSS, RxJS, Signals, ngx-translate, Socket.IO client |
| Backend     | NestJS, TypeScript, TypeORM, JWT, RBAC, Socket.IO, Swagger            |
| Database    | MySQL 8                                                               |
| Deployment  | Docker, Docker Compose                                                |
| Testing     | Jest (backend), Jasmine + Karma (frontend)                            |

---

## Architecture

Single repository, two independently-tooled applications orchestrated by Docker
Compose:

```
nard-inventory-managment-system/
├── backend/            # NestJS API (clean, feature-based modules)
├── frontend/           # Angular SPA (standalone, lazy-loaded features)
├── docker-compose.yml  # db + api + web orchestration
├── .env.example        # environment template
└── README.md
```

Both apps follow clean, feature-based structure with clear separation of
concerns (entities, DTOs, services, repositories, guards, interceptors, pipes,
filters, shared/core layers). Detailed per-app structure is documented in each
app's section as it is built.

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

> Local (non-Docker) dev instructions for each app are added in their
> respective build steps.

---

## Environment Variables

See [`.env.example`](.env.example) for the full, documented list (database
credentials, JWT secrets, ports, CORS origins).

---

## Testing

- **Backend:** `cd backend && npm test`
- **Frontend:** `cd frontend && npm test`

---

## API Documentation

Swagger UI is served at `http://localhost:3000/api/docs` once the backend is
running.

---

## Screenshots

_Placeholders — added once the UI is implemented._

| Dashboard | Products | Sales |
| --------- | -------- | ----- |
| _TBD_     | _TBD_    | _TBD_ |

---

## Roadmap

- [x] Repo foundation (tooling, Docker Compose, env templates)
- [x] Backend core (config, TypeORM, Swagger, global filters/pipes)
- [x] Authentication & RBAC (JWT + refresh tokens)
- [x] Categories CRUD
- [x] Products CRUD + advanced search/filter/pagination
- [x] Sales, cart, invoices, real-time stock (Socket.IO)
- [x] Reports
- [ ] Angular frontend (auth, dashboard, products, sales, reports)
- [ ] i18n (EN/AR + RTL)
- [ ] Full Dockerization & deployment

---

## Future Improvements

_Documented as the project matures (e.g. caching with Redis, message queues with
RabbitMQ, CI/CD, e2e tests)._

---

## License

This project is a technical assessment deliverable.
