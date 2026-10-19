# Deployment guide

Any Node.js host that runs Next.js works. These steps assume **Vercel + Neon (or Supabase) Postgres**; the same steps apply to Render, Railway, Fly.io or a VPS.

## 1. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres 14+. For Neon, use the **pooled** connection string with `sslmode=require` |
| `SESSION_SECRET` | recommended | ≥ 32 random chars. If unset, a key derived from `DATABASE_URL` is used. Changing it signs learners out (they sign in again with their name) |
| `ADMIN_PASSWORD` | optional | ≥ 12 chars. Without it the admin area stays locked; the learner site is unaffected |
| `CRON_SECRET` | yes | Protects `/api/cron/maintenance` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | optional | Writing/Speaking feedback. Without the key, grading is shown as "unavailable" |
| `OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_TTS_MODEL` | optional | Speech-to-text for Speaking; production TTS for listening audio |
| `AI_DAILY_LIMIT_PER_LEARNER` | optional | Default 10 AI gradings per learner per day |
| `SUPPORT_EMAIL` | optional | Shown on /contact |
| `DB_POOL_MAX` | optional | Default 5 (keep low on serverless) |

Never commit `.env*` files; only `.env.example` is tracked.

## 2. Database

1. Create a Postgres database (for example a Neon project in the Singapore region).
2. Run the migrations from a trusted machine or CI:

```bash
npm run db:migrate
```

(with `DATABASE_URL` exported to point at the target database).

3. Seed the content. This validates everything first, then upserts it and publishes the test snapshots:

```bash
npm run db:seed
```

Seeding is idempotent and safe to repeat. Questions edited in the admin (version > 1) are kept unless you pass `--force`. Existing attempts are never changed, because they reference immutable snapshots.

Schema changes: edit `src/server/db/schema.ts`, run `npm run db:generate`, review the SQL in `drizzle/`, commit it, then run `db:migrate` **before** deploying the code that needs it.

## 3. Listening audio

`public/audio/*.mp3` is committed and served statically. The committed files are **Windows SAPI development audio**: intelligible synthetic voices, labelled as such in the UI, with every asset's `quality_status` set to `unreviewed`. Before real learners use them:

1. Regenerate with a production TTS provider (requires `OPENAI_API_KEY`):

```bash
npm run audio:generate -- --provider openai --force
```

or replace the files with studio recordings, and update `content/audio-manifest.json` accordingly.

2. Run `npm run db:seed` so the database picks up the new durations and generation method.
3. In `/admin/audio`, listen to each file against its transcript and set **approved** or **rejected**.

## 4. Deploy (Vercel)

1. Import the repository and set the environment variables for Production (and Preview, with a separate database).
2. `vercel.json` pins `"framework": "nextjs"` and the build command `npm run vercel-build` ([scripts/vercel-build.ts](../scripts/vercel-build.ts)). It fails a production build that lacks `DATABASE_URL`, then runs `db:migrate` and `db:seed` (both idempotent) before `next build`, so the database is always ready for the new code. If the project was first imported with another preset, the earlier deployment shows Vercel's own `404 NOT_FOUND` page; redeploy after pulling this file. Also check that **Settings → Build and Deployment → Framework Preset** reads Next.js.
3. `vercel.json` registers the daily retention cron. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
4. Server actions accept up to 12 MB request bodies (configured in `next.config.ts`) for speaking uploads. Make sure your host's request limit is at least that, and on Vercel use a plan whose function body limit allows it.
5. HTTPS and the domain are configured in the host dashboard. The app sets `Secure` cookies in production.

## 5. First admin login

Visit `/admin/login` and enter `ADMIN_PASSWORD`. Then check:

- `/admin/validation` shows 0 errors
- `/admin/audio`: review the audio
- `/admin/scoring`: confirm the active spec and scoring config
- `/admin/sources`: re-verify links (the "last verified" dates)

## 6. Monitoring and logs

- Server errors from actions are logged as `[action error]`, and grading failures as `grading`. Forward host logs to your log tool (for example Vercel Log Drains → Datadog or Sentry).
- Recommended: add Sentry (`@sentry/nextjs`) for error reporting. This is not included, to avoid an unconfigured dependency.
- Watch the AI spend in the provider dashboards; the per-learner daily cap limits abuse.

## 7. Backup and restore

- Neon/Supabase provide point-in-time recovery; enable it, with at least 7 days of retention.
- Logical backups:

```bash
pg_dump --format=custom --no-owner "$DATABASE_URL" -f vstep-backup.dump
```

- Restore into an empty database:

```bash
pg_restore --no-owner --dbname "$TARGET_DATABASE_URL" vstep-backup.dump
```

- Test a restore at least once per quarter. Recordings live in the database, so a database backup covers them.

## 8. Rollback

- **Code:** redeploy the previous build (Vercel "Promote to Production").
- **Migrations:** they are forward-only SQL. Write a reverting migration if you need to undo one. Because migrations run before code deploys, keep each change backwards compatible for one release (add columns first, remove them later).
- **Content:** revert the commit in `content/` and run `db:seed`. Snapshots are versioned, so new attempts use the restored version and existing attempts keep theirs. A bad scoring or spec config can be rolled back in `/admin/scoring` by activating the previous version.

## Hardening checklist (before public launch)

- [ ] Production TTS or recorded audio, human-approved in `/admin/audio`
- [ ] Pedagogical review of all items by qualified VSTEP teachers (record the reviewer in `reviewed_by`)
- [ ] `npm audit` clean, or each finding risk-accepted
- [ ] Error monitoring connected
- [ ] Load test of autosave and submission on the target database tier
- [ ] Legal review of the privacy notice and terms for Vietnamese personal-data rules (Decree 13/2023/NĐ-CP)
