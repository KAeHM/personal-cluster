import { getTaskTimeline } from "@/lib/tasks/timeline";
import type { TaskDetailResponse } from "@/lib/tasks/task-detail-types";

export async function getTaskDetail(
  userId: string,
  taskId: string,
  now: Date = new Date(),
): Promise<TaskDetailResponse | null> {
  const timeline = await getTaskTimeline(userId, taskId, now);
  if (!timeline) return null;

  return timeline;
}
