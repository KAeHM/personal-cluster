import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "@auth/core/adapters";

export const taskStatusEnum = pgEnum("task_status", [
  "active",
  "paused",
  "closed",
]);
export const taskEventTypeEnum = pgEnum("task_event_type", [
  "started",
  "paused",
  "resumed",
  "finished",
]);

export const financeBoxProfileEnum = pgEnum("finance_box_profile", [
  "debt",
  "investment",
  "fixed_cost",
  "goal",
  "spending",
  "other",
]);

export const financeMovementTypeEnum = pgEnum("finance_movement_type", [
  "income",
  "expense",
]);

export const financeIncomeSourceTypeEnum = pgEnum(
  "finance_income_source_type",
  ["fixed", "variable"],
);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const workGroups = pgTable(
  "work_groups",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    normalizedKey: text("normalized_key").notNull(),
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userNormalizedIdx: uniqueIndex("idx_work_groups_user_normalized").on(
      table.userId,
      table.normalizedKey,
    ),
  }),
);

export const groupAliases = pgTable(
  "group_aliases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    groupId: text("group_id")
      .notNull()
      .references(() => workGroups.id, { onDelete: "cascade" }),
    aliasNormalized: text("alias_normalized").notNull(),
    aliasLabel: text("alias_label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    groupAliasIdx: uniqueIndex("idx_group_aliases_group_normalized").on(
      table.groupId,
      table.aliasNormalized,
    ),
  }),
);

export const taskEvents = pgTable("task_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: taskEventTypeEnum("type").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  segmentMinutes: integer("segment_minutes"),
  trackedMinutesAfter: integer("tracked_minutes_after").notNull(),
  metadata: jsonb("metadata").$type<TaskEventMetadata | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TaskEventMetadata = {
  relatedTaskDescription?: string;
  note?: string;
};

export const tasks = pgTable("tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  groupId: text("group_id").references(() => workGroups.id, {
    onDelete: "set null",
  }),
  description: text("description").notNull(),
  status: taskStatusEnum("status").notNull().default("active"),
  trackedMinutes: integer("tracked_minutes").notNull().default(0),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeCategories = pgTable(
  "finance_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userNormalizedIdx: uniqueIndex("idx_finance_categories_user_normalized").on(
      table.userId,
      table.normalizedName,
    ),
  }),
);

export type FinanceBoxConfig = {
  eligibleSourceIds?: string[];
  receiveRemainder?: boolean;
  allocationRules?: Array<{
    id: string;
    type: "percent" | "percent_conditional" | "fixed_amount";
    percent?: number;
    fixedAmountCents?: number;
    condition?: {
      field: "income_amount" | "eligible_income_amount";
      operator: ">" | ">=";
      valueCents: number;
    };
  }>;
};

