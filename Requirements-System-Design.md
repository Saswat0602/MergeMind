# DiffSense
AI-Powered GitHub PR Review Platform

---

# 1. Project Goal

DiffSense is an AI-powered Pull Request review system that automatically analyzes GitHub PRs and provides:

- PR summaries
- Security issue detection
- Code smell detection
- Performance suggestions
- Architecture warnings
- Test case recommendations
- Team rule validation

The platform is designed with:
- scalable architecture
- async processing
- low AI token usage
- monorepo structure
- production-grade backend engineering

---

# 2. Main Objectives

The project should demonstrate:

- AI integration
- scalable backend architecture
- queue systems
- GitHub webhook handling
- code analysis pipelines
- retrieval systems
- monorepo management
- production engineering practices

---

# 3. Tech Stack

## Backend
- NestJS
- TypeScript

## Monorepo
- Turborepo OR Nx

## Database
- PostgreSQL

## Cache / Queue
- Redis
- BullMQ

## AI Models
Using OpenRouter:
- DeepSeek
- Qwen
- Mistral

## Git Integration
- GitHub Apps
- GitHub Webhooks

## Vector Search (Optional Advanced)
- pgvector

## Python Services (Optional)
Used for:
- AST parsing
- advanced static analysis
- ML-based code pattern analysis

---

# 4. Monorepo Structure

/apps
  /api
  /worker
  /webhook
  /ai-engine
  /dashboard

/packages
  /shared-types
  /eslint-config
  /tsconfig
  /utils
  /github-sdk
  /prompt-engine

/services
  /python-analyzer

/docker
/docs

---

# 5. Application Responsibilities

## api
Main REST API

Responsibilities:
- authentication
- repositories
- organization settings
- review history
- analytics
- dashboards

---

## webhook
GitHub webhook receiver

Responsibilities:
- receive PR events
- validate webhook signature
- push jobs to queue
- trigger review pipeline

---

## worker
Async queue worker

Responsibilities:
- fetch PR diff
- chunk code
- run analysis
- call AI engine
- generate review comments
- publish results

---

## ai-engine
Handles all AI-related logic

Responsibilities:
- prompt construction
- token optimization
- chunk management
- AI fallback logic
- response parsing
- review generation

---

## dashboard
Frontend admin panel

Features:
- PR review history
- token usage
- analytics
- repository management
- severity metrics
- AI cost tracking

Recommended:
- Next.js

---

## python-analyzer (optional advanced service)

Responsibilities:
- AST parsing
- static analysis
- cyclomatic complexity
- duplicate code detection
- dependency analysis

---

# 6. Core Features

# 6.1 PR Summary Generation

Input:
- PR title
- PR description
- code diff

Output:
- concise AI-generated summary

Example:
"This PR introduces JWT refresh token authentication and improves token validation middleware."

---

# 6.2 Security Analysis

Detect:
- SQL injection risks
- exposed secrets
- unsafe eval usage
- insecure deserialization
- missing input validation
- auth vulnerabilities

Severity:
- HIGH
- MEDIUM
- LOW

---

# 6.3 Code Smell Detection

Detect:
- giant methods
- duplicated logic
- bad naming
- excessive nesting
- dead code
- large files

---

# 6.4 Performance Analysis

Detect:
- N+1 queries
- unnecessary loops
- missing indexes
- memory-heavy operations
- blocking operations

---

# 6.5 Test Suggestion Engine

AI generates:
- unit test ideas
- edge cases
- integration scenarios

---

# 6.6 Team Rules Engine

Custom repository rules.

Examples:
- no any type
- no console.log
- max function length
- naming conventions

---

# 6.7 Review Comment Generator

AI generates GitHub review comments directly on PR lines.

Example:
"Potential null reference issue detected here."

---

# 6.8 Repository Memory (Advanced)

Store:
- previous PRs
- coding standards
- historical fixes
- architecture patterns

Used for:
- context-aware reviews

---

