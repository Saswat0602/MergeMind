# MergeMind — Agentic Workflow Checklist

This checklist tracks the step-by-step progress of making MergeMind a **100% agentic Gen AI system**.

---

## ✅ Phase 1: Service Decomposition (COMPLETE)

- [x] **Webhook App Extraction**
  - [x] Initialize `apps/webhook`
  - [x] Extract `WebhookController` and `WebhookService`
  - [x] Implement Redis deduplication (replacing in-memory `Set`)
  - [x] Add handlers for `installation` and `installation_repositories` events

- [x] **Worker App Extraction**
  - [x] Initialize `apps/worker`
  - [x] Extract `PrReviewProcessor`
  - [x] Configure BullMQ with concurrency limit (3) and exponential backoff retry

- [x] **API App Refactoring**
  - [x] Remove extracted services/controllers from monolith
  - [x] Add authentication guards to `ReviewsController` and Dashboard routes

---

## ✅ Phase 2: Agentic AI Pipeline Refactoring (COMPLETE)

- [x] **Create Pipeline Orchestrator**
  - [x] Create `AiPipelineService` as the central orchestrator

- [x] **Create Agent Steps (Single Responsibility)**
  - [x] `SettingsResolverAgent` — load and decrypt AI + GitHub settings
  - [x] `PromptBuilderAgent` — build system/user prompt, inject org rules
  - [x] `DiffPreprocessorAgent` — filter binary/vendor, scrub secrets
  - [x] `LlmCallerAgent` — call OpenRouter with primary, fallback, and consensus mode
  - [x] `ResponseParserAgent` — parse and validate JSON response
  - [x] `SeverityScorerAgent` — rank, filter noise, merge consensus responses
  - [x] `ReviewPersisterAgent` — save `ReviewResult`, `ReviewComment`, `ReviewMetric`, `AiUsageLog`

- [x] **Integrate Pipeline into Processor**
  - [x] `PrReviewProcessor` delegates entirely to `AiPipelineService`

---

## ✅ Phase 3: Robustness & Standards (COMPLETE)

- [x] **API Validation**
  - [x] Create DTOs with `class-validator` (e.g., `ApplyFixDto`)
  - [x] Add global `ValidationPipe`

- [x] **Error Handling & Response**
  - [x] Create global `GlobalHttpExceptionFilter`
  - [x] Create global response interceptor (`{ success, message, data }`)

---

## 🔲 Phase 4: Data Access & Infrastructure (P2 — REMAINING)

- [ ] **Repository Layer**
  - [ ] Create `repositories/` folder inside `apps/api`
  - [ ] Extract direct Prisma calls from controllers into typed repository classes
  - [ ] Files: `review-result.repository.ts`, `pull-request.repository.ts`, `ai-usage-log.repository.ts`

- [ ] **Caching Strategy (Redis)**
  - [ ] Cache `AiSettings` in Redis (TTL: 5 min) — currently hits DB on every job
  - [ ] Cache `GitHubSettings` in Redis (TTL: 5 min)
  - [ ] Cache `RepositoryRule[]` per repo — invalidate on rule update

- [ ] **Feature Fixes**
  - [ ] Fix `getRepositories()` — remove live GitHub sync from GET, serve from DB only
  - [ ] Update `applyCommitPatch` to support multi-line suggestions (startLine + endLine)

---

## 🔲 Phase 5: True Agentic AI Upgrades (P1 — CRITICAL FOR 100% AGENTIC)

> These are the features that separate an "automated pipeline" from a real **agentic AI system**.

### 5A. Self-Correction ReAct Loop

- [ ] **`ResponseParserAgent` — Retry with corrected prompt on parse failure**
  - [ ] If JSON parse fails, re-call LLM with error context: `"Your last response was invalid JSON. Fix it: {error}. Return only valid JSON."`
  - [ ] Implement max 2 retry attempts before hard fail
  - [ ] Log each correction attempt in `AiUsageLog`

### 5B. Semantic Diff Chunking (Large PR Support)

- [ ] **Chunk large diffs by file, not by character count**
  - [ ] Split diff into per-file chunks in `DiffPreprocessorAgent`
  - [ ] Process each chunk as a separate LLM call if total tokens > threshold (e.g., 4000 tokens)
  - [ ] Aggregate chunk results in `SeverityScorerAgent` before persist
  - [ ] Prevents context window overflow on large PRs (500+ lines)

### 5C. Dynamic Tool Use via Function Calling

- [ ] **Give the LLM tools it can invoke autonomously**
  - [ ] Define tool schema: `read_file(path)`, `search_codebase(query)`, `get_file_history(path)`
  - [ ] Implement tool execution in a new `ToolExecutorAgent`
  - [ ] Implement an agent loop: LLM calls tool → result fed back → LLM continues reasoning
  - [ ] Use OpenRouter's `tools` / `tool_choice` API fields
  - [ ] Example: LLM sees `user.controller.ts` change → calls `read_file("user.service.ts")` to understand impact

### 5D. Multi-Agent Specialization

