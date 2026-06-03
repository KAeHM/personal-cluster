CREATE TABLE "work_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"normalized_key" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_aliases" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"alias_normalized" text NOT NULL,
	"alias_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_group_clarifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"suggested_label" text NOT NULL,
	"suggested_normalized" text NOT NULL,
	"candidate_group_id" text NOT NULL,
	"task_description" text NOT NULL,
	"estimated_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "group_id" text;--> statement-breakpoint
ALTER TABLE "work_groups" ADD CONSTRAINT "work_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_aliases" ADD CONSTRAINT "group_aliases_group_id_work_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."work_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_group_clarifications" ADD CONSTRAINT "pending_group_clarifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_group_clarifications" ADD CONSTRAINT "pending_group_clarifications_candidate_group_id_work_groups_id_fk" FOREIGN KEY ("candidate_group_id") REFERENCES "public"."work_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_group_id_work_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."work_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_work_groups_user_normalized" ON "work_groups" ("user_id","normalized_key");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_group_aliases_group_normalized" ON "group_aliases" ("group_id","alias_normalized");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pending_group_clarifications_user" ON "pending_group_clarifications" ("user_id");
