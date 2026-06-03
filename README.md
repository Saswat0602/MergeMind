# MergeMind 🤖

> **Agentic AI-powered Code Review, Automated for Every Pull Request.**

MergeMind is a fully autonomous, production-grade agentic AI system that integrates natively with GitHub to review Pull Requests and commit pushes in real-time. It doesn't just flag static lint warnings — it dynamically morphs into a specialized AI engineer persona tailored to the PR's intent, chunks massive diffs intelligently, self-corrects its own malformed responses, and acts as a CI/CD gatekeeper that can block merges based on high-severity security findings.

---

## ✨ What Does MergeMind Do?

1. **Receives GitHub Webhooks** — Listens for PR and push events from any connected GitHub App installation.
2. **Queues Background Jobs** — Offloads analysis to a persistent background worker queue (Redis/BullMQ) so the webhook returns instantly and never times out.
3. **Autonomously Routes Intent** — An `IntentRouterAgent` reads the PR title and description and selects the most appropriate AI persona (Security Auditor, Performance Expert, or Frontend Architect) before any LLM call is made.
4. **Semantically Chunks the Diff** — Large diffs exceeding the model's context window are automatically split into safe semantic chunks and processed sequentially, so no file is ever silently dropped.
5. **Invokes a Specialized LLM** — Calls an OpenRouter-powered LLM (e.g. `deepseek-v3`, `gemini-2.5-flash`) with a dynamically-crafted persona prompt.
6. **Self-Corrects Broken JSON** — If the LLM returns malformed JSON, the `ResponseParserAgent` detects the syntax error, writes a correction prompt explaining exactly what went wrong, and re-invokes the LLM automatically (up to 2 retries).
7. **Scores & Filters Issues** — The `SeverityScorerAgent` removes noise and scores the final output from 0–100 based on the severity and volume of issues found.
8. **Posts Inline PR Comments** — Posts rich inline review comments with code suggestions directly on the PR diff in GitHub.
9. **Controls CI/CD Check Runs** — Registers a `MergeMind AI Code Review` check status on every commit. If the severity score exceeds 70 (high-risk), the Check Run is marked as `failure`, automatically blocking the PR from being merged.
10. **Streams Live Updates** — Broadcasts real-time job status (`FETCHING_DIFF → AI_ANALYSIS → POSTING → COMPLETED`) over Server-Sent Events so the dashboard can show a live progress indicator.

---

## 🏗️ Architecture Overview

MergeMind is a **Turborepo monorepo** with four distinct applications and one shared package:

```
MergeMind/
├── apps/
│   ├── api/        → REST API (NestJS) — Dashboard & Settings
│   ├── worker/     → Background Job Processor (NestJS + BullMQ) — AI Analysis Engine
│   ├── webhook/    → GitHub Webhook Receiver (NestJS) — Event Ingestion
│   └── dashboard/  → Frontend (Next.js) — User Interface
└── packages/
    └── database/   → Shared Prisma ORM Schema & Client
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Monorepo** | Turborepo | Parallel builds & workspace caching |
| **Backend** | NestJS | Modular dependency injection for `api`, `worker`, `webhook` |
| **Frontend** | Next.js | Server-side rendered React dashboard |
| **Database** | PostgreSQL + Prisma | Structured data persistence & type-safe ORM |
| **Job Queue** | Redis + BullMQ | Durable, priority-aware background job queue |
| **Caching** | ioredis | High-performance in-memory cache for AI & GitHub settings |
| **Real-Time** | Redis Pub/Sub + SSE | Streaming live job status to the dashboard |
| **AI Layer** | OpenRouter API | Model-agnostic gateway to LLMs (DeepSeek, Gemini, Claude, etc.) |
| **GitHub Integration** | GitHub App (Octokit) | Webhook reception, PR comments, Check Run management |
| **Containerization** | Docker / Docker Compose | Local development and production deployment |
| **Language** | TypeScript (strict) | Full end-to-end type safety |

---

## 🤖 Agentic Pipeline (The AI Brain)

The `worker` service implements a **7-step modular agentic pipeline**. Each step is a separate injectable agent with a single responsibility:

```
GitHub Event
    │
    ▼
[1] SettingsResolverAgent   → Fetches AI & GitHub config from Redis cache
    │
    ▼
[2] DiffPreprocessorAgent   → Filters, scrubs secrets, chunks large diffs
    │
    ▼
[3] IntentRouterAgent       → Routes to best persona (Security / Perf / Frontend)
    │
    ▼
[4] PromptBuilderAgent      → Constructs dynamic, persona-specific prompts
    │
    ▼
[5] LlmCallerAgent          → Calls OpenRouter LLM (with fallback & consensus modes)
    │
    ▼
[6] ResponseParserAgent     → Parses JSON + Self-Correction ReAct Loop (up to 2 retries)
    │
    ▼
[7] SeverityScorerAgent     → Scores & filters final output
    │
    ▼
[8] ReviewPersisterAgent    → Persists review to PostgreSQL
    │
    ▼
GitHub: Post comments + Complete Check Run (success/failure)
```

---

## ⚡ Agentic Capabilities

| Capability | Description |
|---|---|
| **Persona Morphing** | Dynamically selects Security / Performance / Frontend AI engineer persona |
| **Self-Correction** | Autonomously re-prompts the LLM on malformed JSON responses |
| **Semantic Chunking** | Splits large diffs into safe chunks, processes & aggregates them all |
| **CI/CD Gating** | Marks PRs as failed if AI-detected severity exceeds threshold |
| **Live SSE Streaming** | Broadcasts job state transitions to the dashboard in real-time |
| **Redis Caching** | Config cached with TTL; auto-invalidated on settings change |
| **Dual-Model Consensus** | Can run two LLMs in parallel and merge their review responses |
| **Fallback Chain** | Automatically retries with fallback model if primary LLM fails |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- A GitHub App installation (with Webhooks, Pull Requests, and Check Runs permissions)
- An OpenRouter API key

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd MergeMind
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in your values in .env
```

Key environment variables:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/mergemind
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=<32-char-random-secret>
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...
OPENROUTER_API_KEY=...
```

### 3. Run with Docker
```bash
docker-compose up -d
```

### 4. Run in Development
```bash
# Start all services in parallel
npm run dev
```

---

## 📂 Key Configuration

After setup, navigate to the MergeMind dashboard and configure:
- **AI Settings:** Choose your primary and fallback LLM models, temperature, token limits, and enable consensus mode.
- **GitHub Settings:** Provide your GitHub App ID and private key.
- **Repository Rules:** Create custom per-repository rules (e.g. "No SQL queries in controller layer") that the AI will strictly enforce.

---

## 📄 License

MIT
