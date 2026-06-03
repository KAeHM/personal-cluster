CREATE TABLE IF NOT EXISTS "pending_finish_selections" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_pending_finish_selections_user"
  ON "pending_finish_selections" ("user_id");
