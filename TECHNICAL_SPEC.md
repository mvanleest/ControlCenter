# Control Center Technical Specification

## 1. Purpose

Control Center is system to run AI-only company.

Initial company target is `Digital Galore B.V.`, Dutch company that provides:

- domain registrations
- AWS hosting
- technical consultancy
- Google Workspace subscriptions

Control Center is system to manage, observe, configure, and intervene in AI agents that operate company.

v1 must be buildable by AI from this document without filling gaps by guesswork.

## 2. v1 Scope

v1 must include:

- operations dashboard
- agent configuration UI and API
- manual intervention UI and API
- seeded workflows for `CEO`, `HR`, and `CTO` agents
- OpenAI provider integration using `Responses API`
- provider adapter interface that reserves future support for `OpenCode` and `Anthropic`

v1 must support single company only.

v1 must support single human admin only.

## 3. v1 Non-Goals

v1 must not include:

- multi-company tenancy
- external business system integrations
- non-OpenAI providers active in runtime
- agent config edits during run
- manual human takeover of agent run
- long-term retention beyond `7 days`
- secrets stored in environment variables

## 4. Required Technology

- `TypeScript` latest stable
- `pnpm`
- `SST` latest stable
- AWS Lambda runtime `nodejs24.x`
- `React + Vite`
- `Hono`
- `DynamoDB`
- `S3`
- `SQS`
- `ApiGatewayV2 WebSocket`

## 5. Monorepo Shape

Repository is `pnpm` monorepo.

Use current workspace layout:

- `apps/*` for deployable applications
- `packages/*` for shared libraries

Suggested v1 package layout:

- `apps/web` for `React + Vite` admin application
- `packages/api` for Hono Lambda API runtime code and WebSocket/worker handlers
- `packages/domain` for shared types, schemas, domain logic
- `packages/provider-adapters` for provider abstraction and OpenAI adapter
- `packages/ui` only if shared UI code becomes necessary

Do not add extra packages unless needed by build boundaries.

## 6. Product Model

Control Center manages company through agents.

Initial seeded agents:

- `CEO`: review company status, prioritize work, approve major actions
- `HR`: create and update agents, assign tools and budgets and capabilities, review performance
- `CTO`: create technical tasks, dispatch implementation runs, review failures

Agents must be configurable, but v1 starts with seeded defaults for these three roles.

## 7. User Model

v1 has one human user role only:

- `Admin`

Admin can:

- log in
- view dashboard
- create and update agents
- create and update tasks
- view runs and run history
- approve or reject workflow stages
- pause, resume, stop, and retry runs
- upload and manage knowledge documents
- view metrics and cost data

No RBAC required in v1.

## 8. Localization

UI must be bilingual:

- English (`en`)
- Dutch (`nl`)

UI must support user-selectable locale.

Architecture should allow more locales later, but only `en` and `nl` are required in v1.

## 9. High-Level Architecture

System must use:

- `SST Router` as root routing layer
- `StaticSite` for Vite frontend
- single AWS Lambda for REST API using `Hono`
- `ApiGatewayV2 WebSocket` for realtime dashboard updates
- `SQS` for async run execution
- `DynamoDB` for structured operational data
- `S3` for artifacts and large payload storage

Browser UI must call same public REST API paths used by system clients.

WebSocket auth should reuse REST auth model where practical.

## 10. Frontend Architecture

Frontend must be `React + Vite` SPA.

Frontend responsibilities:

- login screen
- dashboard views
- agent management screens
- task management screens
- run detail screens
- approval screens
- metrics and cost screens
- knowledge document management screens
- realtime updates via WebSocket
- locale switching between `en` and `nl`

Frontend auth behavior:

- login screen accepts username and password
- successful login returns bearer token
- token stored in browser memory only
- frontend sends `Authorization: Bearer <token>` on API requests

Do not persist auth token in local storage in v1.

## 11. Backend Architecture

