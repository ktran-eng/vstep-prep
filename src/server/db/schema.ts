import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => "bytea",
  fromDriver: (v) => (Buffer.isBuffer(v) ? v : Buffer.from(v)),
});

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/* ------------------------------------------------------------------ */
/* Learners (identified by sign-in name; no password by design)        */
/* ------------------------------------------------------------------ */

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Normalised sign-in name (lowercase, NFC). No password by design: knowing the name opens the profile.
  username: text("username").unique(),
  displayName: text("display_name"),
  preferredLanguage: text("preferred_language").notNull().default("vi"),
  timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const learnerPreferences = pgTable("learner_preferences", {
  learnerId: uuid("learner_id")
    .primaryKey()
    .references(() => learners.id, { onDelete: "cascade" }),
  targetLevel: text("target_level").notNull().default("B1"),
  targetExamDate: text("target_exam_date"), // ISO date (yyyy-mm-dd)
  studyMinutesPerDay: integer("study_minutes_per_day").notNull().default(45),
  studyDays: jsonb("study_days").$type<number[]>().notNull().default([1, 2, 3, 4, 5]),
  theme: text("theme").notNull().default("system"),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Specification, scoring, provenance                                  */
/* ------------------------------------------------------------------ */

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  publisher: text("publisher").notNull(),
  canonicalUrl: text("canonical_url"),
  sourceType: text("source_type").notNull(), // official_regulation | institutional | commercial_prep | reference | original
  publicationDate: text("publication_date"),
  lastVerifiedAt: text("last_verified_at"),
  licenseType: text("license_type").notNull(),
  permissionStatus: text("permission_status").notNull(), // link_only | public_document | owned
  attributionText: text("attribution_text"),
  contentCovered: text("content_covered"),
  confidence: text("confidence").notNull().default("medium"),
  notes: text("notes"),
  updatedAt: updatedAt(),
});

export const examSpecifications = pgTable("exam_specifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: text("version").notNull().unique(),
  payload: jsonb("payload").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: createdAt(),
});

export const scoringConfigs = pgTable("scoring_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: text("version").notNull().unique(),
  payload: jsonb("payload").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: createdAt(),
});

export const rubrics = pgTable("rubrics", {
  id: text("id").primaryKey(), // e.g. writing-practice-v1
  skill: text("skill").notNull(),
  version: integer("version").notNull(),
  name: text("name").notNull(),
  isOfficial: boolean("is_official").notNull().default(false),
  criteria: jsonb("criteria").notNull(),
  notes: text("notes"),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ */
/* Content bank                                                        */
/* ------------------------------------------------------------------ */

const contentMeta = {
  provenanceType: text("provenance_type").notNull().default("original"), // original | official_sample | licensed | adapted
  licenseStatus: text("license_status").notNull().default("owned"),
  sourceId: text("source_id").references(() => sources.id),
  status: text("status").notNull().default("draft"), // draft | validated | reviewed | published | archived
  version: integer("version").notNull().default(1),
  reviewedBy: text("reviewed_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
};

export const passages = pgTable("passages", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(), // paragraphs separated by blank lines
  wordCount: integer("word_count").notNull(),
  level: text("level").notNull(),
  topic: text("topic").notNull(),
  ...contentMeta,
});

export const transcripts = pgTable("transcripts", {
  id: text("id").primaryKey(),
  segments: jsonb("segments").$type<{ id: string; speaker: string; text: string }[]>().notNull(),
  publicationStatus: text("publication_status").notNull().default("after_submission"),
  createdAt: createdAt(),
});

export const audioAssets = pgTable("audio_assets", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  storageKey: text("storage_key"), // path under /public/audio or blob id; null => audio not generated yet
  transcriptId: text("transcript_id")
    .notNull()
    .references(() => transcripts.id),
  durationSeconds: real("duration_seconds"),
  voiceMetadata: jsonb("voice_metadata"),
  licenseStatus: text("license_status").notNull().default("owned"),
  generationMethod: text("generation_method").notNull().default("pending"), // pending | windows_sapi_dev | openai_tts | recorded
  qualityStatus: text("quality_status").notNull().default("unreviewed"), // unreviewed | approved | rejected
  part: integer("part").notNull(),
  level: text("level").notNull(),
  topic: text("topic").notNull(),
  createdAt: createdAt(),
});

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    skill: text("skill").notNull(), // reading | listening
    level: text("level").notNull(),
    taskType: text("task_type").notNull(), // main_idea | detail | vocabulary | reference | inference | purpose | attitude | organisation | gist
    difficulty: integer("difficulty").notNull(), // 1..5
    topic: text("topic"),
    learningObjective: text("learning_objective"),
    prompt: text("prompt").notNull(),
    passageId: text("passage_id").references(() => passages.id),
    audioAssetId: text("audio_asset_id").references(() => audioAssets.id),
    displayOrder: integer("display_order").notNull().default(0),
    ...contentMeta,
  },
  (t) => [index("questions_passage_idx").on(t.passageId), index("questions_audio_idx").on(t.audioAssetId), index("questions_skill_level_idx").on(t.skill, t.level)],
);

