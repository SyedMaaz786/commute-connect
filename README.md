# CommuteConnect

A mini carpool coordinator — post commute routes you're offering or looking for, browse and filter
what others have posted, and express interest in the ones that match. Built for the CommuteConnect
take-home assignment (Frontend-Focused Full Stack Developer Intern).

**Live app:** https://commute-connect-gray.vercel.app
**Live API:** https://commuteconnect-api-v2.onrender.com/api
**Time spent:** Approximately 12 hours over 3 days (4 hours each day).

**Video walkthrough:** [Complete feature walkthrough](https://drive.google.com/file/d/1OD5pWwmKCUM-vFYsW_D8TjgiizMXACM5/view?usp=sharing) — a short walkthrough of the app and a technical decision I'm proud of.

> The API is hosted on Render's free tier, which spins down after inactivity. The first request after
> a while can take 30–60 seconds to wake up — that's the server cold-starting, not a bug.

---

## Tech stack

| Layer         | Choice                                                          |
| ------------- | --------------------------------------------------------------- |
| Frontend      | Angular 22 (standalone components, Signals, no NgModules)       |
| Backend       | NestJS 12 (ESM, modular)                                        |
| Database      | PostgreSQL, accessed via TypeORM (migrations, no `synchronize`) |
| Auth          | JWT (Passport strategy), bcrypt password hashing                |
| Frontend host | Vercel                                                          |
| Backend host  | Render (Docker)                                                 |
| DB host       | Neon (managed Postgres)                                         |

---

## Running it locally

You need Node.js 22.22.3+, 24.15+, or 26+ (Angular's CLI enforces one of these ranges) and either
Docker, or a local Postgres instance.

### Option A — Docker Compose (easiest, one command)

```bash
cp .env.example .env    # first time only — credentials for the local Postgres container
docker compose up --build
```

This starts Postgres, the backend (`http://localhost:3000/api`), and the frontend
(`http://localhost:4200`) together, with source directories volume-mounted for hot reload. First time
only, run the migration once the containers are up (from a second terminal — the backend container
already has the right `DATABASE_URL` baked in via `docker-compose.yml`):

```bash
docker compose exec backend npm run migration:run
```

### Option B — run each app directly

**Backend**

```bash
cd backend
cp .env.example .env      # then edit DATABASE_URL to point at your Postgres
npm install
npm run migration:run     # builds + applies the schema
npm run start:dev         # http://localhost:3000/api
```

If you don't have Postgres running anywhere yet, the quickest path is
`docker compose up -d postgres` (from the repo root) — that gives you a Postgres instance on
`localhost:5433` with credentials matching `backend/.env.example` out of the box.

If PostgreSQL is already installed on your machine, you can instead run `npm run db:local`
from `backend/`. This starts a separate workspace database on port 5433 using your local `.env`
credentials, leaving an existing PostgreSQL service alone. Set `POSTGRES_BIN` if its executables
are not on PATH (Windows installations under Program Files are detected automatically).
Run `npm run db:stop` to stop this workspace database. Its local data is ignored by Git.

**Frontend**

```bash
cd frontend
npm install
npm start                 # http://localhost:4200
```

### Running the tests

```bash
cd backend && npm test && npm run test:e2e   # unit + e2e (e2e needs .env.test — see below)
cd frontend && npm test                       # unit tests
```

The backend e2e suite runs against a _separate_ database so it never touches your dev data. Create it
once and point `backend/.env.test` at it:

```bash
psql -U <user> -h localhost -p 5433 -c "CREATE DATABASE commuteconnect_test;"
DATABASE_URL=postgresql://<user>:<password>@localhost:5433/commuteconnect_test npm run migration:run
```

(use whatever `POSTGRES_USER`/`POSTGRES_PASSWORD` you set in your local `.env`)

For the installed-PostgreSQL helper, create `backend/.env.test` with the same local connection
settings as `backend/.env` but a database name of `commuteconnect_test`. From `backend/`, run
`npm run db:local`, then `npm run migration:test`, then `npm run test:e2e`. Tests refuse a database
name that does not end in `_test` and clean up the users/posts they create. Unit tests need no database.

---

## Environment variables

**`backend/.env`** (see `backend/.env.example`)

| Variable         | Purpose                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`   | Postgres connection string                                                     |
| `DB_SSL`         | `true` in production (Neon/most managed Postgres require SSL), `false` locally |
| `JWT_SECRET`     | Signing secret for access tokens — generate one, don't reuse the example       |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d`                                                      |
| `PORT`           | Port the API listens on                                                        |
| `CORS_ORIGIN`    | The deployed frontend's origin (so the browser is allowed to call the API)     |

Generate a real secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**`frontend/src/environments/environment.prod.ts`**

| Field    | Purpose                                          |
| -------- | ------------------------------------------------ |
| `apiUrl` | The deployed backend's URL, with `/api` appended |

Angular bakes this in at build time via `fileReplacements` (see `angular.json`) — there's no runtime
env var for a static SPA build, so this file has to be edited (and rebuilt/redeployed) whenever the
backend URL changes.

None of the real secrets are committed — only `.env.example`.

---

## Architecture

```
backend/
  src/
    auth/        JWT strategy, guard, register/login/me
    users/       user lookups (kept separate from auth so it's independently testable/reusable)
    posts/       commute post CRUD, pagination, search, ownership checks
    interests/   express/withdraw interest, "who's interested," "my interests"
    common/      shared base entity, exception filter, pagination types, decorators
    database/    TypeORM DataSource + hand-written migrations

frontend/
  src/app/
    core/        services, interceptors, guards, models — the app's "backend of the frontend"
    shared/ui/   button, card, form-field, spinner, empty-state, error-state, toast,
                 confirm-dialog, pagination, badge — every screen composes these, none of
                 them are copy-pasted
    layout/      navbar + shell (the authenticated app frame)
    features/    auth, posts, dashboard — one folder per screen area, each split into a
                 "smart" page component (owns data/state) and small presentational
                 components underneath it (post-card, filter-bar)
```

### State management: Signals + plain services, not NgRx

Each page component (`PostList`, `PostDetail`, `MyPosts`, …) owns its own `loading` / `error` / `data`
signals and calls a thin, stateless `PostsService`/`InterestsService` (just `HttpClient` wrappers) to
fetch. Browse cancels an earlier request when filters or pagination change, so an old response cannot
replace newer results. The detail page keeps failed interest lookups separate from a real empty list
and lets the user retry. `AuthService` holds shared state — `currentUser` as a signal
and exposes an `isAuthenticated` computed, which the navbar, guards, and interceptor all read.

I considered NgRx and skipped it. This app has three resources and no state that's shared across more
than a couple of unrelated components — NgRx's actions/reducers/effects ceremony would be pure
overhead here, not clarity. Signals keep template state reactive with little boilerplate; HTTP request
subscriptions still need their own cancellation and lifecycle handling. If this app grew to have
deeply nested state shared across many unrelated feature areas (real-
time updates, optimistic multi-entity caches, etc.), I'd revisit NgRx or a signal-store library at that
point — not before.

### Backend module boundaries

`AuthModule` exports `PassportModule` so `JwtAuthGuard` can be used from `PostsModule` and
`InterestsModule` without each of them re-registering Passport. `InterestsModule` imports
`PostsModule` and calls `PostsService.findOne()` directly rather than duplicating a post-lookup query,
so "does this post exist" and "who owns it" only have one implementation.

---

## Key decisions & trade-offs (and the assumptions I made where the spec was open-ended)

- **A commute post has a `type`: `OFFERING` or `LOOKING`.** The spec says users post routes they're
  "offering or looking for" but doesn't define the data model — I made this an explicit enum column
  (a real Postgres enum, not just app-level validation) rather than inferring intent from other
  fields. The type drives filtering and badges. Users can express interest in either type of post:
  joining an offered ride or connecting with someone looking for one.
- **"Interested" is a row's existence, not a status field.** No `PENDING`/`ACCEPTED`/`DECLINED` — the
  spec only asks for expressing and withdrawing interest, not a full acceptance workflow. Adding
  status would be speculative scope beyond what's asked.
- **Owners can't express interest in their own post** — not explicitly stated, but the obvious
  intended behavior for a matching feature, enforced server-side (400) and hidden client-side.
  Duplicate interest is blocked the same way (409).
- **JWT is access-token-only — no refresh token rotation.** A single token with a 1-day expiry is
  enough to demonstrate the auth flow properly (hashing, guards on both sides, protected routes) without
  adding a refresh-token/rotation/blacklist system that the assignment doesn't ask for. Noted below as
  the first thing I'd add with more time.
- **Password hashing uses `bcryptjs`, not `bcrypt`.** Same algorithm, pure JS instead of a native
  addon — one less thing that can fail to compile in a constrained container build (Render, Alpine,
  whatever), for identical security properties at this scale.
- **UUIDs are generated in application code** (`crypto.randomUUID()` in a `@BeforeInsert` hook), not by
  a Postgres extension default — see `docs/schema.md` for why.
- **NestJS is on ESM** (the current `@nestjs/cli` default) — every relative import in the backend needs
  a `.js` extension even though the source is `.ts`. Slightly unusual to read the first time; it's what
  `nest new` scaffolds today.
- **Global validation is strict**: `whitelist + forbidNonWhitelisted + transform` — any field the DTO
  doesn't declare is rejected outright, not silently dropped or accepted.
- **Search is case-insensitive substring match** (`ILIKE %term%`) on origin and destination
  independently, combinable with the type filter. No fuzzy/typo-tolerant matching or geocoding — a
  real "same commute corridor" matching engine is a project on its own, out of scope here.
- **No external UI component library.** Every input, button, card, spinner, empty/error state, toast,
  and dialog is hand-built (`frontend/src/app/shared/ui`) rather than pulled from Angular Material or
  similar — slower to build, but it's the part of the assignment weighted highest (frontend polish),
  so I wanted it to be visibly my own design system rather than a default theme.

## What I'd do differently with more time

- Refresh tokens with rotation, instead of a single long-lived access token.
- Rate limiting on `/auth/login` and `/auth/register` (I looked at `@nestjs/throttler`, but its
  published version doesn't yet declare a peer-dependency range compatible with the NestJS version
  this scaffolds today — not worth forcing with `--legacy-peer-deps` for a bonus hardening feature).
- Real-time updates (WebSocket or SSE) so a post owner sees a new interested rider without refreshing.
- Geolocation- or corridor-based matching instead of exact substring search on origin/destination.
- Soft deletes + an audit trail, instead of hard deletes cascading through posts and interests.
- Broader browser automation for keyboard navigation and mobile layouts. Current coverage includes
  20 frontend unit tests, 22 backend unit tests, and 3 API integration tests covering auth, matching,
  ownership, editing, filtering, withdrawal, and deletion.

---

## Deployment

### 1. Database — Neon

1. Create a free project at Neon, grab the pooled connection string.
2. Add `?sslmode=require` if it isn't already there.
3. Run the migration against it once, from your machine:
   ```bash
   DATABASE_URL="<your neon connection string>" DB_SSL=true npm run migration:run
   ```
   (run from `backend/`).

### 2. Backend — Render

1. New Web Service → connect this repo → set the root/context to `backend/` → Render will detect
   `backend/Dockerfile` automatically (or point it there manually).
2. Environment variables: `DATABASE_URL` (from Neon), `DB_SSL=true`, `JWT_SECRET` (a freshly generated
   one — not the local dev one), `JWT_EXPIRES_IN=1d`, `PORT=3000`, `CORS_ORIGIN` (set this once you
   know the Vercel URL from step 3, then redeploy).
3. Health check path: `/api/health`.

`render.yaml` at the repo root describes this as a blueprint if you'd rather import it directly.

### 3. Frontend — Vercel

1. Import the repo, set the project root to `frontend/`.
2. Before deploying (or building locally to push a dist), put the real Render URL into
   `frontend/src/environments/environment.prod.ts` → `apiUrl` (with `/api` on the end) — Angular bakes
   this in at build time, there's no runtime env var for a static build.
3. Vercel picks up `frontend/vercel.json` automatically (build command, output directory, and the SPA
   rewrite so client-side routes don't 404 on refresh).
4. Once deployed, copy the Vercel URL back into Render's `CORS_ORIGIN` and redeploy the backend.

---
