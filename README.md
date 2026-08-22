# Crafting Recipe Tree

> Craft-recipe management system for the **ERZ** game — browse recipe trees, calculate the raw materials needed to craft items, discover what you can build from what you have, chat in real time, and manage all content through a role-based admin panel.

![Build & Deploy](https://github.com/shavkatbegmatov/crafting-recipe-tree/actions/workflows/ci.yml/badge.svg)

🌐 **Live:** [erz-online.uz](https://erz-online.uz) · API: [api.erz-online.uz](https://api.erz-online.uz)

---

## Features

- **Recipe tree** — expand any item into its full nested crafting tree (ingredients of ingredients, …).
- **Raw-material calculator** — pick several target items with quantities and get the merged raw totals and total craft time.
- **"What can I craft?"** — reverse search: given the materials you own, see which items become craftable.
- **Versioned recipes** — recipes are tracked per game version.
- **Real-time global chat** — STOMP/WebSocket chat with avatars, message grouping, online presence, and pinned announcements.
- **Notifications** — real-time in-app notifications (access requests, approvals, …).
- **Admin panel** — manage items, categories, tags, game versions, images, users, and chat moderation.
- **Access requests** — ordinary users can request the `ADMIN` role; super-admins review and approve/reject.
- **Audit log** — privileged actions are recorded for super-admins.
- **Role hierarchy** — `SUPER_ADMIN > ADMIN > USER`, enforced via Spring Security `RoleHierarchy`.
- **i18n** — full UI in 4 locales: Uzbek (Latin), Uzbek (Cyrillic), Russian, English.
- **Hardening** — rate limiting on auth/chat, Actuator health/metrics, centralized error handling.

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Java 17, Spring Boot 3.4.4 (Web, Data JPA, Security, WebSocket, Validation, Cache, Actuator), Hibernate 6.6, Flyway, PostgreSQL, JJWT, springdoc-openapi |
| **Frontend** | React 18, TypeScript 5, Vite 5, TanStack Query, React Router, react-i18next, Tailwind CSS, framer-motion, @stomp/stompjs |
| **Testing** | JUnit 5 + Mockito + AssertJ (backend), Vitest + jsdom + Playwright E2E (frontend) |
| **CI/CD** | GitHub Actions → GHCR (Docker images) → Coolify |

## Architecture

A monorepo: a stateless Spring Boot REST + WebSocket API, a React single-page app, and a small
Python side-service that strips backgrounds from uploaded screenshots.

```
crafting-recipe-tree/
├── backend/                         # Spring Boot API
│   ├── src/main/java/com/crafttree/
│   │   ├── controller/              # REST endpoints + STOMP message mapping
│   │   ├── service/                 # Business logic
│   │   ├── repository/              # Spring Data JPA repositories
│   │   ├── entity/                  # JPA entities
│   │   ├── dto/                     # Request/response records
│   │   ├── config/                  # Security, JWT, WebSocket, CORS, rate limiting
│   │   └── exception/               # Global exception handling
│   └── src/main/resources/
│       ├── db/migration/            # Flyway migrations (V1 … V20)
│       └── application*.yml          # Base / dev / prod profiles
├── frontend/                        # React + Vite SPA
│   └── src/
│       ├── pages/  components/  hooks/  api/  utils/  contexts/
│       └── i18n/                    # uz, uz-cyr, ru, en
├── services/rembg/                  # Background-removal service (FastAPI + rembg)
├── scripts/                         # Image/upload sync utilities
└── .github/workflows/
    ├── ci.yml                       # CI + Docker build + deploy (backend, frontend)
    └── rembg.yml                    # Built only when services/rembg/** changes
```

- **Auth:** JWT bearer tokens. The token carries the username; authorities are loaded from the DB on every request, so role changes take effect immediately.
- **Persistence:** schema is owned by Flyway; Hibernate runs with `ddl-auto=validate`.
- **Image processing:** background removal runs in its own container ([`services/rembg`](services/rembg/README.md)) rather than inside the API. The ML stack (onnxruntime, scipy, numpy) is ~1.5 GB and would otherwise be pulled on every API deploy, for a feature only used when an admin uploads an item image. The API degrades gracefully: if the service is down or unset, the original image is kept and the upload still succeeds.

## Getting Started

### Prerequisites

- **JDK 17+**
- **Node.js 20+**
- **PostgreSQL 14+** (developed against 17)
- Maven (the bundled `mvnw` wrapper works too)

### 1. Database

Create a database and a user, then point the backend at it via environment variables (see [Environment Variables](#environment-variables)). Flyway applies all migrations automatically on startup.

### 2. Backend

```bash
cd backend
# uses the `dev` profile (application-dev.yml) → http://localhost:8089
./mvnw -Dspring-boot.run.profiles=dev spring-boot:run
```

> On Windows use `mvnw.cmd`. The default (no profile) port is `8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api`, `/uploads`, and `/ws` to the backend (default `http://localhost:8080` — override with `VITE_API_URL`).

## Testing

```bash
# Backend — JUnit 5 + Mockito
cd backend && ./mvnw test

# Frontend — Vitest (unit)
cd frontend && npm run test

# Frontend — Playwright E2E smoke (dev-server avtomatik ko'tariladi)
cd frontend && npm run test:e2e
```

All three suites run in CI on every push and pull request. Chat'ning real-time
oqimlari (WebSocket) backend ishlab turganda qo'lda E2E qilinadi — smoke testlar
backend'siz ham marshrutlash/render'ni tekshiradi.

## API Documentation & Monitoring

With the backend running:

- **Swagger UI:** `/swagger-ui.html`
- **OpenAPI spec:** `/api-docs`
- **Health:** `/actuator/health` (public; returns `UP` + liveness/readiness probes)
- **Metrics / info:** `/actuator/metrics`, `/actuator/info` (admin only)

## Deployment

Pushes to `main` trigger [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

1. **CI** — frontend (`npm test` + `npm run build`) and backend (`mvn clean test`) must pass.
2. **Build & push** — backend and frontend Docker images are built and pushed to GHCR.
3. **Deploy** — Coolify deploy webhooks are triggered for both apps.

Pull requests run the CI stage only (no build/deploy).

The background-removal service has its own pipeline,
[`.github/workflows/rembg.yml`](.github/workflows/rembg.yml), which runs **only when
`services/rembg/**` changes** — its image is large (ML stack), so ordinary backend and
frontend deploys must not depend on it.

### Uploads volume ownership (one-time, per environment)

The backend runs as non-root (`appuser`, uid **1001**) and writes uploaded item images to
the `uploads` volume. A Docker named volume inherits ownership from the image **only on the
first mount while it is still empty** — so a volume that was populated *before* the container
switched to non-root stays owned by `root` and the `chown` in the Dockerfile never applies to
it. Uploads then fail with:

```
java.nio.file.AccessDeniedException: uploads/<id>_original_<ts>.png
```

Note this surfaces on the *original file save*, before background removal — so the
rembg service is not the cause even though the error appears when the "remove background"
option is used. Fix once, on the host:

```bash
V=$(docker inspect <backend-container> \
    --format '{{range .Mounts}}{{if eq .Destination "/app/uploads"}}{{.Source}}{{end}}{{end}}')
chown -R 1001:999 "$V"
docker exec <backend-container> sh -c 'touch /app/uploads/.w && rm /app/uploads/.w && echo OK'
```

Fresh environments are unaffected: an empty volume inherits the correct ownership on first
mount.

### Database backup & restore

A **SUPER_ADMIN** can take a full backup of the database and restore from one at
**Admin → Database backup** (`/admin/backup`). This is a real `pg_dump` custom-format
archive — schema, every table, sequences and the Flyway history — not a content export
(for items/recipes only, see *Portage* instead).

The backend image installs `postgresql-client` from its own base-image repository (currently
PostgreSQL 18). `pg_dump` must not be **older** than the server — newer is fine — so this
covers production (PostgreSQL 16) and local dev (17.x). The status card on the page shows
both versions, so a mismatch is visible before you rely on a backup.

Two things worth knowing:

- **Restore replaces the database.** A backup of the current state is taken automatically
  first and its filename is reported — that is the point of return. The restore itself runs
  in a single transaction, so a failure leaves the database untouched.
- **Restart the app afterwards.** The running process may still hold the pre-restore schema.

Backups are written to the `backups` volume, deliberately **outside** `uploads/` — the
uploads path is served publicly and a dump contains password hashes and chat history.
Downloaded files are removed from the server once the transfer finishes; only the
pre-restore safety copy is kept.

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL connection | `localhost`, `5432`, `crafttree` |
| `DB_USERNAME`, `DB_PASSWORD` | DB credentials | `postgres` / `postgres` |
| `JWT_SECRET` | Base64-encoded JWT signing key | dev fallback present |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |
| `SERVER_PORT` | HTTP port | `8080` |
| `REMBG_URL` | Background-removal service URL ([`services/rembg`](services/rembg/README.md)). Empty disables the feature — uploads then keep the original image. | empty (dev), `http://rembg:8000` (prod) |
| `REMBG_TIMEOUT_SECONDS` | Read timeout for that service | `120` |
| `BACKUP_DIR` | Where database backups are written. Must stay outside `uploads/` — that path is publicly served. | `backups` |
| `PG_BIN_DIR` | Directory holding `pg_dump`/`pg_restore` when they are not on `PATH` (e.g. local Windows dev). | empty (use `PATH`) |

### Frontend (build-time)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Public backend URL in production (also used to derive the WebSocket URL). When unset, same-origin is used. |
| `VITE_API_URL` | Backend target for the dev-server proxy. |

> **Note:** never commit real secrets. Production values are provided as deploy-time environment variables / CI secrets.

## License

Proprietary — all rights reserved.
