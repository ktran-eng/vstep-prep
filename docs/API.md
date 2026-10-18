# Server API

Mutations are **Next.js server actions**. They are POST-only, origin-checked by Next.js, and every input is validated with Zod. Each returns `{ ok: true, data } | { ok: false, error, code? }`. Codes: `not_found`, `forbidden`, `closed`, `wrong_section`, `invalid`, `expired`, `unauthorized`, `server`. Unknown errors are logged server-side and returned as a generic message.

## Exam engine — `src/app/actions/exam.ts`

| Action | Input | Notes |
|---|---|---|
| `startAttemptAction(formData)` | `blueprintId`, `mode: exam\|practice` | Idempotent; redirects to `/attempt/{id}` |
| `getAttemptViewAction(attemptId)` | uuid | Enforces deadlines; returns public snapshot, answers, remaining seconds, released material |
| `saveAnswerAction` | `{attemptId, questionId, response: A-D\|null, timeSpentDelta?}` | Rate-limited to 240/min per learner |
| `toggleMarkAction` | `{attemptId, questionId, marked}` | |
| `saveWritingAction` | `{attemptId, promptId, text ≤ 20 000 chars, timeSpentDelta?}` | Writing section of a mock |
| `advanceSectionAction` | `{attemptId, expectedSection}` | Idempotent per section |
| `submitAttemptAction(attemptId)` | uuid | Idempotent; schedules Writing/Speaking grading with `after()` |
| `regradeAttemptAction(attemptId)` | uuid | Re-runs grading for failed or unavailable items |
| `registerPlayAction` | `{attemptId, audioId}` | Returns `{allowed, plays}`; enforces the strict play limit |
| `transcriptAction` | `{attemptId, audioId}` | Practice mode after one play, or after the attempt has ended |

## Practice — `src/app/actions/practice.ts`

| Action | Notes |
|---|---|
| `saveWritingDraftAction` / `submitWritingAction` | Standalone writing. Submit is idempotent and triggers grading |
| `regradeWritingAction(submissionId)` | |
| `submitSpeakingAction(formData)` | `audio` (Blob), `promptId`, `attemptId?`, `consent: recording_only\|ai_processing`, `durationSeconds`. Checks: ≤ 10 MB, magic bytes, 30 uploads/hour. Exam mode allows one submission per part |
| `saveSelfAssessmentAction` | Ratings 1–5 per criterion |
| `regradeSpeakingAction`, `deleteRecordingAction` | |

## Learner — `src/app/actions/learner.ts`

`setLanguageAction`, `setThemeAction`, `savePreferencesAction`, `bookmarkAction` (requires a finished attempt containing the question), `updateBookmarkAction`, `addVocabAction`, `quickAddVocabAction`, `deleteVocabAction`, `regeneratePlanAction`, `togglePlanTaskAction`, `deleteMyDataAction` (requires typing `DELETE`).

## Admin — `src/app/actions/admin.ts`

Every action calls `requireAdmin()` and writes an audit log entry. Actions: `adminLoginAction` (rate-limited), `adminLogoutAction`, `setQuestionStatusAction`, `editQuestionAction` (validates verbatim evidence, bumps the version, re-snapshots affected tests), `setPromptStatusAction`, `setBlueprintStatusAction`, `republishAction`, `setAudioQualityAction`, `saveConfigAction` (new versioned spec or scoring config, validated), `activateConfigAction`, `updateSourceAction`.

## Route handlers

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/recordings/{submissionId}` | learner cookie (owner only; others get 404) | Streams a recording; `Cache-Control: private, no-store` |
| `GET /api/me/export` | learner cookie | JSON export of all of the learner's data |
| `GET /api/cron/maintenance` | `Authorization: Bearer $CRON_SECRET` | Retention job |
| `GET /audio/{id}.mp3` | public | Listening audio (not secret; transcripts are protected instead) |
