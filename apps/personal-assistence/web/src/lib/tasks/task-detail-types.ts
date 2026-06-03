export type TaskEventType = "started" | "paused" | "resumed" | "finished";

export type TaskTimelineEventItem = {
  kind: "event";
  type: TaskEventType;
  occurredAt: string;
  label: string;
  detail?: string;
  segmentMinutes: number | null;
  trackedMinutesAfter: number;
};

export type TaskTimelinePeriodItem = {
  kind: "period";
  startedAt: string;
  endedAt: string | null;
  minutes: number;
  isLive: boolean;
};

export type TaskTimelineItem = TaskTimelineEventItem | TaskTimelinePeriodItem;

export type TaskLinkedMessage = {
  id: string;
  direction: "in" | "out";
  content: string | null;
  createdAt: string;
};

export type TaskDetailResponse = {
  taskId: string;
  description: string;
  groupLabel: string | null;
  status: "active" | "paused" | "closed";
  startedAt: string;
  endedAt: string | null;
  totalWorkedMinutes: number;
  hasEventHistory: boolean;
  items: TaskTimelineItem[];
  messages: TaskLinkedMessage[];
};

export type TaskAction = "pause" | "resume" | "finish";
