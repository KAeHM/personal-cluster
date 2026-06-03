import { relations } from "drizzle-orm";
import {
  index,
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
export const messageDirectionEnum = pgEnum("message_direction", ["in", "out"]);
export const taskEventTypeEnum = pgEnum("task_event_type", [
  "started",
  "paused",
  "resumed",
  "finished",
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  phone: text("phone").unique(),
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

export const pendingTaskDuplicateClarifications = pgTable(
  "pending_task_duplicate_clarifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pausedTaskId: text("paused_task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    newDescription: text("new_description").notNull(),
    estimatedMinutes: integer("estimated_minutes"),
    groupId: text("group_id").references(() => workGroups.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("idx_pending_task_duplicate_clarifications_user").on(
      table.userId,
    ),
  }),
);

export const pendingFinishSelections = pgTable(
  "pending_finish_selections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("idx_pending_finish_selections_user").on(table.userId),
  }),
);

export const pendingGroupClarifications = pgTable(
  "pending_group_clarifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    suggestedLabel: text("suggested_label").notNull(),
    suggestedNormalized: text("suggested_normalized").notNull(),
    candidateGroupId: text("candidate_group_id")
      .notNull()
      .references(() => workGroups.id, { onDelete: "cascade" }),
    taskDescription: text("task_description").notNull(),
    estimatedMinutes: integer("estimated_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("idx_pending_group_clarifications_user").on(
      table.userId,
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

export const messageLogs = pgTable("message_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  externalMessageId: text("external_message_id").unique(),
  direction: messageDirectionEnum("direction").notNull(),
  content: text("content"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const taskMessageLinks = pgTable(
  "task_message_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    messageLogId: text("message_log_id")
      .notNull()
      .references(() => messageLogs.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    taskMessageUnique: uniqueIndex("idx_task_message_links_task_message").on(
      table.taskId,
      table.messageLogId,
    ),
    taskCreatedIdx: index("idx_task_message_links_task_created").on(
      table.taskId,
      table.createdAt,
    ),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  messageLogs: many(messageLogs),
  accounts: many(accounts),
  sessions: many(sessions),
  workGroups: many(workGroups),
  pendingGroupClarifications: many(pendingGroupClarifications),
  pendingTaskDuplicateClarifications: many(pendingTaskDuplicateClarifications),
  pendingFinishSelections: many(pendingFinishSelections),
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

export const pendingTaskDuplicateClarificationsRelations = relations(
  pendingTaskDuplicateClarifications,
  ({ one }) => ({
    user: one(users, {
      fields: [pendingTaskDuplicateClarifications.userId],
      references: [users.id],
    }),
    pausedTask: one(tasks, {
      fields: [pendingTaskDuplicateClarifications.pausedTaskId],
      references: [tasks.id],
    }),
  }),
);

export const pendingFinishSelectionsRelations = relations(
  pendingFinishSelections,
  ({ one }) => ({
    user: one(users, {
      fields: [pendingFinishSelections.userId],
      references: [users.id],
    }),
  }),
);

export const pendingGroupClarificationsRelations = relations(
  pendingGroupClarifications,
  ({ one }) => ({
    user: one(users, {
      fields: [pendingGroupClarifications.userId],
      references: [users.id],
    }),
    candidateGroup: one(workGroups, {
      fields: [pendingGroupClarifications.candidateGroupId],
      references: [workGroups.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  group: one(workGroups, {
    fields: [tasks.groupId],
    references: [workGroups.id],
  }),
  events: many(taskEvents),
  messageLinks: many(taskMessageLinks),
  pendingDuplicateClarifications: many(pendingTaskDuplicateClarifications),
}));

export const messageLogsRelations = relations(messageLogs, ({ one, many }) => ({
  user: one(users, { fields: [messageLogs.userId], references: [users.id] }),
  taskLinks: many(taskMessageLinks),
}));

export const taskMessageLinksRelations = relations(
  taskMessageLinks,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskMessageLinks.taskId],
      references: [tasks.id],
    }),
    messageLog: one(messageLogs, {
      fields: [taskMessageLinks.messageLogId],
      references: [messageLogs.id],
    }),
  }),
);

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WorkGroup = typeof workGroups.$inferSelect;
export type GroupAlias = typeof groupAliases.$inferSelect;
export type PendingGroupClarification =
  typeof pendingGroupClarifications.$inferSelect;
export type PendingTaskDuplicateClarification =
  typeof pendingTaskDuplicateClarifications.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskStatus = Task["status"];
export type NewTask = typeof tasks.$inferInsert;
