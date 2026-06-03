CREATE TABLE "task_message_links" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"message_log_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_message_links" ADD CONSTRAINT "task_message_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_message_links" ADD CONSTRAINT "task_message_links_message_log_id_message_logs_id_fk" FOREIGN KEY ("message_log_id") REFERENCES "public"."message_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_task_message_links_task_message" ON "task_message_links" USING btree ("task_id","message_log_id");--> statement-breakpoint
CREATE INDEX "idx_task_message_links_task_created" ON "task_message_links" USING btree ("task_id","created_at");