Backend must use one Lambda function with many `Hono` routes.

Backend responsibilities:

- auth endpoint
- agent CRUD
- task CRUD
- run operations
- approval operations
- knowledge document operations
- metrics and dashboard queries
- WebSocket publish support
- queue orchestration support
- provider adapter dispatch

Keep REST API in one Lambda until proven need for separation.

## 12. Realtime Architecture

Realtime transport must use `ApiGatewayV2 WebSocket`.

Use WebSocket for:

- dashboard status updates
- run state changes
- approval state changes
- metrics refresh triggers
- run event streaming summaries

Do not make WebSocket primary control plane. Control actions must remain REST operations.

WebSocket should push normalized events derived from run and workflow state changes.

## 13. Auth and Session Model

v1 auth is simple by design.

Requirements:

- credentials are stored in `SST secrets`
- no environment variable secrets
- login endpoint validates username and password against secret-backed values
- login success returns bearer token
- client stores token in browser memory only
- API authorization uses `Authorization: Bearer <token>`
- WebSocket connection auth should use same bearer token model if feasible with gateway constraints

v1 identity store is hardcoded and single-admin only.

No refresh token requirement in v1 unless needed to support reasonable session lifetime during single active browser session.

## 14. Provider Strategy

Provider architecture must support multiple providers, but v1 runtime must implement only OpenAI.

Provider roadmap posture:

- `OpenAI`: implemented in v1
- `OpenCode`: reserved behind adapter interface
- `Anthropic`: reserved behind adapter interface

Do not build provider-specific business logic directly into workflow engine.

## 15. OpenAI Integration

v1 must use `OpenAI Responses API`.

Do not depend on CLI orchestration as core runtime mechanism.

OpenAI integration must support:

- request/response execution
- streaming events where needed
- tool call handling through normalized runtime interface
- usage and cost extraction
- normalized error mapping
- file and artifact references where applicable

## 16. Provider Adapter Contract

Provider adapter layer must define common contract for runtime.

Minimum contract responsibilities:

- model invocation
- streaming event translation
- tool call translation
- usage and cost mapping
- normalized error mapping
- file and artifact reference mapping

Provider-specific extras may exist behind adapter metadata, but core workflow engine must consume normalized contract.

## 17. Runtime Execution Model

v1 execution model must be:

- queued async jobs
- persisted workflow state
- per-run thread/history

This means:

- `Task` represents business work item
- `Run` represents one execution attempt for task
- `RunStep` represents atomic workflow step/state transition
- thread/history persists messages and major events for each run
- queue advances workflow execution
- approvals pause workflow until human decision exists

Do not build generic BPMN engine in v1.

Do not build chat-only free-form execution loop in v1.

## 18. Queue and Retry Model

Async execution must use `SQS` first.

Runtime flow:

- API or internal event creates or resumes run
- message placed on queue
- worker consumes queue message
- worker loads current run state
- worker executes next workflow stage or provider call
- worker writes state changes
- worker emits normalized domain events
- worker enqueues follow-up work if next stage exists

Retry behavior:

- incremental backoff
- maximum `3` retries
- retry only when failure category is retryable

Scheduled timeout and retry support may be added where required by long-running or stalled execution, but queue remains primary progression mechanism.

## 19. Approval Model

Approval model is stage-based per workflow.

Default approval stages for v1:

- before execution
- before risky tool action
- before final completion
- after failure before retry

Approval model is single human approver only.

Approval decision values must include:

- `approved`
- `rejected`
- `needs_changes`

Rejection or `needs_changes` must pause or redirect run according to workflow rules.

## 20. Manual Intervention Model

v1 manual intervention actions must include:

- pause run
- resume run
- stop run
- retry run
- approve or reject workflow stage
- edit task

v1 must not include:

- edit agent config during run
- take over manually as human operator inside agent run

## 21. Internal Tool Model

v1 internal tool categories:

