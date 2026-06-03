# MergeMind — Developer Architecture Guide

> A deep-dive into how MergeMind works, app by app, service by service, and request by request.

---

## Overview: The Four Applications

MergeMind is a Turborepo monorepo that is split into four isolated NestJS/Next.js apps, each with a single clear responsibility:

```
apps/
├── webhook/    → Receives GitHub events (entry point for all AI analysis)
├── worker/     → Executes the AI pipeline in the background
├── api/        → Exposes REST endpoints for the Next.js dashboard
└── dashboard/  → The user-facing Next.js frontend
```

They all share **one PostgreSQL database** via the `packages/database` Prisma client, and communicate through **Redis** (for job queuing, caching, and SSE pub/sub).

---

## The Complete Flow: Start to End

Here is exactly what happens when a developer opens a Pull Request on a connected GitHub repository:

```
1. Developer opens a PR on GitHub
2. GitHub sends a POST webhook to apps/webhook
3. webhook creates DB records (PullRequest, AnalysisJob) and enqueues a BullMQ job in Redis
4. apps/worker picks up the job from the Redis queue
5. worker runs the 8-step AI pipeline
6. worker posts inline review comments + Check Run result back to GitHub via Octokit
7. worker publishes live status events to Redis channel "job_updates"
8. apps/api listens on "job_updates" via Redis subscriber
9. api streams those events to the dashboard over SSE (/dashboard/events)
10. dashboard displays the real-time job status to the user
```

---

## apps/webhook — The Entry Point

**What it does:** Receives raw GitHub Webhook POST requests and immediately hands off work to the background queue. It does the absolute minimum to stay fast.

**Key file: `webhook.controller.ts`**
- Validates the `X-Hub-Signature-256` HMAC signature to confirm the request is genuinely from GitHub.
- Handles `pull_request` events (opened, synchronize, reopened) and `push` events.
- On a valid event, it:
  1. Finds or creates the `Organization` and `Repository` in the database.
  2. Creates (or upserts) a `PullRequest` record.
  3. Creates an `AnalysisJob` record with status `QUEUED`.
  4. Pushes a job payload to the `pr-review` BullMQ queue in Redis.
  5. Returns `HTTP 202 Accepted` instantly.

The webhook **never waits** for AI analysis. It hands off and returns.

---

## apps/worker — The AI Engine

This is the brain of MergeMind. It is a long-running NestJS process that continuously pulls jobs from the Redis queue and runs them through a modular AI pipeline.

### `PrReviewProcessor` (Entry Point for every job)

File: `src/github/processors/pr-review.processor.ts`

This is the BullMQ job handler. It orchestrates the high-level flow:

1. Marks the `AnalysisJob` status as `PROCESSING` in the DB and broadcasts this to Redis.
2. Fetches the PR diff (or commit comparison diff) from the GitHub API via `GithubService`.
3. Creates a GitHub **Check Run** on the commit via `GithubCheckRunService` — the PR now shows "MergeMind AI Code Review · In Progress" in GitHub.
4. Calls `AiPipelineService.analyzeAndPersist()` to run the full AI pipeline.
5. Reads the persisted `ReviewResult` and posts inline comments back to GitHub.
6. Completes the GitHub Check Run as `success` or `failure` based on the severity score.
7. Broadcasts the `COMPLETED` or `FAILED` state to Redis.

### The 8-Step AI Pipeline (`AiPipelineService`)

File: `src/pipeline/ai-pipeline.service.ts`

This orchestrates all agent steps in sequence. For each semantic diff chunk:

#### Step 1: `SettingsResolverAgent`
- File: `src/pipeline/agents/settings-resolver.agent.ts`
- Fetches the AI configuration (model name, API key, temperature, etc.) from the Redis cache first. Falls back to PostgreSQL if cache is cold. This avoids a DB round-trip on every single chunk.

#### Step 2: `DiffPreprocessorAgent`
- File: `src/pipeline/agents/diff-preprocessor.agent.ts`
- Calls `chunkDiff()` from `src/github/utils/diff-filter.ts`.
- **Filters** out non-reviewable files (lock files, `.env`, images, auto-generated code).
- **Scrubs** sensitive data (API keys, passwords, private keys) via `ScrubberService` before any data leaves the system.
- **Chunks** large diffs into multiple sub-128k context-safe pieces so no file is dropped.

#### Step 3: `IntentRouterAgent`
- File: `src/pipeline/agents/intent-router.agent.ts`
- Reads the PR title and description using keyword heuristics.
- Routes the job to one of four **AI Personas**:
  - `SECURITY` → Triggered by: `auth`, `vulnerability`, `xss`, `injection`, `cve`
  - `PERFORMANCE` → Triggered by: `perf`, `optimize`, `latency`, `cache`, `memory`
  - `FRONTEND` → Triggered by: `ui`, `react`, `css`, `tailwind`, `component`, `a11y`
  - `GENERAL` → Default fallback

