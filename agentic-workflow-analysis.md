# MergeMind — Agentic Workflow Analysis & Remaining Plan

> **Status as of 2026-06-03:** Phases 1–3 are fully implemented. This document now covers only what remains, and what is needed to elevate MergeMind from a "well-architected pipeline" to a **100% agentic Gen AI system**.

---

## ✅ What Is Already Complete

| Area | Status |
|---|---|
| Service decomposition (webhook / worker / api apps) | ✅ Done |
| Redis deduplication of webhook events | ✅ Done |
| BullMQ queue with concurrency (3) + exponential backoff | ✅ Done |
| `installation` + `installation_repositories` webhook handlers | ✅ Done |
| 7-step modular agentic pipeline (`AiPipelineService`) | ✅ Done |
| `SettingsResolverAgent` — decrypt settings from DB | ✅ Done |
| `DiffPreprocessorAgent` — filter, scrub secrets | ✅ Done |
| `PromptBuilderAgent` — build prompt with org rules | ✅ Done |
| `LlmCallerAgent` — primary, fallback, consensus mode | ✅ Done |
| `ResponseParserAgent` — JSON parse + validate | ✅ Done |
| `SeverityScorerAgent` — noise filter, consensus merge | ✅ Done |
| `ReviewPersisterAgent` — save results, metrics, usage logs | ✅ Done |
| DTOs + global `ValidationPipe` | ✅ Done |
| Global `HttpExceptionFilter` + response interceptor | ✅ Done |
| GitHub App authentication (installation tokens) | ✅ Done |
| PR review + push commit comment posting | ✅ Done |
| Encrypted API key storage (AES) | ✅ Done |
| Token usage + cost tracking (`AiUsageLog`) | ✅ Done |
| Auth guards on dashboard routes | ✅ Done |

---

## 🔲 Remaining — Phase 4: Data Access & Infrastructure (P2)

### 1. Repository Data Access Layer

**Problem:** Controllers and processors directly call `this.prisma.*` inline. Hard to test, violates single-responsibility, and couples DB schema to API surface.

**What to build:**
```
apps/api/src/repositories/
  review-result.repository.ts
  pull-request.repository.ts
  ai-usage-log.repository.ts
  repository-rule.repository.ts
```

Each repository wraps Prisma calls and exposes typed methods: `findById()`, `findByRepo()`, `create()`, `delete()`.

---

### 2. Redis Caching for Settings

**Problem:** `SettingsResolverAgent` fetches `AiSettings` and `GitHubSettings` from Postgres on **every single job execution**. Under load this creates hundreds of unnecessary DB reads.

**What to implement:**
```typescript
// In SettingsResolverAgent
const cached = await this.redis.get('ai:settings');
if (cached) return JSON.parse(cached);
const settings = await this.prisma.aiSettings.findFirst();
await this.redis.set('ai:settings', JSON.stringify(settings), 'EX', 300); // 5-min TTL
```

Same pattern for `GitHubSettings` and `RepositoryRule[]` (invalidate rule cache on rule CRUD).

---

### 3. Fix `getRepositories()` Endpoint

**Problem:** `GET /repositories` currently calls `githubService.syncInstallationRepositories()` — a live GitHub API call — on every dashboard load. This will hit GitHub rate limits quickly.

**Fix:** Serve repos from DB only. Sync happens automatically via the `installation_repositories` webhook handler.

```typescript
// Before (wrong)
async getRepositories() {
  await this.githubService.syncInstallationRepositories(); // ← remove this
  return this.prisma.repository.findMany();
}

// After (correct)
async getRepositories() {
  return this.prisma.repository.findMany({ include: { organization: true } });
}
```

---

### 4. `applyCommitPatch` — Multi-Line Suggestion Support

**Problem:** The auto-fix feature replaces only one line:
```typescript
lines[lineNumber - 1] = cleanSuggestion; // single line only
```

Real AI suggestions often span multiple lines or refactor entire functions.

**Fix:** Accept `startLine` + `endLine` in `ApplyFixDto` and splice the range:
```typescript
lines.splice(startLine - 1, (endLine - startLine) + 1, ...suggestionLines);
```

---

## 🔲 Remaining — Phase 5: True Agentic AI Upgrades (P1 — HIGHEST IMPACT)

> These are the core features that define a **true agentic system** vs. a "triggered automation".

---

### 5A. Self-Correction ReAct Loop (ResponseParserAgent)

**What's missing:** If the LLM returns invalid JSON, the system throws. A true agent reflects on its mistake and tries again.

