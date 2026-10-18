# VSTEP Prep — VSTEP.3–5 (B1–C1) practice platform

A web application for preparing for the Vietnamese Standardized Test of English Proficiency (VSTEP.3–5). It offers full four-skill mock exams in the format of **Quyết định 729/QĐ-BGDĐT**, level-specific practice for Reading and Listening, Writing and Speaking workspaces with rubric-based feedback, and progress analytics built from each learner's own records.

The interface is in Vietnamese (English available); exam content is in English. All test content is **original** and simulates the official format. It is **not** official VSTEP material, and scores are clearly labelled as practice estimates.

## Quick start (local development)

Requirements: Node.js ≥ 20.9 (tested with Node 24.20). Windows is needed only to regenerate the development audio.

```bash
npm install
```

```bash
copy .env.example .env.local
```

Set `SESSION_SECRET` (≥ 32 chars) and `ADMIN_PASSWORD` (≥ 12 chars) in `.env.local`. Leave `DATABASE_URL` empty to use the embedded PGlite database in `.data/pglite`.

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000. The admin area is at `/admin` and uses the `ADMIN_PASSWORD` passphrase.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js development, production build, production server |
| `npm run lint` / `typecheck` | ESLint (Next core-web-vitals + TS) / `tsc --noEmit` |
| `npm test` | Vitest unit + integration tests (integration uses in-memory Postgres via PGlite) |
| `npm run content:validate` | Validates all content: schema, verbatim evidence quotes, answer/explanation consistency, blueprint vs exam spec, provenance |
| `npm run db:generate` | Generates a SQL migration from `src/server/db/schema.ts` (drizzle-kit) |
| `npm run db:migrate` | Applies migrations to `DATABASE_URL` (or local PGlite) |
| `npm run db:seed` | Validates content, then upserts it and publishes immutable test snapshots (`--force` overwrites admin-edited items) |
| `npm run audio:generate` | Renders listening scripts to `public/audio/*.mp3` (`--provider sapi` on Windows for dev audio, `--provider openai` with `OPENAI_API_KEY`; `--force`, `--only <id>`) |
| `npm run check` | lint + typecheck + tests + content validation + build |

## Documentation

- [docs/SPECIFICATION_RESEARCH.md](docs/SPECIFICATION_RESEARCH.md) — verified VSTEP format, sources, discrepancies, unverified assumptions
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — modules, data model, exam engine, grading, security model
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — production setup, migrations, seeding, backups, rollback
- [docs/API.md](docs/API.md) — server actions and route handlers
- [docs/CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md) — writing and reviewing items, audio, provenance rules
- [docs/TESTING.md](docs/TESTING.md) — test strategy, what is covered, manual verification checklist

## Key design decisions

- **No accounts (by request).** Each browser gets an anonymous, HMAC-signed learner id in an httpOnly cookie. All learner data is scoped to that id on the server. Clearing cookies starts a fresh profile.
- **Server-authoritative timing.** Section deadlines are stored in the database; expiry is enforced on every read and write. The client countdown is display-only.
- **Immutable snapshots.** A started attempt always uses the exact test version it began with; answer keys and transcripts live in a separate protected payload and are released only according to the mode's release policy.
- **Honest scoring.** The 0–10 scale, 0.5 rounding and band table come from QĐ 729. The Reading/Listening raw→0–10 conversion is a documented linear estimate (no official table is public). Writing/Speaking scores are AI estimates against a versioned practice rubric. With no API keys, nothing is scored and the status says so.
