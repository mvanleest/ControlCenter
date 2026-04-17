import { z } from "zod";

export const locales = ["en", "nl"] as const;
export type Locale = (typeof locales)[number];

export const providerIds = ["openai", "opencode", "anthropic"] as const;
export type ProviderId = (typeof providerIds)[number];

export const roleKeys = ["ceo", "hr", "cto"] as const;
export type RoleKey = (typeof roleKeys)[number];

export const agentStatusValues = ["active", "paused", "disabled"] as const;
export const taskStatusValues = ["queued", "in_progress", "awaiting_approval", "completed", "cancelled"] as const;
export const taskPriorityValues = ["low", "medium", "high", "critical"] as const;
export const runStatusValues = ["queued", "in_progress", "awaiting_approval", "paused", "completed", "failed", "stopped"] as const;
export const approvalStatusValues = ["pending", "completed"] as const;
export const approvalDecisionValues = ["approved", "rejected", "needs_changes"] as const;
export const knowledgeSourceTypes = ["uploaded", "curated"] as const;
export const knowledgeStatusValues = ["processing", "ready", "failed"] as const;

export type AgentStatus = (typeof agentStatusValues)[number];
export type TaskStatus = (typeof taskStatusValues)[number];
export type TaskPriority = (typeof taskPriorityValues)[number];
export type RunStatus = (typeof runStatusValues)[number];
export type ApprovalStatus = (typeof approvalStatusValues)[number];
export type ApprovalDecision = (typeof approvalDecisionValues)[number];
export type KnowledgeSourceType = (typeof knowledgeSourceTypes)[number];
export type KnowledgeStatus = (typeof knowledgeStatusValues)[number];

export const budgetConfigSchema = z.object({
  maxRunCostUsd: z.number().nonnegative(),
  maxTokensPerRun: z.number().int().positive(),
});

export const agentSchema = z.object({
  id: z.string(),
  roleKey: z.enum(roleKeys),
  displayName: z.string(),
  description: z.string(),
  provider: z.enum(providerIds),
  model: z.string(),
  systemPrompt: z.string(),
  enabledTools: z.array(z.string()),
  budgetConfig: budgetConfigSchema,
  workflowDefinitionId: z.string(),
  status: z.enum(agentStatusValues),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const agentCreateSchema = agentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const agentUpdateSchema = agentCreateSchema.partial();

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(taskStatusValues),
  priority: z.enum(taskPriorityValues),
  requestedBy: z.string(),
  assignedAgentId: z.string(),
  workflowType: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const taskCreateSchema = taskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const providerUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  model: z.string(),
  provider: z.enum(providerIds),
});

export const runSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  agentId: z.string(),
  status: z.enum(runStatusValues),
  currentStage: z.string(),
  retryCount: z.number().int().nonnegative(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  summary: z.string(),
  providerUsage: providerUsageSchema,
  cost: z.number().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const runCreateSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  provider: z.enum(providerIds),
  model: z.string(),
});

export const approvalSchema = z.object({
  id: z.string(),
  runId: z.string(),
  stageKey: z.string(),
  status: z.enum(approvalStatusValues),
  decision: z.enum(approvalDecisionValues).nullable(),
  comment: z.string().nullable(),
  decidedBy: z.string().nullable(),
  decidedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(approvalDecisionValues),
});

export const knowledgeDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: z.enum(knowledgeSourceTypes),
  storageKey: z.string(),
  language: z.enum(locales),
  tags: z.array(z.string()),
  status: z.enum(knowledgeStatusValues),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const knowledgeDocumentCreateSchema = knowledgeDocumentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const dashboardSummarySchema = z.object({
  companyName: z.string(),
  activeAgents: z.number().int().nonnegative(),
  openTasks: z.number().int().nonnegative(),
  activeRuns: z.number().int().nonnegative(),
  pendingApprovals: z.number().int().nonnegative(),
  latestRuns: z.array(runSchema),
});

export const dashboardMetricsSchema = z.object({
  runCounts: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  averageLatencyMs: z.number().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  providerModelCost: z.number().nonnegative(),
  averageApprovalWaitMs: z.number().nonnegative(),
});

export const runEventTypeValues = [
  "run.created",
  "run.updated",
  "run.completed",
  "run.failed",
  "run.paused",
  "run.resumed",
  "approval.created",
  "approval.updated",
  "dashboard.updated",
  "metrics.updated",
] as const;

export const runEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  type: z.enum(runEventTypeValues),
  summary: z.string(),
  createdAt: z.string(),
});

export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type Agent = z.infer<typeof agentSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Run = z.infer<typeof runSchema>;
export type Approval = z.infer<typeof approvalSchema>;
export type KnowledgeDocument = z.infer<typeof knowledgeDocumentSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
export type RunEvent = z.infer<typeof runEventSchema>;

export const seededAgents: Agent[] = [
  {
    id: "agent-ceo",
    roleKey: "ceo",
    displayName: "CEO",
    description: "Reviews company status, prioritizes work, and approves major actions.",
    provider: "openai",
    model: "gpt-5",
    systemPrompt: "Operate as CEO for Digital Galore B.V. Focus on priorities, risk, and approvals.",
    enabledTools: ["task-manager", "approvals", "metrics-cost-viewer", "knowledge-doc-access"],
    budgetConfig: {
      maxRunCostUsd: 10,
      maxTokensPerRun: 20000,
    },
    workflowDefinitionId: "workflow-ceo-default",
    status: "active",
    createdAt: "2026-04-16T00:00:00.000Z",
    updatedAt: "2026-04-16T00:00:00.000Z",
  },
  {
    id: "agent-hr",
    roleKey: "hr",
    displayName: "HR",
    description: "Creates and updates agents, assigns tools and budgets, and reviews performance.",
    provider: "openai",
    model: "gpt-5",
    systemPrompt: "Operate as HR for Digital Galore B.V. Focus on agent configuration and performance governance.",
    enabledTools: ["agent-manager", "approvals", "metrics-cost-viewer", "knowledge-doc-access"],
    budgetConfig: {
      maxRunCostUsd: 8,
      maxTokensPerRun: 18000,
    },
    workflowDefinitionId: "workflow-hr-default",
    status: "active",
    createdAt: "2026-04-16T00:00:00.000Z",
    updatedAt: "2026-04-16T00:00:00.000Z",
  },
  {
    id: "agent-cto",
    roleKey: "cto",
    displayName: "CTO",
    description: "Creates technical tasks, dispatches implementation runs, and reviews failures.",
    provider: "openai",
    model: "gpt-5",
    systemPrompt: "Operate as CTO for Digital Galore B.V. Focus on technical execution, delivery, and failure analysis.",
    enabledTools: ["task-manager", "run-control", "file-artifact-store", "knowledge-doc-access"],
    budgetConfig: {
      maxRunCostUsd: 15,
      maxTokensPerRun: 25000,
    },
    workflowDefinitionId: "workflow-cto-default",
    status: "active",
    createdAt: "2026-04-16T00:00:00.000Z",
    updatedAt: "2026-04-16T00:00:00.000Z",
  },
];
