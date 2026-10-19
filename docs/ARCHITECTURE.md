# Architecture

A single, modular Next.js 16 (App Router, React 19, TypeScript) application. There are no microservices: the presentation layer, server actions and route handlers all call plain service modules that take a `Db` handle, so the same code runs in requests, scripts and tests.

```
src/
  domain/        Pure logic, no I/O: content schema (Zod), validation, scoring, timing, shuffle, rubrics,
                 recommendations, study planning, exam spec + scoring config defaults, snapshot types
  server/        Services: db (Drizzle schema + client), exam-engine, snapshots, seed, analytics, review,
                 study-plan, catalog, prompts, admin, grading/{service,anthropic,openai,types}, identity,
                 admin-auth, ops (audit, rate limit, active config), maintenance (retention), audio-upload
  app/           Routes. (site) public pages · (app) learner workspace · attempt/[id] exam runner + results
                 · admin/(protected) admin · api/{recordings,me/export,cron/maintenance} · actions/* server actions
  components/    UI kit (tokens), app/site shells, exam runner, recorder, audio player, charts, feedback views
  i18n/          vi/en dictionaries (UI only; exam content is never machine-translated)
  proxy.ts       Issues the signed anonymous learner cookie
content/         Version-controlled original content (TS/JSON) + audio manifest — the source of truth for seeding
drizzle/         SQL migrations
scripts/         migrate, seed, validate-content, generate-audio
tests/           unit (domain) + integration (services on in-memory Postgres)
```

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.4 + React 19.3 | Server Components; server actions for mutations (built-in Origin check gives CSRF protection) |
| Database | PostgreSQL via Drizzle ORM 0.45 | `DATABASE_URL` → node-postgres. Without it, dev uses file-backed **PGlite** and tests use in-memory PGlite (same SQL and migrations) |
| Validation | Zod 4 | All action inputs, content files, configs and AI outputs |
| Styling | Tailwind CSS 4 with semantic CSS-variable tokens | Light/dark/system themes by swapping tokens |
| AI | Anthropic Claude (rubric feedback, structured output via `messages.parse` + Zod), OpenAI speech-to-text | Behind `WritingGrader` / `SpeakingGrader` / `Transcriber` interfaces |
| Audio | MP3 in `public/audio` (lamejs encoder); Windows SAPI for dev, OpenAI TTS option for production | Every asset carries `generationMethod` + `qualityStatus` |
| Recordings | Postgres `bytea` (`blobs` table), streamed by an owner-checked route | Private by construction; no extra storage service needed |

## Data model (main tables)

- **Learners:** `learners`, `learner_preferences`
- **Specification and provenance:** `sources`, `exam_specifications` (versioned JSON, one active), `scoring_configs` (versioned, one active), `rubrics`
- **Bank:** `passages`, `transcripts`, `audio_assets`, `questions`, `question_options`, `answer_keys` (evidence `{ref, quote}`, distractor notes, vocabulary), `writing_prompts`, `speaking_prompts`. Every content row has `provenance_type`, `license_status`, `source_id`, `status` (draft → validated → reviewed → published → archived) and `version`.
- **Assembly:** `test_blueprints` → `test_sections` → `test_items`; `blueprint_snapshots` holds the immutable `public_payload` and `protected_payload` per blueprint version.
- **Attempts:** `exam_attempts`, with a partial unique index of one in-progress attempt per learner, blueprint and mode. Also `attempt_sections` (per-section `started_at`/`deadline_at`/`submitted_at`), `attempt_answers` (PK attempt + question), `listening_plays`.
- **Productive skills:** `writing_submissions` (unique per attempt + prompt), `speaking_submissions`, `blobs`.
- **Learning:** `mistake_bookmarks`, `vocabulary_notes`, `study_plan_tasks`.
- **Operations:** `audit_logs`, `rate_limits`.

Analytics are **derived** at read time from attempts and submissions; nothing is cached, so no aggregate can drift. If performance ever requires materialised aggregates, refresh them in the same transaction as `recomputeSummary`.

## Exam engine (`src/server/exam-engine.ts`)