export const questionOptions = pgTable(
  "question_options",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    optionKey: text("option_key").notNull(),
    optionText: text("option_text").notNull(),
    displayOrder: integer("display_order").notNull(),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.optionKey] })],
);

export const answerKeys = pgTable("answer_keys", {
  questionId: text("question_id")
    .primaryKey()
    .references(() => questions.id, { onDelete: "cascade" }),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  // Exact quotation from the passage/transcript, plus paragraph or segment id; validated against the source text.
  evidenceReference: jsonb("evidence_reference").$type<{ ref: string; quote: string }>().notNull(),
  distractorNotes: jsonb("distractor_notes").$type<Record<string, string>>(),
  vocabularyNotes: jsonb("vocabulary_notes").$type<{ term: string; note: string }[]>(),
});

export const writingPrompts = pgTable("writing_prompts", {
  id: text("id").primaryKey(),
  taskType: text("task_type").notNull(), // letter | essay
  level: text("level").notNull(),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  stimulus: text("stimulus"), // the letter/email being answered, or essay statement
  requiredPoints: jsonb("required_points").$type<string[]>().notNull(),
  minWords: integer("min_words").notNull(),
  suggestedMinutes: integer("suggested_minutes").notNull(),
  rubricId: text("rubric_id")
    .notNull()
    .references(() => rubrics.id),
  sampleResponse: text("sample_response").notNull(),
  sampleLevel: text("sample_level").notNull(),
  topic: text("topic").notNull(),
  ...contentMeta,
});

export const speakingPrompts = pgTable("speaking_prompts", {
  id: text("id").primaryKey(),
  partNumber: integer("part_number").notNull(),
  level: text("level").notNull(),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  content: jsonb("content").notNull(), // part-specific: topics/questions | situation/options | topic/ideas/follow-ups
  preparationSeconds: integer("preparation_seconds").notNull(),
  responseSeconds: integer("response_seconds").notNull(),
  rubricId: text("rubric_id")
    .notNull()
    .references(() => rubrics.id),
  modelResponse: text("model_response").notNull(),
  usefulLanguage: jsonb("useful_language").$type<string[]>().notNull(),
  topic: text("topic").notNull(),
  ...contentMeta,
});

/* ------------------------------------------------------------------ */
/* Test assembly                                                       */
/* ------------------------------------------------------------------ */