# 7. System Workflow

1. Developer opens PR
2. GitHub webhook triggers
3. Webhook service validates request
4. Job pushed to BullMQ
5. Worker fetches diff
6. Diff chunking occurs
7. Static analysis runs
8. AI review pipeline executes
9. Severity scoring applied
10. Review comments generated
11. Results posted to GitHub
12. Analytics stored

---

# 8. AI Architecture

IMPORTANT:
Do NOT send entire repositories to AI.

Use layered analysis.

Pipeline:

Rule Engine
  ↓
Static Analysis
  ↓
Diff Chunking
  ↓
Embedding Similarity
  ↓
AI Review (only if needed)

This reduces cost significantly.

---

# 9. Diff Chunking Strategy

Only send:
- changed lines
- nearby context
- impacted functions

Avoid:
- full repository analysis

Benefits:
- lower token cost
- faster response
- reduced hallucinations

---

# 10. AI Prompt Engineering

The system should:
- use structured prompts
- separate security/performance/code-style analysis
- enforce JSON responses
- validate malformed AI output

---

# 11. Queue Architecture

BullMQ Queues:

- pr-review-queue
- ai-analysis-queue
- github-comment-queue
- retry-queue

Features:
- retries
- dead letter queues
- priority jobs
- concurrency control

---

# 12. Database Design

Main Tables:

- users
- organizations
- repositories
- pull_requests
- review_results
- review_comments
- ai_usage_logs
- repository_rules
- review_metrics

---

# 13. GitHub Integration

Use GitHub App instead of personal tokens.

Required permissions:
- Pull Requests
- Contents
- Metadata
- Checks
- Commit Statuses

Webhook Events:
- pull_request
- push
- installation
- installation_repositories

---

# 14. Security Requirements

- encrypted API keys
- webhook signature validation
- rate limiting
- RBAC
- audit logs
- secure environment variables
- retry protection

---

# 15. Cost Optimization Strategy

VERY IMPORTANT

## Rules

- use smaller models first
- cache repeated reviews
- avoid analyzing unchanged files
- limit context window
- summarize long diffs
- fallback to larger models only when necessary

---

# 16. Logging & Monitoring

Use:
- Pino
- Winston
- OpenTelemetry

Track:
- AI latency
- token usage
- queue duration
- review accuracy
- retry counts

---

# 17. DevOps Requirements

- Dockerized services
- docker-compose for local development
- CI/CD pipelines
- GitHub Actions
- environment-based configs

---

# 18. Scalability Considerations

System should support:
- multiple organizations
- concurrent PR reviews
- horizontal worker scaling
- distributed queues

---

# 19. Recommended Development Phases

# Phase 1 — MVP
- GitHub webhook
- diff fetching
- AI summary
- basic comments

---

# Phase 2
- security analysis
- severity scoring
- queue workers
- analytics

---

# Phase 3
- repository memory
- vector search
- AST analysis
- advanced AI routing

---

# Phase 4
- multi-org support
- dashboards
- billing simulation
- review learning engine

---

# 20. Advanced Features (Future)

- Slack notifications
- Jira integration
- architecture drift detection
- dependency vulnerability scanning
- AI reviewer personalities
- repository-wide semantic search

---

# 21. Deployment Stack

Recommended:
- Railway / Render
- Neon PostgreSQL
- Redis Cloud

Production:
- Kubernetes
- AWS ECS
- GCP Cloud Run

---

# 22. Resume Description

Built DiffSense, an AI-powered GitHub PR review platform using NestJS, BullMQ, PostgreSQL, Redis, and OpenRouter LLMs capable of automated code review, security analysis, performance detection, and intelligent review generation with scalable async processing architecture.

---

# 23. Main Engineering Concepts Demonstrated

- distributed systems
- async processing
- AI orchestration
- queue systems
- webhook architecture
- scalable backend design
- prompt engineering
- static analysis
- GitHub integrations
- cost-optimized AI systems

---
