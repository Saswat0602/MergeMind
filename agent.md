# agent.md

# DiffSense AI Coding Agent Rules

This file defines the architecture, engineering standards, coding rules, and AI agent behavior for the DiffSense monorepo.

The AI agent must strictly follow these rules while generating code.

---

# 1. Core Principles

- Prefer scalable architecture over shortcuts
- Write production-grade code
- Avoid unnecessary abstractions
- Prioritize readability and maintainability
- Use modular architecture
- Keep services loosely coupled
- Avoid duplicate logic
- Never hardcode secrets or environment values

---

# 2. Tech Stack Rules

## Backend
- NestJS
- TypeScript

## Database
- PostgreSQL

## Queue
- BullMQ + Redis

## AI Provider
- OpenRouter

## Frontend
- Next.js

## Monorepo
- Turborepo

---

# 3. Monorepo Structure

/apps
  /api
  /worker
  /webhook
  /dashboard
  /ai-engine

/packages
  /database      (Prisma schema & shared service)
  /shared-types
  /shared-config
  /utils
  /prompt-engine
  /github-sdk

/services
  /python-analyzer

The AI agent must respect this structure.

Do not place business logic in incorrect applications.

---

# 4. NestJS Architecture Rules

Use:
- modules
- services
- repositories
- DTOs
- guards
- interceptors
- pipes

Avoid:
- fat controllers
- business logic in controllers
- direct database access inside controllers

Controllers should only:
- validate input
- call services
- return responses

---

# 5. Folder Structure Rules

Every feature module should follow:

/feature
  /controllers
  /services
  /repositories
  /dto
  /entities
  /types
  /interfaces
  /constants
  /utils
  /tests

---

# 6. Naming Conventions

## Files
Use kebab-case

Examples:
- review.service.ts
- github-webhook.controller.ts

## Classes
Use PascalCase

## Variables
Use camelCase

## Constants
Use UPPER_SNAKE_CASE

---

# 7. TypeScript Rules

- Always use strict typing
- Avoid any
- Prefer interfaces for contracts
- Prefer enums for fixed states
- Use readonly where appropriate
- Use utility types when beneficial

Never disable TypeScript checks globally.

---

# 8. API Rules

All APIs must:
- use DTO validation
- return structured responses
- include proper status codes
- support pagination when needed

Standard response format:

{
  success: boolean,
  message: string,
  data: unknown
}

---

# 9. Error Handling Rules

Use:
- global exception filters
- custom exceptions
- structured logging

Never:
- swallow errors
- expose internal stack traces
- return raw database errors

---

# 10. Database Rules

Use:
- repository pattern
- migrations
- indexes
- normalized schema design

Avoid:
- raw SQL unless necessary
- unindexed queries
- deeply nested relational queries
- **NEVER use `prisma db push`. Always use `prisma migrate dev` for schema changes to preserve migration history.**

---

# 11. Queue Rules

All long-running tasks must use queues.

Examples:
- AI analysis
- GitHub syncing
- review generation
- notifications

Use BullMQ workers.

Workers must:
- support retries
- support concurrency
- handle failures safely

---

# 12. AI System Rules

IMPORTANT:
Do NOT send entire repositories to LLMs.

Always:
- chunk diffs
- minimize context
- remove unnecessary tokens
- cache repeated prompts

Pipeline priority:

1. Rule Engine
2. Static Analysis
3. AI Analysis

AI should be fallback-enhanced logic.

---

# 13. Prompt Engineering Rules

Prompts must:
- be structured
- enforce JSON output
- minimize hallucinations
- separate tasks clearly

Avoid:
- giant prompts
- vague instructions
- unbounded outputs

---

# 14. Security Rules

Always implement:
- input validation
- webhook signature validation
- rate limiting
- RBAC
- environment variable validation

Never:
- log secrets
- expose tokens
- hardcode credentials

---

# 15. Logging Rules

Use structured logging.

Log:
- request IDs
- queue IDs
- AI latency
- token usage
- failures

Never use console.log in production code.

---

# 16. Testing Rules

Write:
- unit tests
- integration tests
- service tests

Critical systems requiring tests:
- AI pipelines
- webhook validation
- queue workers
- repository logic

---

# 17. GitHub Integration Rules

Use GitHub App architecture.

Never:
- use personal access tokens
- expose webhook secrets

Webhook events must be validated before processing.

---

# 18. Performance Rules

Optimize for:
- low AI cost
- low token usage
- async processing
- efficient database queries

Avoid:
- unnecessary AI calls
- blocking operations
- sequential async loops

---

# 19. Python Service Rules

Python services are optional and isolated.

Use Python only for:
- AST parsing
- advanced static analysis
- ML-based code analysis

Core orchestration must remain in NestJS.

---

# 20. Code Quality Rules

Prefer:
- small functions
- reusable utilities
- composition over inheritance

Avoid:
- deeply nested logic
- massive services
- god classes

---

# 21. Environment Rules

Every service must:
- validate env variables at startup
- fail fast on invalid configs

Use:
- .env.example

The monorepo uses a **global .env file** at the root. Apps should load this file using `dotenv` or equivalent.

Never commit:
- .env files
- secrets
- API keys

---

# 22. Documentation Rules

Every major module should include:
- purpose
- architecture notes
- setup instructions
- flow explanation

Complex services must include diagrams.

---

# 23. DevOps Rules

All services should be:
- dockerized
- independently deployable
- health-check enabled

Use:
- docker-compose for local development

---

# 24. Scalability Rules

Design for:
- horizontal scaling
- queue-based processing
- stateless APIs

Avoid:
- in-memory shared state
- tightly coupled services

---

# 25. AI Agent Coding Behavior

The AI coding agent must:

- generate clean production-ready code
- avoid unnecessary dependencies
- explain architectural decisions when needed
- prefer maintainable solutions
- avoid overengineering
- preserve monorepo consistency

When uncertain:
- choose scalable architecture
- choose readability over cleverness

---

# 26. Primary Engineering Goal

DiffSense should feel like a real-world engineering platform rather than a demo AI application.

The architecture must demonstrate:
- backend engineering maturity
- scalable AI orchestration
- distributed processing
- production system design

---

