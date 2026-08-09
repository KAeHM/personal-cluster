import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../src/lib/db";
import { tasks, users } from "../src/lib/db/schema";
import {
  finishTask,
  getActiveTask,
  getPausedTasks,
  getOrCreateUserByEmail,
  listTasksByUser,
  startTask,
} from "../src/lib/tasks/queries";
import { formatMinutes } from "../src/lib/format/time";
import {
  getClosedMinutesLast7Days,
  getClosedMinutesToday,
} from "../src/lib/tasks/metrics";
import { getLiveTrackedMinutes } from "../src/lib/tasks/time-tracking";

async function main() {
  console.log("=== Time Tracker — Task CRUD Test ===\n");

  const email = "dev-test@example.com";
  const user = await getOrCreateUserByEmail(email, "Dev User");
  console.log(`User: ${user.id} (${user.email})\n`);

  const r1 = await startTask({
    userId: user.id,
    description: "Relatório mensal",
    estimatedMinutes: 60,
  });
  if (r1.status !== "started") throw new Error("expected started");
  console.log(`✓ Started: ${r1.task.description}`);

  const r2 = await startTask({
    userId: user.id,
    description: "Feature de login",
  });
  if (r2.status !== "started") throw new Error("expected started");
  console.log(
    `✓ Started: ${r2.task.description} (paused: ${r2.pausedDescription})`,
  );

  const active = await getActiveTask(user.id);
  const paused = await getPausedTasks(user.id);
  console.log(
    `\nActive: ${active?.description ?? "none"}, Paused: ${paused.length}`,
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const finished = await finishTask(user.id, paused[0]!.id);
  console.log(
    `\n✓ Finished paused: ${finished.description} — ${finished.durationMinutes}min`,
  );

  const allTasks = await listTasksByUser(user.id);
  console.log(`\nAll tasks (${allTasks.length}):`);
  for (const task of allTasks) {
    const duration =
      task.status === "active"
        ? formatMinutes(getLiveTrackedMinutes(task))
        : task.durationMinutes != null
          ? formatMinutes(task.durationMinutes)
          : formatMinutes(task.trackedMinutes ?? 0);
    console.log(`  ${task.status}  ${task.description}  (${duration})`);
  }

  const today = await getClosedMinutesToday(user.id, user.timezone);
  const week = await getClosedMinutesLast7Days(user.id, user.timezone);
  console.log(`\nMetrics:`);
  console.log(`  Today: ${formatMinutes(today)}`);
  console.log(`  Week:  ${formatMinutes(week)}`);

  await db.delete(tasks).where(eq(tasks.userId, user.id));
  await db.delete(users).where(eq(users.id, user.id));
  console.log("\n✓ Cleanup done");
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
