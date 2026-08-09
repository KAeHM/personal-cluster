"use server";

import { requireRole } from "@/modules/auth";
import { listPlayersForShare } from "../../application/use-cases/list-players-for-share";

export async function listPlayersForShareAction() {
  await requireRole("admin");
  return listPlayersForShare();
}
