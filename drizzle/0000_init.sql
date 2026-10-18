CREATE TABLE "answer_keys" (
	"question_id" text PRIMARY KEY NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text NOT NULL,
	"evidence_reference" jsonb NOT NULL,
	"distractor_notes" jsonb,
	"vocabulary_notes" jsonb
);
--> statement-breakpoint
CREATE TABLE "attempt_answers" (
	"attempt_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"section_order" integer NOT NULL,
	"response" text,
	"marked_for_review" boolean DEFAULT false NOT NULL,
	"is_correct" boolean,
	"score" real,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"graded_at" timestamp with time zone,
	CONSTRAINT "attempt_answers_attempt_id_question_id_pk" PRIMARY KEY("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "attempt_sections" (
	"attempt_id" uuid NOT NULL,
	"section_order" integer NOT NULL,
	"skill" text NOT NULL,
	"started_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"completion_reason" text,
	CONSTRAINT "attempt_sections_attempt_id_section_order_pk" PRIMARY KEY("attempt_id","section_order")
);
--> statement-breakpoint
CREATE TABLE "audio_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"storage_key" text,
	"transcript_id" text NOT NULL,
	"duration_seconds" real,
	"voice_metadata" jsonb,
	"license_status" text DEFAULT 'owned' NOT NULL,
	"generation_method" text DEFAULT 'pending' NOT NULL,
	"quality_status" text DEFAULT 'unreviewed' NOT NULL,
	"part" integer NOT NULL,
	"level" text NOT NULL,
	"topic" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprint_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" text NOT NULL,
	"blueprint_version" integer NOT NULL,
	"public_payload" jsonb NOT NULL,
	"protected_payload" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"blueprint_id" text NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"blueprint_version" integer NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"current_section" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"total_time_seconds" integer,
	"completion_reason" text,
	"score_summary" jsonb,
	"scoring_config_version" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_specifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"payload" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_specifications_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "learner_preferences" (
	"learner_id" uuid PRIMARY KEY NOT NULL,
	"target_level" text DEFAULT 'B1' NOT NULL,
	"target_exam_date" text,
	"study_minutes_per_day" integer DEFAULT 45 NOT NULL,
	"study_days" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text,
	"preferred_language" text DEFAULT 'vi' NOT NULL,
	"timezone" text DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening_plays" (
	"attempt_id" uuid NOT NULL,
	"audio_asset_id" text NOT NULL,
	"plays" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listening_plays_attempt_id_audio_asset_id_pk" PRIMARY KEY("attempt_id","audio_asset_id")
);
--> statement-breakpoint
CREATE TABLE "mistake_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"attempt_id" uuid,
	"note" text,
	"review_status" text DEFAULT 'to_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passages" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"level" text NOT NULL,
	"topic" text NOT NULL,
	"provenance_type" text DEFAULT 'original' NOT NULL,
	"license_status" text DEFAULT 'owned' NOT NULL,
	"source_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"question_id" text NOT NULL,
	"option_key" text NOT NULL,
	"option_text" text NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "question_options_question_id_option_key_pk" PRIMARY KEY("question_id","option_key")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"skill" text NOT NULL,
	"level" text NOT NULL,
	"task_type" text NOT NULL,
	"difficulty" integer NOT NULL,
	"topic" text,
	"learning_objective" text,
	"prompt" text NOT NULL,
	"passage_id" text,
	"audio_asset_id" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"provenance_type" text DEFAULT 'original' NOT NULL,
	"license_status" text DEFAULT 'owned' NOT NULL,
	"source_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "rubrics" (
	"id" text PRIMARY KEY NOT NULL,
	"skill" text NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"criteria" jsonb NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"payload" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scoring_configs_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"publisher" text NOT NULL,
	"canonical_url" text,
	"source_type" text NOT NULL,
	"publication_date" text,
	"last_verified_at" text,
	"license_type" text NOT NULL,
	"permission_status" text NOT NULL,
	"attribution_text" text,
	"content_covered" text,
	"confidence" text DEFAULT 'medium' NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaking_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"part_number" integer NOT NULL,
	"level" text NOT NULL,
	"title" text NOT NULL,
	"instructions" text NOT NULL,
	"content" jsonb NOT NULL,
	"preparation_seconds" integer NOT NULL,
	"response_seconds" integer NOT NULL,
	"rubric_id" text NOT NULL,
	"model_response" text NOT NULL,
	"useful_language" jsonb NOT NULL,
	"topic" text NOT NULL,
	"provenance_type" text DEFAULT 'original' NOT NULL,
	"license_status" text DEFAULT 'owned' NOT NULL,
	"source_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaking_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"attempt_id" uuid,
	"prompt_id" text NOT NULL,
	"audio_blob_id" uuid,
	"duration_seconds" real,
	"transcript" text,
	"transcription_status" text DEFAULT 'not_requested' NOT NULL,
	"grading_status" text DEFAULT 'not_requested' NOT NULL,
	"rubric_scores" jsonb,
	"feedback" jsonb,
	"overall_score" real,
	"self_assessment" jsonb,
	"grading_model_version" text,
	"rubric_version" text,
	"grading_error" text,
	"consent_status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"graded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "study_plan_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"week_start" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"skill" text NOT NULL,
	"activity" text NOT NULL,
	"href" text NOT NULL,
	"minutes" integer NOT NULL,
	"reason" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_blueprints" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"kind" text NOT NULL,
	"skill" text,
	"target_level" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"specification_version" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_items" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"item_order" integer NOT NULL,
	"passage_id" text,
	"audio_asset_id" text,
	"writing_prompt_id" text,
	"speaking_prompt_id" text,
	"points" real DEFAULT 1 NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"blueprint_id" text NOT NULL,
	"skill" text NOT NULL,
	"section_order" integer NOT NULL,
	"time_limit_seconds" integer NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" text PRIMARY KEY NOT NULL,
	"segments" jsonb NOT NULL,
	"publication_status" text DEFAULT 'after_submission' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"term" text NOT NULL,
	"meaning" text,
	"example" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"task_type" text NOT NULL,
	"level" text NOT NULL,
	"title" text NOT NULL,
	"instructions" text NOT NULL,
	"stimulus" text,
	"required_points" jsonb NOT NULL,
	"min_words" integer NOT NULL,
	"suggested_minutes" integer NOT NULL,
	"rubric_id" text NOT NULL,
	"sample_response" text NOT NULL,
	"sample_level" text NOT NULL,
	"topic" text NOT NULL,
	"provenance_type" text DEFAULT 'original' NOT NULL,
	"license_status" text DEFAULT 'owned' NOT NULL,
	"source_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"attempt_id" uuid,
	"prompt_id" text NOT NULL,
	"response_text" text DEFAULT '' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"grading_status" text DEFAULT 'not_requested' NOT NULL,
	"rubric_scores" jsonb,
	"feedback" jsonb,
	"overall_score" real,
	"grading_method" text,
	"grading_model_version" text,
	"rubric_version" text,
	"grading_error" text,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"graded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answer_keys" ADD CONSTRAINT "answer_keys_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_sections" ADD CONSTRAINT "attempt_sections_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_assets" ADD CONSTRAINT "audio_assets_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blobs" ADD CONSTRAINT "blobs_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blueprint_snapshots" ADD CONSTRAINT "blueprint_snapshots_blueprint_id_test_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."test_blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_blueprint_id_test_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."test_blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_snapshot_id_blueprint_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."blueprint_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_preferences" ADD CONSTRAINT "learner_preferences_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_plays" ADD CONSTRAINT "listening_plays_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mistake_bookmarks" ADD CONSTRAINT "mistake_bookmarks_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mistake_bookmarks" ADD CONSTRAINT "mistake_bookmarks_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_audio_asset_id_audio_assets_id_fk" FOREIGN KEY ("audio_asset_id") REFERENCES "public"."audio_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_prompts" ADD CONSTRAINT "speaking_prompts_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_prompts" ADD CONSTRAINT "speaking_prompts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_prompt_id_speaking_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."speaking_prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_submissions" ADD CONSTRAINT "speaking_submissions_audio_blob_id_blobs_id_fk" FOREIGN KEY ("audio_blob_id") REFERENCES "public"."blobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plan_tasks" ADD CONSTRAINT "study_plan_tasks_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_items" ADD CONSTRAINT "test_items_section_id_test_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."test_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_items" ADD CONSTRAINT "test_items_passage_id_passages_id_fk" FOREIGN KEY ("passage_id") REFERENCES "public"."passages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_items" ADD CONSTRAINT "test_items_audio_asset_id_audio_assets_id_fk" FOREIGN KEY ("audio_asset_id") REFERENCES "public"."audio_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_items" ADD CONSTRAINT "test_items_writing_prompt_id_writing_prompts_id_fk" FOREIGN KEY ("writing_prompt_id") REFERENCES "public"."writing_prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_items" ADD CONSTRAINT "test_items_speaking_prompt_id_speaking_prompts_id_fk" FOREIGN KEY ("speaking_prompt_id") REFERENCES "public"."speaking_prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_sections" ADD CONSTRAINT "test_sections_blueprint_id_test_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."test_blueprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_notes" ADD CONSTRAINT "vocabulary_notes_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_prompts" ADD CONSTRAINT "writing_prompts_rubric_id_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_prompts" ADD CONSTRAINT "writing_prompts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_prompt_id_writing_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."writing_prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "snapshot_bp_version_uq" ON "blueprint_snapshots" USING btree ("blueprint_id","blueprint_version");--> statement-breakpoint
CREATE INDEX "attempts_learner_idx" ON "exam_attempts" USING btree ("learner_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_one_active_uq" ON "exam_attempts" USING btree ("learner_id","blueprint_id","mode") WHERE status = 'in_progress';--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_learner_question_uq" ON "mistake_bookmarks" USING btree ("learner_id","question_id");--> statement-breakpoint
CREATE INDEX "questions_passage_idx" ON "questions" USING btree ("passage_id");--> statement-breakpoint
CREATE INDEX "questions_audio_idx" ON "questions" USING btree ("audio_asset_id");--> statement-breakpoint
CREATE INDEX "questions_skill_level_idx" ON "questions" USING btree ("skill","level");--> statement-breakpoint
CREATE INDEX "speaking_learner_idx" ON "speaking_submissions" USING btree ("learner_id","created_at");--> statement-breakpoint
CREATE INDEX "plan_learner_week_idx" ON "study_plan_tasks" USING btree ("learner_id","week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "test_items_order_uq" ON "test_items" USING btree ("section_id","item_order");--> statement-breakpoint
CREATE UNIQUE INDEX "test_sections_order_uq" ON "test_sections" USING btree ("blueprint_id","section_order");--> statement-breakpoint
CREATE INDEX "vocab_learner_idx" ON "vocabulary_notes" USING btree ("learner_id");--> statement-breakpoint
CREATE INDEX "writing_learner_idx" ON "writing_submissions" USING btree ("learner_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "writing_attempt_prompt_uq" ON "writing_submissions" USING btree ("attempt_id","prompt_id") WHERE attempt_id is not null;