**What to build:**
```
LlmCallerAgent → ResponseParserAgent
                      │ parse fails
                      ▼
              Retry LLM with correction prompt:
              "Your last response failed JSON validation: {error}.
               Return ONLY valid JSON matching this schema: {...}"
                      │ max 2 retries
                      ▼
              Fail with structured error if still invalid
```

Implementation: Add a `retryWithCorrection(rawText, error)` method in `ResponseParserAgent` that re-calls `LlmCallerAgent` with the corrective prompt. Log each attempt in `AiUsageLog` with `actionDescription: 'Self-Correction Attempt #N'`.

---

### 5B. Semantic Diff Chunking (Large PR Support)

**What's missing:** `DiffPreprocessorAgent` filters files but doesn't chunk. A 2000-line PR will overflow any model's context window.

**What to build:**
1. Parse diff into per-file segments after filtering
2. Estimate token count per segment (~4 chars/token)
3. If total > 3500 tokens → split into chunks of ≤3500 tokens by file boundary
4. Run `LlmCallerAgent` for each chunk independently
5. Aggregate all chunk results in `SeverityScorerAgent`
6. Deduplicate comments by `(filePath, lineNumber)` across chunks

This makes MergeMind capable of reviewing **any PR regardless of size**, which is a fundamental agentic requirement.

---

### 5C. Dynamic Tool Use via Function Calling

**What's missing:** The LLM is force-fed a prebuilt prompt. A real agent decides **which information it needs** and fetches it autonomously.

**Architecture:**
```
PromptBuilderAgent → LlmCallerAgent (with tools schema)
                          │
                    LLM returns: tool_call: read_file("src/user.service.ts")
                          │
                    ToolExecutorAgent.execute(tool_call)
                          │ fetches file from GitHub API
                          ▼
                    LlmCallerAgent (with tool result in context)
                          │
                    LLM returns: final_answer (JSON review)
```

**Tools to define:**
| Tool | Signature | Purpose |
|---|---|---|
| `read_file` | `(path: string)` | Fetch a full file from the repo for deeper context |
| `search_codebase` | `(query: string)` | Search repo for symbol/pattern (GitHub code search) |
| `get_pr_comments` | `(prNumber: number)` | Read existing PR discussion for context |

Use OpenRouter's `tools` + `tool_choice` API fields (OpenAI-compatible function calling format).

---

### 5D. Multi-Agent Specialization

**What's missing:** One prompt tries to find security bugs, performance issues, and style problems simultaneously — diluting focus.

**What to build:**

```
DiffPreprocessorAgent
        │
        ├──► SecurityAgent    (prompt: focused on vulnerabilities only)
        ├──► PerformanceAgent (prompt: focused on latency, memory, N+1)
        │    (run concurrently via Promise.allSettled)
        │
        ▼
SynthesisAgent  (merges + deduplicates results, generates unified review)
        │
        ▼
SeverityScorerAgent → ReviewPersisterAgent
```

Each agent has its own system prompt and runs independently. The `SynthesisAgent` receives both JSON outputs and produces the final unified `AiReviewResponse`. This mirrors how real senior engineers specialize.

---

### 5E. Long-Term Repository Memory (RAG / pgvector)

**What's missing:** Every PR analysis starts from zero. The agent has no knowledge of past reviews, architectural decisions, or recurring developer mistakes.

**What to build:**

1. **Add `pgvector` to Postgres:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "ReviewComment" ADD COLUMN embedding vector(1536);
```

2. **Create `MemoryAgent`:**
   - After each review: embed each comment with OpenRouter embeddings API
   - Store `embedding` on `ReviewComment`

3. **Inject memories into `PromptBuilderAgent`:**
   - On each new PR: query top-5 similar past comments from same repo using cosine similarity
   - Inject as context: `"Past decisions in this codebase: [...]"`

4. **Example memory recall:**
   > *"In PR #42 (3 weeks ago), the team decided: all DB access must go through the Repository pattern. A direct Prisma call was found in a controller — flag this as HIGH severity."*

This turns MergeMind into a **learning system** that improves with every review.

---

### 5F. GitHub Check Runs (Agent as a Required CI Gate)

**What's missing:** MergeMind posts comments but doesn't integrate as a formal GitHub status check. PRs can be merged even if the AI found critical issues.

**What to build:**

```typescript
// New: GitHubCheckRunAgent
// Called at start of PrReviewProcessor:
const checkRunId = await this.githubCheckRunAgent.create({
  owner, repo, headSha, name: 'MergeMind AI Review', status: 'in_progress'
});

