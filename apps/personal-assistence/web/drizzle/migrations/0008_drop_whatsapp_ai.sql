DROP TABLE IF EXISTS "task_message_links";
--> statement-breakpoint
DROP TABLE IF EXISTS "pending_task_duplicate_clarifications";
--> statement-breakpoint
DROP TABLE IF EXISTS "pending_group_clarifications";
--> statement-breakpoint
DROP TABLE IF EXISTS "pending_finish_selections";
--> statement-breakpoint
DROP TABLE IF EXISTS "message_logs";
--> statement-breakpoint
DROP TYPE IF EXISTS "message_direction";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone";
