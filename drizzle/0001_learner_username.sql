ALTER TABLE "learners" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "learners" ADD CONSTRAINT "learners_username_unique" UNIQUE("username");