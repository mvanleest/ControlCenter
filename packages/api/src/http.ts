import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { handle } from "hono/aws-lambda";
import {
  agentCreateSchema,
  agentUpdateSchema,
  approvalDecisionSchema,
  knowledgeDocumentCreateSchema,
  loginRequestSchema,
  runCreateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  type Agent,
  type ApprovalDecision,
  type KnowledgeDocument,
  type Run,
  type Task,
} from "@control-center/domain";
import {
  appendRunEvent,
  findAgent,
  findApproval,
  findKnowledgeDocument,
  findRun,
  findTask,
  getDashboardMetrics,
  getDashboardSummary,
  listRunEvents,
  nextId,
  requireItem,
  store,
  touch,
  updateRunStatus,
} from "./data";
import { resources } from "./resources";

type Variables = {
  authToken: string;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", cors());

app.use("*", async (c, next) => {
  c.set("authToken", resources.AdminToken.value);

  if (c.req.path === "/auth/login" || c.req.path === "/health") {
    await next();
    return;
  }

  const header = c.req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token || token !== c.get("authToken")) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  await next();
});

app.get("/health", (c) => c.json({ ok: true, service: "control-center-api" }));

app.post("/auth/login", zValidator("json", loginRequestSchema), (c) => {
  const body = c.req.valid("json");

  if (body.username !== resources.AdminUsername.value || body.password !== resources.AdminPassword.value) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  return c.json({ token: resources.AdminToken.value, expiresInSeconds: 28_800 });
});

app.get("/dashboard/summary", (c) => c.json(getDashboardSummary()));
app.get("/dashboard/metrics", (c) => c.json(getDashboardMetrics()));

app.get("/agents", (c) => c.json(store.agents));

app.post("/agents", zValidator("json", agentCreateSchema), (c) => {
  const body = c.req.valid("json");
  const now = new Date().toISOString();

  const agent: Agent = {
    id: nextId("agent"),
    roleKey: body.roleKey,
    displayName: body.displayName,
    description: body.description,
    provider: body.provider,
    model: body.model,
    systemPrompt: body.systemPrompt,
    enabledTools: body.enabledTools,
    budgetConfig: body.budgetConfig,
    workflowDefinitionId: body.workflowDefinitionId,
    status: body.status,
    createdAt: now,
    updatedAt: now,
  };

  store.agents.push(agent);
  return c.json(agent, 201);
});

app.get("/agents/:id", (c) => {
  const agent = requireItem(findAgent(c.req.param("id")), "Agent not found");
  return c.json(agent);
});

app.patch("/agents/:id", zValidator("json", agentUpdateSchema), (c) => {
  const agent = requireItem(findAgent(c.req.param("id")), "Agent not found");
  const body = c.req.valid("json");

  Object.assign(agent, body);
  touch(agent);

  return c.json(agent);
});

app.get("/tasks", (c) => c.json(store.tasks));

app.post("/tasks", zValidator("json", taskCreateSchema), (c) => {
  const body = c.req.valid("json");
  const now = new Date().toISOString();

  const task: Task = {
    id: nextId("task"),
    title: body.title,
    description: body.description,
    status: body.status,
    priority: body.priority,
    requestedBy: body.requestedBy,
    assignedAgentId: body.assignedAgentId,
    workflowType: body.workflowType,
    metadata: body.metadata,
    createdAt: now,
    updatedAt: now,
  };

  store.tasks.push(task);
  return c.json(task, 201);
});

app.get("/tasks/:id", (c) => {
  const task = requireItem(findTask(c.req.param("id")), "Task not found");
  return c.json(task);
});

app.patch("/tasks/:id", zValidator("json", taskUpdateSchema), (c) => {
  const task = requireItem(findTask(c.req.param("id")), "Task not found");
  Object.assign(task, c.req.valid("json"));
  touch(task);
  return c.json(task);
});

app.get("/runs", (c) => c.json(store.runs));

app.post("/runs", zValidator("json", runCreateSchema), (c) => {
  const body = c.req.valid("json");
  const now = new Date().toISOString();
  const run: Run = {
    id: nextId("run"),
    taskId: body.taskId,
    agentId: body.agentId,
    status: "queued",
    currentStage: "before_execution",
    retryCount: 0,
    startedAt: now,
    summary: "Run queued.",
    providerUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      model: body.model,
      provider: body.provider,
    },
    cost: 0,
    createdAt: now,
    updatedAt: now,
  };

  store.runs.unshift(run);
  appendRunEvent(run.id, "run.created", "Run queued from API request.");
  return c.json(run, 201);
});

