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
| **Testing** | JUnit 5 + Mockito + AssertJ (backend), Vitest + jsdom (frontend) |
| **CI/CD** | GitHub Actions → GHCR (Docker images) → Coolify |

## Architecture

A two-app monorepo: a stateless Spring Boot REST + WebSocket API and a React single-page app.

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
├── scripts/                         # Image/upload sync utilities
└── .github/workflows/ci.yml         # CI + Docker build + deploy
```

- **Auth:** JWT bearer tokens. The token carries the username; authorities are loaded from the DB on every request, so role changes take effect immediately.
- **Persistence:** schema is owned by Flyway; Hibernate runs with `ddl-auto=validate`.

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

# Frontend — Vitest
cd frontend && npm run test
```

Both suites run in CI on every push and pull request.

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

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL connection | `localhost`, `5432`, `crafttree` |
| `DB_USERNAME`, `DB_PASSWORD` | DB credentials | `postgres` / `postgres` |
| `JWT_SECRET` | Base64-encoded JWT signing key | dev fallback present |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |
| `SERVER_PORT` | HTTP port | `8080` |

### Frontend (build-time)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Public backend URL in production (also used to derive the WebSocket URL). When unset, same-origin is used. |
| `VITE_API_URL` | Backend target for the dev-server proxy. |

> **Note:** never commit real secrets. Production values are provided as deploy-time environment variables / CI secrets.

## License

Proprietary — all rights reserved.