// Called at end of pipeline:
await this.githubCheckRunAgent.complete({
  checkRunId, conclusion: severityScore > 70 ? 'failure' : 'success',
  summary: `Score: ${severityScore}/100. ${highCount} critical issues.`
});
```

If configured as a required status check in GitHub branch protection rules, this **blocks merges** on high-severity code. True agentic enforcement.

---

### 5G. Real-Time Job Status via Server-Sent Events (SSE)

**What's missing:** The dashboard has no live feedback. Users don't know if their PR is being analyzed or if an error occurred until they manually refresh.

**What to build:**

```typescript
// In apps/api — new SSE endpoint
@Sse('jobs/:id/stream')
streamJobStatus(@Param('id') id: string): Observable<MessageEvent> {
  return interval(1000).pipe(
    switchMap(() => this.prisma.analysisJob.findUnique({ where: { id } })),
    map(job => ({ data: { step: job.step, status: job.status } })),
    takeWhile(event => event.data.status !== 'COMPLETED' && event.data.status !== 'FAILED', true)
  );
}
```

The dashboard subscribes with `new EventSource('/api/jobs/{id}/stream')` and renders a live step indicator: `QUEUED → FETCHING_DIFF → AI_ANALYSIS → POSTING → COMPLETED`.

---

## 🔲 Remaining — Phase 6: Production Hardening (P3)

### Prompt Template System

The `PromptTemplate` Prisma model exists but is completely unused. The system prompt is a hardcoded string inside `PromptBuilderAgent`.

**What to do:**
- Seed default templates: `pr-review-v1`, `push-commit-v1`, `security-audit-v1`
- `PromptBuilderAgent` loads active template by slug from DB (or Redis cache)
- Add `version` field for tracking which prompt version produced which review result
- Enables A/B testing: assign `promptTemplateVersion` on each `ReviewResult`

---

### Diff Result Caching (Dedup Identical Diffs)

Force-pushes or rapid re-triggers can submit the same diff repeatedly, burning tokens.

**What to do:**
- SHA-256 hash the cleaned diff in `DiffPreprocessorAgent`
- Check Redis: `GET diff:result:{hash}` → if hit, return cached `reviewResultId`, skip LLM
- On cache miss: store `SET diff:result:{hash} {reviewResultId} EX 86400` after persist

---

### Rate Limiter per Installation

No per-org throttling exists. A single noisy repo could flood the queue.

```typescript
BullMQ.registerQueue({
  name: 'pr-review',
  limiter: { max: 10, duration: 60000 }, // 10 jobs/minute globally
})
// Per-installation: use job grouping by installationId
```

---

### Missing Shared Packages (from spec)

| Package | Purpose |
|---|---|
| `packages/prompt-engine` | Template loader, version manager, prompt renderer |
| `packages/github-sdk` | Shared Octokit factory, auth helpers, type-safe API wrappers |
| `packages/utils` | Shared crypto, SHA hashing, token counting, formatting utilities |

---

### Strict TypeScript — Eliminate `any`

Per `agent.md` spec, `any` is banned. Remaining violations:
- `Job<any, any, string>` → replace with `Job<PrReviewJobData>`
- `rules?: any[]` → replace with `RepositoryRule[]` from `shared-types`
- `response: any` in several agents → replace with `AiReviewResponse`

---

## 🏁 100% Agentic Definition of Done

```
✅ Multi-service architecture         → DONE
✅ Composable 7-step agent pipeline   → DONE
✅ Primary + Fallback + Consensus LLM → DONE
✅ Custom rule injection              → DONE
✅ Encrypted secrets                  → DONE
✅ Token cost tracking                → DONE
✅ GitHub App auth                    → DONE
✅ Redis dedup + BullMQ retry         → DONE

🔲 Self-correction ReAct loop         → Phase 5A
🔲 Semantic diff chunking             → Phase 5B
🔲 Dynamic tool use (fn calling)      → Phase 5C
🔲 Multi-agent specialization         → Phase 5D
🔲 Long-term memory (RAG/pgvector)    → Phase 5E
🔲 GitHub Check Runs (CI gate)        → Phase 5F
🔲 Real-time SSE job streaming        → Phase 5G
🔲 Redis settings caching             → Phase 4
🔲 Repository data access layer       → Phase 4
🔲 Prompt template system             → Phase 6
```

**Priority order for implementation:**
```
5F (Check Runs) → 5A (Self-Correction) → 5B (Chunking) → 4 (Caching) → 5G (SSE) → 5C (Tool Use) → 5D (Multi-Agent) → 5E (Memory)
```