export const testBlueprints = pgTable("test_blueprints", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  kind: text("kind").notNull(), // mock | practice
  skill: text("skill"), // null for full mock
  targetLevel: text("target_level").notNull(), // B1 | B2 | C1 | B1-C1
  durationSeconds: integer("duration_seconds").notNull(),
  specificationVersion: text("specification_version").notNull(),
  status: text("status").notNull().default("draft"),
  version: integer("version").notNull().default(1),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const testSections = pgTable(
  "test_sections",
  {
    id: text("id").primaryKey(),
    blueprintId: text("blueprint_id")
      .notNull()
      .references(() => testBlueprints.id, { onDelete: "cascade" }),
    skill: text("skill").notNull(),
    sectionOrder: integer("section_order").notNull(),
    timeLimitSeconds: integer("time_limit_seconds").notNull(),
    configuration: jsonb("configuration").notNull().default({}),
  },
  (t) => [uniqueIndex("test_sections_order_uq").on(t.blueprintId, t.sectionOrder)],
);

export const testItems = pgTable(
  "test_items",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => testSections.id, { onDelete: "cascade" }),
    itemOrder: integer("item_order").notNull(),
    passageId: text("passage_id").references(() => passages.id),
    audioAssetId: text("audio_asset_id").references(() => audioAssets.id),
    writingPromptId: text("writing_prompt_id").references(() => writingPrompts.id),
    speakingPromptId: text("speaking_prompt_id").references(() => speakingPrompts.id),
    points: real("points").notNull().default(1),
    configuration: jsonb("configuration").notNull().default({}),
  },
  (t) => [uniqueIndex("test_items_order_uq").on(t.sectionId, t.itemOrder)],
);

/** Immutable, fully-resolved copy of a blueprint version. Attempts point here, so later bank edits never change a started/finished attempt. */
export const blueprintSnapshots = pgTable(
  "blueprint_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blueprintId: text("blueprint_id")
      .notNull()
      .references(() => testBlueprints.id),
    blueprintVersion: integer("blueprint_version").notNull(),
    publicPayload: jsonb("public_payload").notNull(), // safe to send to learners before submission
    protectedPayload: jsonb("protected_payload").notNull(), // answer keys, explanations, transcripts
    contentHash: text("content_hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("snapshot_bp_version_uq").on(t.blueprintId, t.blueprintVersion)],
);

/* ------------------------------------------------------------------ */
/* Attempts                                                            */
/* ------------------------------------------------------------------ */

export const examAttempts = pgTable(
  "exam_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    blueprintId: text("blueprint_id")
      .notNull()
      .references(() => testBlueprints.id),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => blueprintSnapshots.id),
    blueprintVersion: integer("blueprint_version").notNull(),
    mode: text("mode").notNull(), // exam (strict) | practice (learning)
    status: text("status").notNull().default("in_progress"), // in_progress | submitted | expired
    currentSection: integer("current_section").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    totalTimeSeconds: integer("total_time_seconds"),
    completionReason: text("completion_reason"), // learner_submitted | time_expired
    scoreSummary: jsonb("score_summary"),
    scoringConfigVersion: text("scoring_config_version"),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("attempts_learner_idx").on(t.learnerId, t.startedAt),
    // At most one in-progress attempt per learner per blueprint and mode: makes "start" idempotent under concurrent requests.
    uniqueIndex("attempts_one_active_uq").on(t.learnerId, t.blueprintId, t.mode).where(sql`status = 'in_progress'`),
  ],
);

export const attemptSections = pgTable(
  "attempt_sections",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examAttempts.id, { onDelete: "cascade" }),
    sectionOrder: integer("section_order").notNull(),
    skill: text("skill").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    completionReason: text("completion_reason"),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.sectionOrder] })],
);

export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examAttempts.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(), // id inside the snapshot
    sectionOrder: integer("section_order").notNull(),
    response: text("response"), // selected option key; null = cleared
    markedForReview: boolean("marked_for_review").notNull().default(false),
    isCorrect: boolean("is_correct"),
    score: real("score"),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.questionId] })],
);

export const listeningPlays = pgTable(
  "listening_plays",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examAttempts.id, { onDelete: "cascade" }),
    audioAssetId: text("audio_asset_id").notNull(),
    plays: integer("plays").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.audioAssetId] })],
);