- `startAttempt` — idempotent. It returns the existing in-progress attempt, and concurrent starts are resolved by the partial unique index. It pins the latest snapshot and starts section 0. In exam mode it also sets the deadline.
- `getAttemptView` — enforces deadlines lazily, then returns the public snapshot, the learner's answers and remaining time computed from server timestamps. It filters protected material by the **release policy**: in exam mode everything is released after the whole attempt; in practice mode, a section's keys and transcripts are released once that section is closed.
- `saveAnswer` / `saveWritingDraft` / `toggleMark` — the attempt must belong to the learner and still be open, the item must be in the *current* section, and the option must be valid. A save is accepted up to 5 s past the deadline (network grace); after that it fails with `expired`.
- `advanceSection` — idempotent via `expectedSection` and a conditional update. The next section's clock starts when it is reached.
- `submitAttempt` — idempotent. The first conditional `UPDATE … WHERE status='in_progress'` wins; it grades objective items and stores the `score_summary` (raw, accuracy, by type and difficulty, estimates, band only when all four skills have estimates).
- `recomputeSummary` — runs again after asynchronous Writing/Speaking grading (`after()` in Next.js).
- `registerPlay` — counts listening plays server-side; exam mode allows `strictPlaysAllowed` (default 1).
- `getPracticeTranscript` — practice mode only, and only after at least one play. Exam mode gets transcripts only after the attempt ends.

## Grading (`src/server/grading`)

1. A submission is saved first, so grading can never lose it.
2. `gradeWritingSubmission` claims the job with a conditional update (no double billing), applies the per-learner daily quota (`AI_DAILY_LIMIT_PER_LEARNER`), then calls the provider.
3. The Anthropic grader asks for structured output against a Zod schema. The result is re-validated, scores are clamped to 0–10 and rounded to 0.5, rubric keys must all be present, and any correction whose `original` is not a verbatim substring of the learner text is dropped.
4. Statuses: `graded`, `unavailable` (no key, recording-only consent, or invalid key) and `failed` (timeout, rate limit, malformed output, refusal), each with a safe message and a retry button. No numeric score is ever stored without a successful grading.
5. Speaking: transcription (OpenAI) runs first, and only with `ai_processing` consent; Claude then grades from the transcript. **Pronunciation is never machine-scored**, and learners self-assess it with a checklist.
6. Each result stores its model and prompt version (`grading_model_version`) and its `rubric_version`.

## Security model

- Identity: learners sign in at `/start` with a name only (no password, by product decision). `findOrCreateByUsername` maps the normalised name to a learner row (unique index, race-safe), and a signed cookie (Web Crypto HMAC-SHA256, constant-time verify) remembers the learner id. Workspace pages and actions call `requireLearner()`, which redirects to `/start?next=…` when no valid name is signed in; `proxy.ts` only forwards the requested path. Anyone who knows a name can open that profile; sign-in is rate-limited per IP (30 per 10 min). Every service call takes the learner id and checks ownership, and returns `not_found` for other learners' rows so their existence isn't revealed.
- Admin uses a passphrase from the environment, a signed `httpOnly` `SameSite=Strict` session cookie valid for 8 hours, and a rate-limited login (10 attempts per 15 min per IP). The protected layout calls `requireAdmin()`, **and every admin action re-checks it**. Admin actions are written to `audit_logs`.
- Answer keys, transcripts, sample answers and model answers are only in the protected snapshot payload and are never sent before release. Bookmarks require a finished attempt that contains the question, because the notebook shows keys.
- Recording uploads are checked by size (≤ 10 MB), magic-byte sniffing (declared type must match), duration, a per-learner rate limit, and consent. Recordings are streamed only to their owner, with `Cache-Control: private, no-store`.
- Security headers include CSP (`default-src 'self'`), `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, and a Permissions-Policy that allows the microphone only on this origin.
- Retention: recordings are deleted after 180 days and learners inactive for 24 months are removed (`/api/cron/maintenance`). Learners can export (`/api/me/export`) or delete all their data from Settings.
- Known gaps are listed in the final report and in docs/DEPLOYMENT.md under "Hardening checklist".