#### Step 4: `PromptBuilderAgent`
- File: `src/pipeline/agents/prompt-builder.agent.ts`
- Constructs the `systemPrompt` and `userPrompt` dynamically.
- Uses the Persona selected by the IntentRouter to morph the system prompt. The Security persona becomes an "Elite Application Security Engineer". The Frontend persona becomes a "Senior Frontend Architect focused on A11y and component architecture."
- Appends the strict **JSON schema** instructions and any custom **repository rules** configured in the dashboard.

#### Step 5: `LlmCallerAgent`
- File: `src/pipeline/agents/llm-caller.agent.ts`
- Calls the **OpenRouter API** (`https://openrouter.ai/api/v1/chat/completions`).
- Supports **Fallback Mode**: If the primary model fails, it automatically retries with the configured fallback model.
- Supports **Consensus Mode**: Fires both the primary AND fallback model concurrently with `Promise.allSettled` and returns both raw responses for later merging.
- Returns: `responseText`, `promptTokens`, `completionTokens`, `latencyMs`, `modelUsed`.

#### Step 6: `ResponseParserAgent`
- File: `src/pipeline/agents/response-parser.agent.ts`
- Attempts to parse the LLM output as valid JSON.
- **Repair Strategy 1:** Strips markdown code fences (` ```json ... ``` `), locates the first `{` and last `}` to extract the raw JSON.
- **Repair Strategy 2:** If JSON.parse still fails, it attempts to count open/close braces & brackets and appends the missing closing characters.
- **Self-Correction ReAct Loop:** If both repair strategies fail, it does NOT give up. It constructs a correction prompt telling the LLM *exactly what syntax error was encountered and what raw text it returned*, then re-invokes `LlmCallerAgent`. This loop retries up to **2 times** before raising a hard error.

#### Step 7: `SeverityScorerAgent`
- File: `src/pipeline/agents/severity-scorer.agent.ts`
- Validates and normalizes the severity score (0–100).
- Applies push-event-specific filtering (e.g. stricter thresholds for direct pushes vs. PRs).

#### Step 8: `ReviewPersisterAgent`
- File: `src/pipeline/agents/review-persister.agent.ts`
- Persists the `ReviewResult` and all `ReviewComment` records to PostgreSQL.
- Persists the `AiUsageLog` (tokens, cost, latency, model) for billing/analytics.

### Supporting Services in `apps/worker`

| Service | File | What it does |
|---|---|---|
| `GithubService` | `src/github/services/github.service.ts` | GitHub REST API client (diff fetching, posting comments/reviews) |
| `GithubCheckRunService` | `src/github/services/github-check-run.service.ts` | Creates & completes GitHub CI/CD Check Runs |
| `EventBroadcasterService` | `src/github/services/event-broadcaster.service.ts` | Publishes job state updates to the Redis `job_updates` channel |
| `ScrubberService` | `src/github/services/scrubber.service.ts` | Redacts secrets (API keys, passwords, private keys) from diffs |
| `SettingsService` | `src/settings/settings.service.ts` | CRUD for AI & GitHub settings with full Redis caching |

---

## apps/api — The Dashboard Backend

**What it does:** Exposes a secured REST API that the Next.js dashboard talks to for configuration and data visualization. All endpoints require an `X-Api-Key` header.

### Key Modules

**`ReviewsController`** (`src/github/controllers/reviews.controller.ts`)
- `GET /dashboard/stats` — PR counts, severity breakdowns, comment counts
- `GET /dashboard/repositories` — List of active tracked repositories
- `GET /dashboard/pull-requests` — Paginated PR list with review status
- `GET /dashboard/reviews/:id` — Full review result with all comments
- `GET /dashboard/jobs` — Recent analysis jobs with status & progress
- `POST /dashboard/apply-fix` — Applies an AI suggestion as a real commit to GitHub
- **`GET /dashboard/events`** — **SSE stream** of real-time job status updates

**`SettingsController`** (`src/settings/settings.controller.ts`)
- Full CRUD for AI settings (model selection, temperature, token limits, consensus mode) and GitHub App credentials (with encryption at rest).

**`RepositoriesModule`** (`src/repositories/`)
- A clean repository pattern layer that abstracts all Prisma calls from the controllers into dedicated repository classes:
  - `PullRequestRepository`, `RepositoryRepository`, `ReviewResultRepository`, `AiUsageLogRepository`, `RepositoryRuleRepository`, `JobRepository`

**`SseService`** (`src/github/services/sse.service.ts`)
- Subscribes to the Redis `job_updates` Pub/Sub channel on startup.
- Wraps incoming events into an RxJS `Subject<JobEvent>`.
- `ReviewsController` maps this observable into an NestJS `@Sse()` endpoint that uses the native HTTP `text/event-stream` protocol.

