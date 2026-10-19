# Testing

```bash
npm test
```

runs the Vitest unit and integration suites. Integration tests run real SQL against an **in-memory PostgreSQL (PGlite)** using the production migrations and seed code; no external services are needed.

## Automated coverage

**Unit (`tests/unit/domain.test.ts`)**
- 0.5 rounding, including float-noise handling
- objective grading by type and difficulty
- linear and table estimates
- QĐ 729 band edges, and the overall estimate requiring all four skills
- writing task weights
- word counting, paragraph splitting, quote matching
- deadlines and grace window, state transitions
- item validation: fabricated quotes, missing units, duplicate options, contradictory or letter-referencing explanations, the article "a" vs option A
- deterministic shuffle: key integrity and an even A–D spread
- recommendations require evidence
- study plan
- HMAC signing and tamper rejection
- audio magic-byte sniffing and rejection of disguised files

**Integration (`tests/integration/*.test.ts`)**
- Seeding produces a mock snapshot that matches the spec (35/40 questions; 40/60/60/12 minutes)
- No answer keys, explanations, transcripts or model answers in the public payload
- Re-publishing unchanged content reuses the same snapshot
- Starting is idempotent, including under concurrent requests
- Answers persist across reloads; keys are hidden until submission; grading counts; idempotent re-submit; saving after submit is rejected
- Wrong-section and invalid-option saves are rejected
- Server-side deadline expiry: lazy auto-advance, late saves rejected, grace window, auto-submit with `time_expired`
- Section advance is idempotent
- Practice-mode per-section release vs exam-mode release at the end
- Another learner cannot read, save to, submit or get transcripts for an attempt (`not_found`)
- Transcripts are protected in exam mode and need one play in practice mode; play limits apply only in exam mode
- Snapshot immutability: bank edits don't change started attempts, and new attempts get the new version
- Writing drafts are scoped to their section and submitted with the attempt
- Writing grading: "unavailable" without keys (no fabricated score); structured results with model and rubric versions; failure then retry; daily quota; ownership
- Speaking: recording-only consent sends nothing to providers; with consent it transcribes then grades; pronunciation is never machine-scored
- The dashboard is empty for new learners and built from stored attempts
- The overall band appears only with all four skill estimates; empty writing counts as 0
- Retention deletes old recordings but keeps transcript and feedback

Providers are replaced with fakes via `setProvidersForTests`; no paid API calls are made in tests.

## Content validation

```bash
npm run content:validate
```

checks every item and test against the exam spec. Run it in CI; the seed refuses to run if it reports errors.

## Manual verification performed (2026-10-18, built-in browser against `npm run dev`)

- Home, guide, catalog, sources and legal pages render
- Reading practice: start → answer → autosave → reload keeps answers → confirm dialog with unanswered warning → submit → results with keys, explanations, evidence paragraphs, type breakdown
- Strict mock: server countdown, audio loads and plays, plays left drops to 0 and persists after reload, timer keeps running after reload (resume)
- Writing practice: autosave, submit, "automatic grading unavailable" status with no score, retry button, sample response
- Dashboard built from the persisted sessions, in-progress attempt with Resume, weekly plan auto-completion
- Admin: unauthenticated `/admin/*` redirects to login; login works; live validation shows 0 errors (60 warnings = unreviewed dev audio); all admin pages return 200
- 30+ routes smoke-tested for server errors; a mock-only writing prompt URL shows not-found with no content leak
- Mobile (375 px) exam layout
- Speaking: microphone denial shows a clear message. **Actual recording and upload could not be tested** because the test browser blocks microphone capture.

## End-to-end tests (Playwright)

```bash
npm run test:e2e
```

This runs `tests/e2e/learner-journeys.spec.ts` in the installed **Microsoft Edge** (set `E2E_CHANNEL=chrome` or `chromium` to change browsers). It uses a fresh, seeded database in `~/.vstep-prep/e2e-db` and test-only secrets, and Chromium's fake media flags provide a microphone. Last run (2026-10-19): **9 passed**.

1. Visitors without a sign-in name are redirected to `/start` and returned afterwards; names are case-insensitive
2. Reading practice: answer, autosave, reload, submit, results with explanations and highlighted evidence, mistake notebook, dashboard updated
3. Mock overview, then practice mode, then jumping straight to Reading
4. Strict mock exam: server timer, fixed section order, no answer keys in the page HTML
5. Listening practice: audio plays; the transcript is locked until one play
6. Writing practice: autosave and submit; with no AI key the status reads "unavailable" and no score is shown
7. Speaking practice: record with the fake mic, explicit consent required, upload, playback; another learner gets 404 for the recording
8. Another learner cannot open someone else's attempt
9. Admin: unauthenticated redirect, wrong passphrase rejected, login works, live content validation shows 0 errors

## Not automated yet

- Live Anthropic and OpenAI calls (no valid keys are configured in this environment). Grading is covered with fake providers in the integration tests.
- Safari and Firefox recording (`MediaRecorder` codec differences).
- Load testing.