- [ ] **Split the single LLM call into 3 specialized sub-agents**
  - [ ] `SecurityAgent` — prompt focused only on vulnerabilities, injection, auth flaws
  - [ ] `PerformanceAgent` — prompt focused on N+1 queries, memory leaks, algorithmic complexity
  - [ ] `SynthesisAgent` — receives all sub-agent results, deduplicates, generates final coherent review
  - [ ] Run `SecurityAgent` + `PerformanceAgent` concurrently via `Promise.allSettled`
  - [ ] `SynthesisAgent` runs after both complete

### 5E. Long-Term Repository Memory (RAG)

- [ ] **Add vector store for cross-PR learning**
  - [ ] Install `pgvector` Postgres extension
  - [ ] Add `embedding vector(1536)` column to `ReviewComment` schema
  - [ ] Create `MemoryAgent` — embeds each comment before persisting
  - [ ] On each new PR: query similar past comments from the same repo (top-k similarity)
  - [ ] Inject retrieved memories into `PromptBuilderAgent` as additional context
  - [ ] Example memory injection: `"In PR #42, we established: always use Repository pattern for DB access in this codebase."`

### 5F. GitHub Check Runs (Agent as CI Gate)

- [ ] **Post a GitHub Check Run (pass/fail) as a required status check**
  - [ ] Create check run when job starts (`status: in_progress`)
  - [ ] Update check run on completion with severity score + summary
  - [ ] If `severityScore > 70` → Check fails (can block merge if set as required)
  - [ ] Implement in a new `GitHubCheckRunAgent` called from `PrReviewProcessor`

### 5G. Real-Time Job Status Streaming (SSE)

- [ ] **Server-Sent Events for live pipeline progress in the dashboard**
  - [ ] Add `@Sse('jobs/:id/stream')` endpoint in `apps/api`
  - [ ] Emit events at each pipeline step: `QUEUED → FETCHING_DIFF → AI_ANALYSIS → POSTING → COMPLETED`
  - [ ] Subscribe in the dashboard UI on the Reviews detail page
  - [ ] Replace current polling/manual refresh pattern

---

## 🔲 Phase 6: Production Hardening (P3)

- [ ] **Rate Limiter per Installation**
  - [ ] Limit each GitHub org to max 10 analysis jobs/minute in BullMQ
  - [ ] Use `limiter: { max: 10, duration: 60000 }` on the queue

- [ ] **Prompt Template System (PromptTemplate model exists — unused)**
  - [ ] Seed default templates in DB: `pr-review-v1`, `push-commit-v1`, `security-audit-v1`
  - [ ] Load active template by slug in `PromptBuilderAgent` (replace hardcoded prompt)
  - [ ] Support `version` field for A/B testing and prompt improvement tracking

- [ ] **Diff Result Caching**
  - [ ] SHA-256 hash the cleaned diff content
  - [ ] Store hash → `reviewResultId` in Redis (TTL: 24h)
  - [ ] If same diff pushed again (e.g., force-push), skip LLM call, return cached result

- [ ] **Dashboard Authentication (JWT/GitHub OAuth)**
  - [ ] Replace API-key guard with GitHub OAuth login
  - [ ] Issue JWT on login, validate on all `/dashboard/*` routes
  - [ ] Session management with refresh tokens

- [ ] **Missing Shared Packages (from spec)**
  - [ ] `packages/prompt-engine` — template loader, version manager
  - [ ] `packages/github-sdk` — shared Octokit factory, auth helpers
  - [ ] `packages/utils` — shared crypto, hashing, formatting utilities

- [ ] **Eliminate all `any` types**
  - [ ] Replace `Job<any, any, string>` in processor with typed `PrReviewJobData` interface
  - [ ] Replace `rules?: any[]` in pipeline with `RepositoryRule[]` from shared-types
  - [ ] Strict TypeScript compliance matching `agent.md` spec

---

## 🏁 100% Agentic Score — Definition of Done

| Capability | Status |
|---|---|
| Modular multi-service monorepo | ✅ Done |
| 7-step composable agent pipeline | ✅ Done |
| Primary + Fallback + Consensus LLM | ✅ Done |
| Custom org rule injection into prompts | ✅ Done |
| Encrypted secrets management | ✅ Done |
| Token usage + cost tracking | ✅ Done |
| GitHub App auth (not PAT) | ✅ Done |
| Redis job deduplication | ✅ Done |
| BullMQ retry with backoff | ✅ Done |
| Push commit + PR review posting | ✅ Done |
| **Self-correction ReAct loop** | 🔲 Remaining |
| **Semantic diff chunking** | 🔲 Remaining |
| **Dynamic tool use (function calling)** | 🔲 Remaining |
| **Multi-agent specialization** | 🔲 Remaining |
| **Long-term memory (RAG / pgvector)** | 🔲 Remaining |
| **GitHub Check Runs (CI gate)** | 🔲 Remaining |
| **Real-time SSE job streaming** | 🔲 Remaining |
| Redis caching for settings | 🔲 Remaining |
| Repository data access layer | 🔲 Remaining |
| Prompt template system | 🔲 Remaining |

---
_Updated: 2026-06-03. Phases 1–3 complete. Phase 5 (True Agentic AI) is the next critical milestone._