export const financeBoxes = pgTable("finance_boxes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  profile: financeBoxProfileEnum("profile").notNull().default("other"),
  targetAmountCents: integer("target_amount_cents"),
  priority: integer("priority").notNull().default(0),
  color: text("color"),
  icon: text("icon"),
  config: jsonb("config").$type<FinanceBoxConfig | null>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeIncomeSources = pgTable("finance_income_sources", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: financeIncomeSourceTypeEnum("type").notNull().default("variable"),
  expectedAmountCents: integer("expected_amount_cents"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeUserSettings = pgTable("finance_user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  monthlyFixedIncomeCents: integer("monthly_fixed_income_cents"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeAllocations = pgTable("finance_allocations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  incomeSourceId: text("income_source_id")
    .notNull()
    .references(() => financeIncomeSources.id, { onDelete: "restrict" }),
  totalAmountCents: integer("total_amount_cents").notNull(),
  description: text("description"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeAllocationItems = pgTable("finance_allocation_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  allocationId: text("allocation_id")
    .notNull()
    .references(() => financeAllocations.id, { onDelete: "cascade" }),
  boxId: text("box_id")
    .notNull()
    .references(() => financeBoxes.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  ruleSnapshot: jsonb("rule_snapshot").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeTransfers = pgTable("finance_transfers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fromBoxId: text("from_box_id")
    .notNull()
    .references(() => financeBoxes.id, { onDelete: "cascade" }),
  toBoxId: text("to_box_id")
    .notNull()
    .references(() => financeBoxes.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  description: text("description"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const financeMovements = pgTable("finance_movements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  boxId: text("box_id")
    .notNull()
    .references(() => financeBoxes.id, { onDelete: "cascade" }),
  type: financeMovementTypeEnum("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  transferId: text("transfer_id").references(() => financeTransfers.id, {
    onDelete: "set null",
  }),
  categoryId: text("category_id").references(() => financeCategories.id, {
    onDelete: "set null",
  }),
  allocationId: text("allocation_id").references(() => financeAllocations.id, {
    onDelete: "set null",
  }),
  incomeSourceId: text("income_source_id").references(
    () => financeIncomeSources.id,
    { onDelete: "set null" },
  ),
  description: text("description"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  tasks: many(tasks),
  accounts: many(accounts),
  sessions: many(sessions),
  workGroups: many(workGroups),
  financeBoxes: many(financeBoxes),
  financeCategories: many(financeCategories),
  financeMovements: many(financeMovements),
  financeTransfers: many(financeTransfers),
  financeIncomeSources: many(financeIncomeSources),
  financeAllocations: many(financeAllocations),
  financeUserSettings: one(financeUserSettings),
}));

export const workGroupsRelations = relations(workGroups, ({ one, many }) => ({
  user: one(users, { fields: [workGroups.userId], references: [users.id] }),
  aliases: many(groupAliases),
  tasks: many(tasks),
}));

export const groupAliasesRelations = relations(groupAliases, ({ one }) => ({
  group: one(workGroups, {
    fields: [groupAliases.groupId],
    references: [workGroups.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  group: one(workGroups, {
    fields: [tasks.groupId],
    references: [workGroups.id],
  }),
  events: many(taskEvents),
}));

export const taskEventsRelations = relations(taskEvents, ({ one }) => ({
  task: one(tasks, { fields: [taskEvents.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskEvents.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const financeCategoriesRelations = relations(
  financeCategories,
  ({ one, many }) => ({
    user: one(users, {
      fields: [financeCategories.userId],
      references: [users.id],
    }),
    movements: many(financeMovements),
  }),
);

export const financeBoxesRelations = relations(
  financeBoxes,
  ({ one, many }) => ({
    user: one(users, { fields: [financeBoxes.userId], references: [users.id] }),
    movements: many(financeMovements),
    transfersFrom: many(financeTransfers, { relationName: "transferFrom" }),
    transfersTo: many(financeTransfers, { relationName: "transferTo" }),
  }),
);

export const financeTransfersRelations = relations(
  financeTransfers,
  ({ one, many }) => ({
    user: one(users, {
      fields: [financeTransfers.userId],
      references: [users.id],
    }),
    fromBox: one(financeBoxes, {
      fields: [financeTransfers.fromBoxId],
      references: [financeBoxes.id],
      relationName: "transferFrom",
    }),
    toBox: one(financeBoxes, {
      fields: [financeTransfers.toBoxId],
      references: [financeBoxes.id],
      relationName: "transferTo",
    }),
    movements: many(financeMovements),
  }),
);

export const financeMovementsRelations = relations(
  financeMovements,
  ({ one }) => ({
    user: one(users, {
      fields: [financeMovements.userId],
      references: [users.id],
    }),
    box: one(financeBoxes, {
      fields: [financeMovements.boxId],
      references: [financeBoxes.id],
    }),
    transfer: one(financeTransfers, {
      fields: [financeMovements.transferId],
      references: [financeTransfers.id],
    }),
    category: one(financeCategories, {
      fields: [financeMovements.categoryId],
      references: [financeCategories.id],
    }),
    allocation: one(financeAllocations, {
      fields: [financeMovements.allocationId],
      references: [financeAllocations.id],
    }),
    incomeSource: one(financeIncomeSources, {
      fields: [financeMovements.incomeSourceId],
      references: [financeIncomeSources.id],
    }),
  }),
);

export const financeIncomeSourcesRelations = relations(
  financeIncomeSources,
  ({ one, many }) => ({
    user: one(users, {
      fields: [financeIncomeSources.userId],
      references: [users.id],
    }),
    allocations: many(financeAllocations),
    movements: many(financeMovements),
  }),
);

export const financeUserSettingsRelations = relations(
  financeUserSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [financeUserSettings.userId],
      references: [users.id],
    }),
  }),
);

export const financeAllocationsRelations = relations(
  financeAllocations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [financeAllocations.userId],
      references: [users.id],
    }),
    incomeSource: one(financeIncomeSources, {
      fields: [financeAllocations.incomeSourceId],
      references: [financeIncomeSources.id],
    }),
    items: many(financeAllocationItems),
    movements: many(financeMovements),
  }),
);

export const financeAllocationItemsRelations = relations(
  financeAllocationItems,
  ({ one }) => ({
    allocation: one(financeAllocations, {
      fields: [financeAllocationItems.allocationId],
      references: [financeAllocations.id],
    }),
    box: one(financeBoxes, {
      fields: [financeAllocationItems.boxId],
      references: [financeBoxes.id],
    }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WorkGroup = typeof workGroups.$inferSelect;
export type GroupAlias = typeof groupAliases.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskStatus = Task["status"];
export type NewTask = typeof tasks.$inferInsert;
export type FinanceBox = typeof financeBoxes.$inferSelect;
export type NewFinanceBox = typeof financeBoxes.$inferInsert;
export type FinanceBoxProfile = FinanceBox["profile"];
export type FinanceMovement = typeof financeMovements.$inferSelect;
export type NewFinanceMovement = typeof financeMovements.$inferInsert;
export type FinanceMovementType = FinanceMovement["type"];
export type FinanceCategory = typeof financeCategories.$inferSelect;
export type NewFinanceCategory = typeof financeCategories.$inferInsert;
export type FinanceTransfer = typeof financeTransfers.$inferSelect;
export type NewFinanceTransfer = typeof financeTransfers.$inferInsert;
export type FinanceIncomeSource = typeof financeIncomeSources.$inferSelect;
export type NewFinanceIncomeSource = typeof financeIncomeSources.$inferInsert;
export type FinanceIncomeSourceType = FinanceIncomeSource["type"];
export type FinanceAllocation = typeof financeAllocations.$inferSelect;
export type FinanceAllocationItem = typeof financeAllocationItems.$inferSelect;
export type FinanceUserSettings = typeof financeUserSettings.$inferSelect;
