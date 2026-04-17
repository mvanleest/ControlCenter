import {
  type Agent,
  type Approval,
  type DashboardMetrics,
  type DashboardSummary,
  type KnowledgeDocument,
  type Run,
  type RunEvent,
  type Task,
  seededAgents,
} from "@control-center/domain";

const now = new Date().toISOString();

const tasks: Task[] = [
  {
    id: "task-cto-001",
    title: "Bootstrap Control Center monorepo",
    description: "Create initial pnpm workspace and project packages.",
    status: "in_progress",
    priority: "high",
    requestedBy: "admin",
    assignedAgentId: "agent-cto",
    workflowType: "cto-default",
    metadata: { tenant: "digital-galore-bv" },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "task-ceo-001",
    title: "Review weekly company status",
    description: "Summarize open work, cost, and approval bottlenecks.",
    status: "queued",
    priority: "medium",
    requestedBy: "admin",
    assignedAgentId: "agent-ceo",
    workflowType: "ceo-default",
    metadata: { tenant: "digital-galore-bv" },
    createdAt: now,
    updatedAt: now,
  },
];

const runs: Run[] = [
  {
    id: "run-001",
    taskId: "task-cto-001",
    agentId: "agent-cto",
    status: "awaiting_approval",
    currentStage: "before_final_completion",
    retryCount: 0,
    startedAt: now,
    summary: "Initial scaffold created and waiting for admin approval before final completion.",
    providerUsage: {
      promptTokens: 2480,
      completionTokens: 612,
      totalTokens: 3092,
      model: "gpt-5",
      provider: "openai",
    },
    cost: 0.12,
    createdAt: now,
    updatedAt: now,
  },
];

const approvals: Approval[] = [
  {
    id: "approval-001",
    runId: "run-001",
    stageKey: "before_final_completion",
    status: "pending",
    decision: null,
    comment: null,
    decidedBy: null,
    decidedAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: "doc-001",
    title: "Technical Specification",
    sourceType: "uploaded",
    storageKey: "knowledge/technical-spec.md",
    language: "en",
    tags: ["spec", "architecture"],
    status: "ready",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "doc-002",
    title: "Digital Galore Service Catalog",
    sourceType: "curated",
    storageKey: "knowledge/service-catalog.md",
    language: "nl",
    tags: ["company", "services"],
    status: "ready",
    createdAt: now,
    updatedAt: now,
  },
];

const runEventsByRunId: Record<string, RunEvent[]> = {
  "run-001": [
    {
      id: "event-001",
      runId: "run-001",
      type: "run.created",
      summary: "Run created for CTO bootstrap task.",
      createdAt: now,
    },
    {
      id: "event-002",
      runId: "run-001",
      type: "approval.created",
      summary: "Approval requested before final completion.",
      createdAt: now,
    },
  ],
};

export const store = {
  agents: [...seededAgents],
  tasks,
  runs,
  approvals,
  knowledgeDocuments,
  runEventsByRunId,
};

export function getDashboardSummary(): DashboardSummary {
  return {
    companyName: "Digital Galore B.V.",
    activeAgents: store.agents.filter((agent) => agent.status === "active").length,
    openTasks: store.tasks.filter((task) => task.status !== "completed").length,
    activeRuns: store.runs.filter((run) => ["queued", "in_progress", "awaiting_approval"].includes(run.status)).length,
    pendingApprovals: store.approvals.filter((approval) => approval.status === "pending").length,
    latestRuns: store.runs.slice(0, 5),
  };
}

export function getDashboardMetrics(): DashboardMetrics {
  return {
    runCounts: store.runs.length,
    successCount: store.runs.filter((run) => run.status === "completed").length,
    failureCount: store.runs.filter((run) => run.status === "failed").length,
    averageLatencyMs: 18250,
    totalTokens: store.runs.reduce((total, run) => total + run.providerUsage.totalTokens, 0),
    providerModelCost: store.runs.reduce((total, run) => total + run.cost, 0),
    averageApprovalWaitMs: 90_000,
  };
}

export function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function appendRunEvent(runId: string, type: RunEvent["type"], summary: string): void {
  const event: RunEvent = {
    id: nextId("event"),
    runId,
    type,
    summary,
    createdAt: new Date().toISOString(),
  };

  const events = store.runEventsByRunId[runId] ?? [];
  events.push(event);
  store.runEventsByRunId[runId] = events;
}

export function touch<T extends { updatedAt: string }>(item: T): T {
  item.updatedAt = new Date().toISOString();
  return item;
}

export function listRunEvents(runId: string): RunEvent[] {
  return store.runEventsByRunId[runId] ?? [];
}

export function updateRunStatus(run: Run, status: Run["status"], currentStage: string, summary: string): Run {
  run.status = status;
  run.currentStage = currentStage;
  run.summary = summary;
  touch(run);
  appendRunEvent(run.id, "run.updated", summary);
  return run;
}

export function requireItem<T>(value: T | undefined, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

export function findAgent(id: string): Agent | undefined {
  return store.agents.find((agent) => agent.id === id);
}

export function findTask(id: string): Task | undefined {
  return store.tasks.find((task) => task.id === id);
}

export function findRun(id: string): Run | undefined {
  return store.runs.find((run) => run.id === id);
}

export function findApproval(id: string): Approval | undefined {
  return store.approvals.find((approval) => approval.id === id);
}

export function findKnowledgeDocument(id: string): KnowledgeDocument | undefined {
  return store.knowledgeDocuments.find((document) => document.id === id);
}
