# AGENTS

## Current State

- v1 workspace now has concrete packages for frontend, SST infrastructure/API, shared domain types, and provider adapters.
- Current implementation is scaffold-first: many API routes use seeded in-memory data even though infrastructure defines DynamoDB, S3, SQS, and WebSocket resources.

## Workspace Facts

- Package manager is `pnpm` and the root `package.json` pins `packageManager` to `pnpm@10.33.0`.
- Workspaces are defined only by `pnpm-workspace.yaml`:
  - `apps/*`
  - `packages/*`
- Root scripts:
  - `pnpm dev` runs `sst dev` from repo root using root `sst.config.ts`
  - `pnpm build` runs workspace build scripts
  - `pnpm typecheck` runs workspace typecheck scripts
  - `pnpm test` runs workspace Vitest scripts
  - `pnpm lint` currently aliases to TypeScript checks, not ESLint

## Package Boundaries

- `infra/`: centralized SST infrastructure composition from root `sst.config.ts`
- `infra/*.ts` files export SST resources directly; root `sst.config.ts` auto-imports every file in `infra/` and merges any exported `outputs`
- `packages/api`: Hono Lambda API, WebSocket handlers, queue worker runtime code
- `apps/web`: React + Vite admin SPA
- `packages/domain`: shared zod schemas, types, seeded agent data
- `packages/provider-adapters`: provider abstraction and OpenAI Responses adapter

## Practical Guidance

- Run `source "$HOME/.nvm/nvm.sh" && nvm use` before repo commands. Root `.nvmrc` pins Node `v24`.
- When adding a new project, place deployable apps in `apps/` and shared libraries in `packages/`.
- Run `pnpm install` from the repo root after creating or changing workspace packages so the root lockfile stays current.
- Keep `pnpm-lock.yaml` committed. `.gitignore` excludes `node_modules/`, `dist/`, `build/`, and `.DS_Store` only.
- Product and architecture source of truth is `TECHNICAL_SPEC.md`. Follow it for v1 implementation scope and avoid inventing missing features outside that file.
- `packages/api/src/resources.ts` is temporary type shim for SST-linked resources until generated SST resource typing is wired into local typecheck.
- SST autodeploy maps `main` to stage `production`; other branches map to sanitized stage names. Non-prod router domains use `dev.digitalgalore.com` for stage `dev` and `<stage>.dev.digitalgalore.com` for other non-prod stages.
- GitHub Actions deploy workflow uses OIDC with `vars.AWS_REGION`, `secrets.AWS_PRODUCTION_ROLE_ARN`, and `secrets.AWS_NON_PRODUCTION_ROLE_ARN`. `main` deploys to GitHub `production` environment and SST stage `production`; other pushed branches deploy to sanitized branch-name stages.

## Absent So Far

- No `CLAUDE.md`, `.cursor/`, Copilot instructions, CI workflows, or task-runner config were present when this file was written.
- No ESLint setup is configured yet. Tests use Vitest; some workspaces currently rely on `--passWithNoTests` until real tests are added.