---

## apps/dashboard — The Next.js Frontend

**What it does:** Provides the user interface for configuration, monitoring, and viewing AI review results.

Key pages:
- **Dashboard** — Live stats: total PRs reviewed, severity breakdown, active repositories
- **Pull Requests** — List of all analyzed PRs with severity scores and status badges
- **Review Detail** — Full AI-generated summary, severity score, and all inline comments
- **Settings** — AI model configuration, GitHub App credentials, Repository Rules
- **Jobs** — Recent analysis job history with live status (connected to the SSE stream)

---

## packages/database — Shared Prisma Schema

**What it does:** Defines the single source of truth for the database schema, shared across `api`, `worker`, and `webhook`.

Key models:
- `Organization` — GitHub App installation
- `Repository` — Connected repos
- `PullRequest` — PR metadata
- `AnalysisJob` — Background job status tracker (`QUEUED` → `PROCESSING` → `COMPLETED` / `FAILED`)
- `ReviewResult` — AI-generated review output (summary, severity score)
- `ReviewComment` — Individual inline code comments (filePath, lineNumber, severity, type, suggestion)
- `AiUsageLog` — Per-request LLM token usage & latency logging
- `AiSettings` — LLM configuration (model, temperature, API key encrypted)
- `GitHubSettings` — GitHub App credentials (App ID, private key encrypted)
- `RepositoryRule` — Custom per-repo review rules

---

## Data Flow Diagram

```
                         ┌─────────────────────────────────────┐
                         │           GitHub Platform            │
                         │   (PR opened / commit pushed)        │
                         └──────────────┬──────────────────────┘
                                        │ Webhook POST
                                        ▼
                         ┌─────────────────────────────────────┐
                         │         apps/webhook                 │
                         │  - Validates HMAC signature          │
                         │  - Creates DB records                │
                         │  - Enqueues job in Redis/BullMQ      │
                         └──────────────┬──────────────────────┘
                                        │ Job in Redis Queue
                                        ▼
                         ┌─────────────────────────────────────┐
                         │         apps/worker                  │
                         │  PrReviewProcessor picks up job      │
                         │  ┌───────────────────────────────┐  │
                         │  │  AI Pipeline (8 Agents)        │  │
                         │  │  1. SettingsResolverAgent      │  │
                         │  │  2. DiffPreprocessorAgent      │  │
                         │  │  3. IntentRouterAgent          │  │
                         │  │  4. PromptBuilderAgent         │  │
                         │  │  5. LlmCallerAgent             │  │
                         │  │  6. ResponseParserAgent        │  │
                         │  │  7. SeverityScorerAgent        │  │
                         │  │  8. ReviewPersisterAgent       │  │
                         │  └───────────────────────────────┘  │
                         │  EventBroadcasterService             │
                         └───────┬──────────────────┬──────────┘
                                 │                  │
                     Publishes   │                  │ Posts comments
                     to Redis    │                  │ + Check Run
                                 ▼                  ▼
                    ┌────────────────┐    ┌──────────────────────┐
                    │  Redis Pub/Sub  │    │    GitHub Platform    │
                    │ "job_updates"  │    │  (Inline comments,   │
                    └───────┬────────┘    │   Check Run: ✅/❌)  │
                            │             └──────────────────────┘
                            │ Subscribe
                            ▼
                    ┌────────────────┐
                    │    apps/api    │
                    │  SseService    │
                    │  subscribers   │
                    └───────┬────────┘
                            │ SSE stream (/dashboard/events)
                            ▼
                    ┌────────────────┐
                    │apps/dashboard  │
                    │ (Next.js UI)   │
                    │ Live job status│
                    │ Review results │
                    └────────────────┘
```

---

## Redis Usage Summary

| Key / Channel | Used By | Purpose |
|---|---|---|
| `ai:settings:raw` | `api` + `worker` SettingsService | Cached AI configuration (5 min TTL) |
| `github:settings:raw` | `api` + `worker` SettingsService | Cached GitHub App credentials (5 min TTL) |
| BullMQ `pr-review` queue | `webhook` → `worker` | Durable job queue for AI analysis tasks |
| Pub/Sub `job_updates` | `worker` → `api` | Real-time job status events for SSE streaming |

---

## Security Notes

- All GitHub App private keys and OpenRouter API keys are **encrypted at rest** using AES-256 (via the `ENCRYPTION_KEY` environment variable) before being stored in PostgreSQL.
- All dashboard API endpoints are protected by an `X-Api-Key` header guard.
- The webhook endpoint validates the HMAC-SHA256 signature of every incoming GitHub event.
- The `ScrubberService` strips all detected secrets, private keys, and password patterns from diffs before they are ever sent to any external LLM API.
