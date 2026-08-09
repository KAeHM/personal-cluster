CREATE TYPE "public"."finance_income_source_type" AS ENUM('fixed', 'variable');
--> statement-breakpoint
CREATE TABLE "finance_income_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "finance_income_source_type" DEFAULT 'variable' NOT NULL,
	"expected_amount_cents" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"monthly_fixed_income_cents" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"income_source_id" text NOT NULL,
	"total_amount_cents" integer NOT NULL,
	"description" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_allocation_items" (
	"id" text PRIMARY KEY NOT NULL,
	"allocation_id" text NOT NULL,
	"box_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"rule_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD COLUMN "allocation_id" text;
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD COLUMN "income_source_id" text;
--> statement-breakpoint
ALTER TABLE "finance_income_sources" ADD CONSTRAINT "finance_income_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_user_settings" ADD CONSTRAINT "finance_user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_allocations" ADD CONSTRAINT "finance_allocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_allocations" ADD CONSTRAINT "finance_allocations_income_source_id_finance_income_sources_id_fk" FOREIGN KEY ("income_source_id") REFERENCES "public"."finance_income_sources"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_allocation_items" ADD CONSTRAINT "finance_allocation_items_allocation_id_finance_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."finance_allocations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_allocation_items" ADD CONSTRAINT "finance_allocation_items_box_id_finance_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."finance_boxes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_allocation_id_finance_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."finance_allocations"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_income_source_id_finance_income_sources_id_fk" FOREIGN KEY ("income_source_id") REFERENCES "public"."finance_income_sources"("id") ON DELETE set null ON UPDATE no action;