/* ------------------------------------------------------------------ */
/* Productive skills                                                   */
/* ------------------------------------------------------------------ */

export const writingSubmissions = pgTable(
  "writing_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    attemptId: uuid("attempt_id").references(() => examAttempts.id, { onDelete: "cascade" }),
    promptId: text("prompt_id")
      .notNull()
      .references(() => writingPrompts.id),
    responseText: text("response_text").notNull().default(""),
    wordCount: integer("word_count").notNull().default(0),
    status: text("status").notNull().default("draft"), // draft | submitted
    gradingStatus: text("grading_status").notNull().default("not_requested"), // not_requested | pending | graded | unavailable | failed
    rubricScores: jsonb("rubric_scores"),
    feedback: jsonb("feedback"),
    overallScore: real("overall_score"),
    gradingMethod: text("grading_method"), // ai_estimate | human
    gradingModelVersion: text("grading_model_version"),
    rubricVersion: text("rubric_version"),
    gradingError: text("grading_error"),
    timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
    startedAt: createdAt(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("writing_learner_idx").on(t.learnerId, t.startedAt),
    uniqueIndex("writing_attempt_prompt_uq").on(t.attemptId, t.promptId).where(sql`attempt_id is not null`),
  ],
);

export const blobs = pgTable("blobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  learnerId: uuid("learner_id")
    .notNull()
    .references(() => learners.id, { onDelete: "cascade" }),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  data: bytea("data").notNull(),
  createdAt: createdAt(),
});

export const speakingSubmissions = pgTable(
  "speaking_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    attemptId: uuid("attempt_id").references(() => examAttempts.id, { onDelete: "cascade" }),
    promptId: text("prompt_id")
      .notNull()
      .references(() => speakingPrompts.id),
    audioBlobId: uuid("audio_blob_id").references(() => blobs.id, { onDelete: "set null" }),
    durationSeconds: real("duration_seconds"),
    transcript: text("transcript"),
    transcriptionStatus: text("transcription_status").notNull().default("not_requested"), // not_requested | done | unavailable | failed
    gradingStatus: text("grading_status").notNull().default("not_requested"),
    rubricScores: jsonb("rubric_scores"),
    feedback: jsonb("feedback"),
    overallScore: real("overall_score"),
    selfAssessment: jsonb("self_assessment"),
    gradingModelVersion: text("grading_model_version"),
    rubricVersion: text("rubric_version"),
    gradingError: text("grading_error"),
    consentStatus: text("consent_status").notNull(), // recording_only | ai_processing
    submittedAt: createdAt(),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
  },
  (t) => [index("speaking_learner_idx").on(t.learnerId, t.submittedAt)],
);

/* ------------------------------------------------------------------ */
/* Learning tools                                                      */
/* ------------------------------------------------------------------ */

export const mistakeBookmarks = pgTable(
  "mistake_bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    attemptId: uuid("attempt_id").references(() => examAttempts.id, { onDelete: "set null" }),
    note: text("note"),
    reviewStatus: text("review_status").notNull().default("to_review"), // to_review | reviewed
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("bookmark_learner_question_uq").on(t.learnerId, t.questionId)],
);

export const vocabularyNotes = pgTable(
  "vocabulary_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    term: text("term").notNull(),
    meaning: text("meaning"),
    example: text("example"),
    createdAt: createdAt(),
  },
  (t) => [index("vocab_learner_idx").on(t.learnerId)],
);

export const studyPlanTasks = pgTable(
  "study_plan_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    weekStart: text("week_start").notNull(), // yyyy-mm-dd (Monday)
    dayOfWeek: integer("day_of_week").notNull(), // 1=Mon..7=Sun
    skill: text("skill").notNull(),
    activity: text("activity").notNull(),
    href: text("href").notNull(),
    minutes: integer("minutes").notNull(),
    reason: text("reason").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("plan_learner_week_idx").on(t.learnerId, t.weekStart)],
);

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    details: jsonb("details"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);
