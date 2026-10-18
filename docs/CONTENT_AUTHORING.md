# Content authoring guidelines

All content lives in `content/` as typed TypeScript, which gives autocomplete and type errors while writing. It is reviewed through git, validated by `npm run content:validate`, and loaded by `npm run db:seed`.

## Provenance (non-negotiable)

- Write **original** passages, scripts, questions and prompts. Never copy official papers, commercial question banks or copyrighted scripts or audio.
- Adapted or licensed material must set `provenance: { type: "adapted" | "licensed" | "official_sample", sourceId, license }`, and the source must exist in `content/sources.json`. The validator rejects non-original items without a source, and published items marked `unlicensed`.
- Never describe original items as official or past VSTEP questions.

## Reading sets (`content/reading/*.ts`)

- Mock papers have 4 passages of 10 questions each, getting harder from B1 to C1 (typically B1 → B2 → B2 → C1). The total should be 1,900–2,050 words (QĐ 729); the validator warns outside that range and fails outside 1,600–2,600.
- Separate paragraphs with a blank line. Paragraph *n* is referenced as `P{n}`.
- Each question needs:
  - `evidence.quote` — copied **verbatim** from paragraph `evidence.ref` (the validator checks this; quote marks and whitespace are normalised)
  - `explanation` — explains why the key is right **without naming option letters** (options are shuffled deterministically at load time, so letters change)
  - `distractors` (optional) — notes keyed by the letter *as authored*; they are remapped automatically
  - `type` — one of main_idea, detail, vocabulary, reference, inference, purpose, attitude, organisation, gist
  - `difficulty` — 1–5
- You may always write the correct option as `A`, because shuffling spreads keys across A–D. Run the validator to see the key distribution.
- Avoid "all/none of the above". Keep option lengths similar, and make every distractor plausible but clearly wrong given the evidence.

## Listening sets (`content/listening/*.ts`)

- Part 1 has 8 short announcements with 1 question each; Part 2 has 3 conversations with 4 questions each; Part 3 has 3 talks or lectures with 5 questions each. This split is configurable and is not verified in the decree.
- Segment *n* is `S{n}`; evidence quotes must appear verbatim in that segment.
- One speaker always uses the same `voice` (male/female), and the validator enforces this.
- Write numbers and abbreviations the way they should be **spoken** ("nine fifteen", "V N two four seven") and avoid non-English words that TTS will mispronounce.
- After editing scripts, run `npm run audio:generate` (only changed scripts are re-rendered) and then `npm run db:seed`.
- Generated audio must be human-checked in `/admin/audio` for pronunciation, clipping, intelligibility and match to the transcript before it is approved.

## Writing and Speaking prompts

- Writing `minWords`: letter 120, essay 250 (spec). Every prompt has a `sample` at or above the minimum word count (validated) and a list of `requiredPoints`.
- Speaking: Part 1 has two topics with at least 3 questions each; Part 2 has a situation and exactly 3 options; Part 3 has a topic, at least 3 ideas and at least 2 follow-ups. Each needs a `modelResponse` and `usefulLanguage`.

## Review workflow

`draft → validated` (passes `content:validate`) `→ reviewed` (a qualified teacher has read the item, key and explanation) `→ published` (included in a published test) `→ archived` (kept for history and never deleted). Published tests may only contain `reviewed` or `published` items. Automated checks cannot judge educational quality, so every published mock needs human review. Record the reviewer in the admin, where status changes set `reviewed_by`.

## Mocks must stay unseen

Content used in a mock must not appear in another mock (validated), and mock Writing/Speaking prompts are hidden from the open practice lists.