- task manager
- agent manager
- run control
- approvals
- knowledge/doc access
- file/artifact store
- metrics/cost viewer

v1 tools are internal only.

Do not include external integrations in v1.

Tool execution must be mediated by runtime and logged as part of run history with secret redaction applied.

## 22. Seeded Workflows

### CEO Workflow Defaults

- review company status
- prioritize work
- approve major actions

### HR Workflow Defaults

- create and update agents
- assign tools, budgets, and capabilities
- review performance

### CTO Workflow Defaults

- create technical tasks
- dispatch implementation runs
- review failures

These are seeded defaults, not hard-coded final behavior model. Admin must be able to configure agents while preserving seeded starting point.

## 23. Domain Model

v1 must define explicit domain entities.

Minimum entities:

- `Agent`
- `Task`
- `Run`
- `RunStep`
- `Approval`
- `Tool`
- `Artifact`
- `KnowledgeDocument`
- `WorkflowDefinition`
- `WorkflowStage`

### Agent

Represents configurable agent definition.

Minimum fields:

- `id`
- `roleKey` such as `ceo`, `hr`, `cto`
- `displayName`
- `description`
- `provider`
- `model`
- `systemPrompt`
- `enabledTools`
- `budgetConfig`
- `workflowDefinitionId`
- `status`
- timestamps

### Task

Represents business work item.

Minimum fields:

- `id`
- `title`
- `description`
- `status`
- `priority`
- `requestedBy`
- `assignedAgentId`
- `workflowType`
- `metadata`
- timestamps

### Run

Represents one execution attempt for task.

Minimum fields:

- `id`
- `taskId`
- `agentId`
- `status`
- `currentStage`
- `retryCount`
- `startedAt`
- `endedAt`
- `summary`
- `providerUsage`
- `cost`
- timestamps

### RunStep

Represents atomic workflow stage execution record.

Minimum fields:

- `id`
- `runId`
- `stageKey`
- `status`
- `inputRef`
- `outputRef`
- `errorRef`
- `attempt`
- timestamps

### Approval

Represents human decision gate.

Minimum fields:

- `id`
- `runId`
- `stageKey`
- `status`
- `decision`
- `comment`
- `decidedBy`
- `decidedAt`
- timestamps

### Tool

Represents tool definition exposed to agents.

Minimum fields:

- `id`
- `key`
- `displayName`
- `category`
- `enabled`
- `riskLevel`
- timestamps

### Artifact

Represents stored file or large blob.

Minimum fields:

- `id`
- `type`
- `storageKey`
- `contentType`
- `size`
- `sourceKind`
- related entity references
- timestamps

### KnowledgeDocument

Represents uploaded or curated knowledge item.

Minimum fields:

- `id`
- `title`
- `sourceType`
- `storageKey`
- `language`
- `tags`
- `status`
- timestamps

### WorkflowDefinition and WorkflowStage

Represent workflow structure and stage gates.

Minimum capabilities:

- ordered stages
- approval stage marking
- risky action stage marking
- completion stage marking
- retry stage marking

## 24. Storage Design

Use `DynamoDB` for operational records and queryable state.

Use `S3` for:

- uploaded documents
- run artifacts
- large prompts or responses when too large for practical item storage
- detailed tool I/O payloads when large
- error payloads when large

Guidance:

- store searchable metadata in `DynamoDB`
- store large blobs in `S3`
- use references between `DynamoDB` records and `S3` objects

## 25. Knowledge and Document Access

v1 knowledge access scope includes:

- uploaded documents
- curated company knowledge base

Knowledge layer must not depend on external integrations in v1.

Knowledge documents should support bilingual content where available.

This spec does not require full retrieval-augmented generation platform design beyond making uploaded and curated knowledge available to runtime through internal tooling.

## 26. Logging and Audit

v1 must log full model I/O.

Requirements:

