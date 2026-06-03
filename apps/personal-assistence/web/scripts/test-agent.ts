import "dotenv/config";

import { eq } from "drizzle-orm";

import { runAgent } from "../src/lib/ai/agent";
import { db } from "../src/lib/db";
import { tasks, users } from "../src/lib/db/schema";
import { getOrCreateUserByPhone } from "../src/lib/tasks/queries";

const TEST_PHONE = "5511999990002";

const scenarios = [
  "Comecei a trabalhar no relatório mensal",
  "Quais tarefas estão abertas?",
  "Terminei o relatório mensal",
  "Obrigado!",
];

async function main() {
  console.log("=== WhatsApp Time Tracker — Agent Test ===\n");

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set in .env.local");
    process.exit(1);
  }

  const user = await getOrCreateUserByPhone(TEST_PHONE, "Agent Test User");
  console.log(`User: ${user.id} (${user.phone})\n`);

  for (const message of scenarios) {
    console.log(`→ User: ${message}`);

    const result = await runAgent({ userId: user.id, message });

    if (result.toolCalls.length > 0) {
      for (const call of result.toolCalls) {
        console.log(`  ⚙ ${call.toolName}(${JSON.stringify(call.input)})`);
      }
    }

    console.log(`← Agent: ${result.reply}\n`);
  }

  await db.delete(tasks).where(eq(tasks.userId, user.id));
  await db.delete(users).where(eq(users.id, user.id));
  console.log("✓ Cleanup done");
}

main().catch((error) => {
  console.error("Agent test failed:", error);
  process.exit(1);
});
