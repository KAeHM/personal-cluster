CREATE TYPE "public"."finance_box_profile" AS ENUM('debt', 'investment', 'fixed_cost', 'goal', 'spending', 'other');
--> statement-breakpoint
CREATE TYPE "public"."finance_movement_type" AS ENUM('income', 'expense');
--> statement-breakpoint
CREATE TABLE "finance_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_boxes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"profile" "finance_box_profile" DEFAULT 'other' NOT NULL,
	"target_amount_cents" integer,
	"priority" integer DEFAULT 0 NOT NULL,
	"color" text,
	"icon" text,
	"config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"from_box_id" text NOT NULL,
	"to_box_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"description" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"box_id" text NOT NULL,
	"type" "finance_movement_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"transfer_id" text,
	"category_id" text,
	"description" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_boxes" ADD CONSTRAINT "finance_boxes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_transfers" ADD CONSTRAINT "finance_transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_transfers" ADD CONSTRAINT "finance_transfers_from_box_id_finance_boxes_id_fk" FOREIGN KEY ("from_box_id") REFERENCES "public"."finance_boxes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_transfers" ADD CONSTRAINT "finance_transfers_to_box_id_finance_boxes_id_fk" FOREIGN KEY ("to_box_id") REFERENCES "public"."finance_boxes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_box_id_finance_boxes_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."finance_boxes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_transfer_id_finance_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."finance_transfers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "finance_movements" ADD CONSTRAINT "finance_movements_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_finance_categories_user_normalized" ON "finance_categories" USING btree ("user_id","normalized_name");