- capture prompts
- capture model responses
- capture tool inputs and outputs
- capture run state transitions
- capture approval events
- capture intervention actions
- capture provider usage and cost

Secret handling requirement:

- redact secrets always

Audit records must make human intervention traceable.

## 27. Metrics and Cost Visibility

v1 metrics must include:

- run counts
- success and failure rates
- latency
- token usage
- provider and model cost
- approval wait time

Dashboard should expose metrics at minimum for:

- overall system
- by agent
- by workflow
- by recent time window inside retention period

## 28. Retention and Cleanup

Retention period for all v1 stored data is `7 days`.

This includes:

- operational records
- run logs
- model I/O
- approvals
- artifacts
- uploaded and curated documents if stored in system
- metrics source data

System must include cleanup mechanism aligned with `7 day` retention.

## 29. API Design Principles

API style must be `REST`.

API must be designed for same use by:

- browser UI
- future automation clients
- internal system components where practical

General principles:

- resource-oriented routes
- explicit state transition endpoints for run controls
- stable response envelopes
- structured error responses
- bearer token auth

## 30. REST Endpoint Groups

Minimum endpoint groups required:

- `POST /auth/login`
- `GET /dashboard/summary`
- `GET /dashboard/metrics`
- `GET /agents`
- `POST /agents`
- `GET /agents/:id`
- `PATCH /agents/:id`
- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `GET /runs`
- `POST /runs`
- `GET /runs/:id`
- `POST /runs/:id/pause`
- `POST /runs/:id/resume`
- `POST /runs/:id/stop`
- `POST /runs/:id/retry`
- `GET /runs/:id/events`
- `GET /approvals`
- `POST /approvals/:id/approve`
- `POST /approvals/:id/reject`
- `POST /approvals/:id/needs-changes`
- `GET /knowledge-documents`
- `POST /knowledge-documents`
- `GET /knowledge-documents/:id`
- `DELETE /knowledge-documents/:id`
- `GET /artifacts/:id`

Exact request and response schemas should be defined in implementation using shared TypeScript schemas.

## 31. WebSocket Event Model

WebSocket events must be normalized and small.

Event families should include:

- `run.created`
- `run.updated`
- `run.completed`
- `run.failed`
- `run.paused`
- `run.resumed`
- `approval.created`
- `approval.updated`
- `dashboard.updated`
- `metrics.updated`

Prefer sending references and summaries over full payload blobs.

Client can refetch REST resources when fuller state is needed.

## 32. Security and Secrets

Security requirements for v1:

- use `SST secrets`
- avoid environment variables where possible
- never store raw secrets in logs
- redact secrets from model I/O and tool I/O logs
- keep bearer token handling simple and explicit

This spec does not require advanced enterprise auth in v1.

## 33. Deployment and Infrastructure with SST

Infrastructure must be defined with `SST`.

At minimum, SST app must provision:

- router
- static site
- REST API Lambda
- WebSocket API
- SQS queue
- DynamoDB tables
- S3 bucket(s)
- required secrets

v1 needs `dev` environment only.

Architecture should not block future `staging` and `prod`, but no multi-environment rollout requirements are part of v1.

## 34. Build Constraints for AI Implementation

AI implementation must follow these constraints:

- do not add external integrations in v1
- do not add multi-tenant design complexity in v1
- do not replace single Lambda REST design with microservices
- do not replace queue-driven runtime with generic workflow engine
- do not store auth token persistently in browser storage
- do not use environment variables for secrets when SST secrets can be used
- do not activate non-OpenAI providers in runtime

When detail is not defined in this document, choose smallest implementation that preserves listed requirements and keeps extension paths open.

## 35. Future Evolution

Future versions may add:

- multi-company tenancy
- external integrations for company operations
- active `OpenCode` and `Anthropic` providers
- more locales
- stronger auth and RBAC
- richer workflow editor
- manual operator takeover features
- longer retention and audit policies

These are future items only. Do not pull them into v1 build unless explicitly requested.
