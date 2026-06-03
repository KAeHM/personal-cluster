CREATE TYPE "public"."task_status_new" AS ENUM('active', 'paused', 'closed');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "tracked_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status_new" "task_status_new";--> statement-breakpoint
UPDATE "tasks" SET "status_new" = 'closed', "tracked_minutes" = COALESCE("duration_minutes", 0) WHERE "status" = 'closed';--> statement-breakpoint
WITH "ranked_open" AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "user_id" ORDER BY "started_at" DESC) AS "rn"
  FROM "tasks"
  WHERE "status" = 'open'
)
UPDATE "tasks" AS "t"
SET
  "status_new" = CASE WHEN "r"."rn" = 1 THEN 'active'::"task_status_new" ELSE 'paused'::"task_status_new" END,
  "tracked_minutes" = CASE
    WHEN "r"."rn" = 1 THEN 0
    ELSE GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - "t"."started_at")) / 60)::integer)
  END,
  "activated_at" = CASE WHEN "r"."rn" = 1 THEN "t"."started_at" ELSE NULL END
FROM "ranked_open" AS "r"
WHERE "t"."id" = "r"."id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "status_new" TO "status";--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
DROP TYPE "public"."task_status";--> statement-breakpoint
ALTER TYPE "public"."task_status_new" RENAME TO "task_status";--> statement-breakpoint
CREATE TABLE "pending_task_duplicate_clarifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"paused_task_id" text NOT NULL,
	"new_description" text NOT NULL,
	"estimated_minutes" integer,
	"group_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pending_task_duplicate_clarifications" ADD CONSTRAINT "pending_task_duplicate_clarifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_task_duplicate_clarifications" ADD CONSTRAINT "pending_task_duplicate_clarifications_paused_task_id_tasks_id_fk" FOREIGN KEY ("paused_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_task_duplicate_clarifications" ADD CONSTRAINT "pending_task_duplicate_clarifications_group_id_work_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."work_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pending_task_duplicate_clarifications_user" ON "pending_task_duplicate_clarifications" ("user_id");
