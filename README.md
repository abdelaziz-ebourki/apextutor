# ApexTutor — Adaptive Learning Platform

> A general-purpose, adaptive learning platform for history, philosophy, sciences, languages, economics, literature, and self-guided study.

ApexTutor generates personalized curriculums, tracks mastery on a prerequisite graph, tutors via LLM chat, grades essays with rubrics, grounds answers in your own PDFs (RAG), and schedules reviews with spaced repetition.

## Features

### Core (MVP — Full Learning Loop)

| # | Feature | Status |
|---|---------|--------|
| 1 | **Diagnostic & Curriculum Generator** — goal intake (level, hours/week, deadline, focus) → structured multi-week JSON roadmap via cloud LLM + Zod validation | Planned ([#2](../../issues/2)) |
| 2 | **Skill Graph DAG State Machine** — prerequisites, 4 states (`LOCKED`/`IN_PROGRESS`/`MASTERED`/`NEEDS_REVISION`), dynamic remedial re-routing, React Flow UI | Planned ([#3](../../issues/3)) |
| 3 | **Multi-Agent Tutoring & Evaluation Loop** — Professor agent (analogies, assignments) + Evaluator agent (rubric grading, hints), SSE streaming, LaTeX | Planned ([#5](../../issues/5)) / ([#6](../../issues/6)) |
| 4 | **Provider Abstraction Gateway** — vendor-agnostic `generateJSON/streamChat/grade` interface, cloud-first (OpenAI), Ollama stub for later | Planned ([#4](../../issues/4)) |
| 5 | **SRS & Flashcards** — auto-generated from mistakes/summaries, SuperMemo-2, `nextReviewDate` on-read filtering | Planned ([#8](../../issues/8)) |
| 6 | **Socratic Mode** — strict no-direct-answers toggle, probing questions, misconception detection | Planned ([#6](../../issues/6)) |
| 7 | **RAG Document Ingestion** — PDF/text upload → chunk/embed (`text-embedding-3-small`) → `pgvector` similarity → grounded answers | Planned ([#7](../../issues/7)) |
| 8 | **Essay & Open-Text Auto-Grader** — conceptual accuracy/clarity/depth rubric, missing-terms & logical-gap feedback | Planned ([#6](../../issues/6)) |

### Deferred to v1.1

| # | Feature | Notes |
|---|---------|-------|
| 9 | **Adaptive Pacing & Stagnation Guard** | MVP rule only: 2 fails → insert remedial node. Full telemetry later. |
| 10 | **Gamification** | MVP: XP + streak counter. Badges/shop later. |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | npm workspaces (`apps/*`, `packages/*`) |
| Backend | Express.js + TypeScript, SSE, Zod, Vercel AI SDK (OpenAI-first) |
| Frontend | Vite + React + `@xyflow/react` + Tailwind + KaTeX |
| DB | PostgreSQL 16 + `pgvector` (Docker), Prisma ORM |
| SRS scheduling | SM-2 on-write + on-read filter, `node-cron` (no Redis in MVP) |
| PDF parsing | `pdf-parse`, LangChain.js text splitters |

## Quickstart

Prerequisites: Node 20+, Docker, `OPENAI_API_KEY`.

```bash
# 1. Infra
docker compose up -d

# 2. Install
npm install

# 3. Env
cp .env.example .env
# edit DATABASE_URL + OPENAI_API_KEY

# 4. DB
npm run db:migrate --workspace=apps/api

# 5. Dev (api :4000, web :5173)
npm run dev
```

## Repo Layout

```
apextutor/
  apps/api/            # Express API, Prisma schema, prompts, SSE
    prisma/schema.prisma
    src/
      index.ts         # health + placeholder routes
      lib/             # provider gateway, dag, srs, rag (per-issue)
  apps/web/            # Vite React SPA, React Flow graph, chat, review UI
  packages/prompts/    # versioned system prompts (professor, evaluator, curriculum)
  docker-compose.yml   # postgres:16 + pgvector
  .env.example
```

## API Sketch (target)

* `POST /api/curriculum/generate` — Zod-validated JSON roadmap → creates DAG
* `GET /api/graph/:id` / `POST /api/nodes/:id/transition`
* `POST /api/tutor/chat` (SSE) / `POST /api/tutor/submit` (rubric grade)
* `POST /api/documents/upload` → chunk/embed
* `GET /api/srs/due` / `POST /api/srs/review`

## Roadmap

Tracked as GitHub issues with milestone `MVP Full Loop`:

1. Monorepo scaffold + Docker pgvector
2. Curriculum generator
3. DAG state machine + UI
4. Provider gateway
5. Professor chat SSE
6. Evaluator + Socratic + essay grader
7. PDF RAG grounding
8. SM-2 flashcards
9. XP/streak + remedial rule
10. Auth + validators + rate limits

See [Issues](../../issues) for acceptance criteria.

## Contributing

PRs welcome. Keep prompts in `packages/prompts` versioned, validate all LLM JSON with Zod, and add tests for DAG transitions + SM-2 intervals.

## License

MIT — see [LICENSE](LICENSE).