app.get("/runs/:id", (c) => {
  const run = requireItem(findRun(c.req.param("id")), "Run not found");
  return c.json(run);
});

app.post("/runs/:id/pause", (c) => {
  const run = requireItem(findRun(c.req.param("id")), "Run not found");
  return c.json(updateRunStatus(run, "paused", run.currentStage, "Run paused by admin."));
});

app.post("/runs/:id/resume", (c) => {
  const run = requireItem(findRun(c.req.param("id")), "Run not found");
  return c.json(updateRunStatus(run, "in_progress", "resumed", "Run resumed by admin."));
});

app.post("/runs/:id/stop", (c) => {
  const run = requireItem(findRun(c.req.param("id")), "Run not found");
  return c.json(updateRunStatus(run, "stopped", "stopped", "Run stopped by admin."));
});

app.post("/runs/:id/retry", (c) => {
  const run = requireItem(findRun(c.req.param("id")), "Run not found");
  run.retryCount += 1;
  return c.json(updateRunStatus(run, "queued", "after_failure_before_retry", "Run queued for retry."));
});

app.get("/runs/:id/events", (c) => c.json(listRunEvents(c.req.param("id"))));

app.get("/approvals", (c) => c.json(store.approvals));

function handleApprovalDecision(approvalId: string, decision: ApprovalDecision) {
  const approval = requireItem(findApproval(approvalId), "Approval not found");
  const run = requireItem(findRun(approval.runId), "Run not found");

  approval.status = decision === "approved" ? "completed" : "pending";
  approval.decision = decision;
  approval.decidedBy = "admin";
  approval.decidedAt = new Date().toISOString();
  touch(approval);

  if (decision === "approved") {
    updateRunStatus(run, "completed", "completed", "Run completed after admin approval.");
  } else if (decision === "rejected") {
    updateRunStatus(run, "paused", approval.stageKey, "Run rejected by admin.");
  } else {
    updateRunStatus(run, "paused", approval.stageKey, "Run marked as needing changes by admin.");
  }

  appendRunEvent(run.id, "approval.updated", `Approval ${decision} by admin.`);

  return approval;
}

app.post("/approvals/:id/approve", (c) => c.json(handleApprovalDecision(c.req.param("id"), "approved")));
app.post("/approvals/:id/reject", (c) => c.json(handleApprovalDecision(c.req.param("id"), "rejected")));
app.post("/approvals/:id/needs-changes", (c) => c.json(handleApprovalDecision(c.req.param("id"), "needs_changes")));

app.get("/knowledge-documents", (c) => c.json(store.knowledgeDocuments));

app.post("/knowledge-documents", zValidator("json", knowledgeDocumentCreateSchema), (c) => {
  const body = c.req.valid("json");
  const now = new Date().toISOString();

  const document: KnowledgeDocument = {
    id: nextId("doc"),
    title: body.title,
    sourceType: body.sourceType,
    storageKey: body.storageKey,
    language: body.language,
    tags: body.tags,
    status: body.status,
    createdAt: now,
    updatedAt: now,
  };

  store.knowledgeDocuments.unshift(document);
  return c.json(document, 201);
});

app.get("/knowledge-documents/:id", (c) => {
  const document = requireItem(findKnowledgeDocument(c.req.param("id")), "Knowledge document not found");
  return c.json(document);
});

app.delete("/knowledge-documents/:id", (c) => {
  const id = c.req.param("id");
  const index = store.knowledgeDocuments.findIndex((document) => document.id === id);

  if (index === -1) {
    throw new HTTPException(404, { message: "Knowledge document not found" });
  }

  const [deleted] = store.knowledgeDocuments.splice(index, 1);
  return c.json(deleted);
});

app.get("/artifacts/:id", (c) => {
  const id = c.req.param("id");
  return c.json({
    id,
    type: "run-log",
    storageKey: `artifacts/${id}.json`,
    contentType: "application/json",
  });
});

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }

  return c.json({ error: error.message || "Internal server error" }, 500);
});

export const handler = handle(app);
