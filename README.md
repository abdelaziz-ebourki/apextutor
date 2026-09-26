# ApexTutor — Teacher Replacement, Not Study Coach

> A general-purpose adaptive tutor for history, philosophy, sciences, languages, economics, literature, and self-guided study. The app does what a teacher does. It does **not** do the student's job.

**Scope boundary:** if a teacher does it (syllabus, lecture, assign, grade, remediate, report), it belongs in the app. If the student does it (flashcards, summaries, notes, self-made decks), it is explicitly out of scope.

ApexTutor generates personalized curriculums, runs a placement diagnostic, tracks mastery on a prerequisite graph, lectures via LLM chat, assigns homework and retrieval quizzes, grades essays with rubrics, grounds answers in your own PDFs (RAG), enforces pacing, and issues progress reports.

## Features

### Core — teacher jobs (MVP)

| # | Teacher job | Status |
|---|-------------|--------|
| 1 | **Diagnostic & Curriculum Generator** — goal intake (level, hrs/week, deadline, focus) + placement quiz → multi-week JSON roadmap via cloud LLM + Zod validation | Planned ([#2](../../issues/2), [#11](../../issues/11)) |
| 2 | **Skill Graph DAG State Machine** — prerequisites, 4 states (`LOCKED`/`IN_PROGRESS`/`MASTERED`/`NEEDS_REVISION`), remedial re-routing, React Flow UI | Planned ([#3](../../issues/3)) |
| 3 | **Lecturing Loop** — Professor agent (explanations, analogies, 2-min lesson recaps, worked examples), SSE streaming, LaTeX | Planned ([#5](../../issues/5)) |
| 3b | **Micro-Lessons** — AI-drafted 10-min intro per DAG node (objectives, 300–600w body, example, misconception, check question), cited, lazy-generated | Scaffolded ([#15](../../issues/15)) |
| 4 | **Provider Abstraction Gateway** — `generateJSON/streamChat/grade` interface, cloud-first (OpenAI), Ollama stub | Planned ([#4](../../issues/4)) |
| 5 | **Assignment Generator** — teacher-assigned homework + retrieval-practice quizzes at 3 difficulty levels, variant generation (replaces student flashcards) | Planned ([#12](../../issues/12)) |
| 6 | **Socratic Mode** — strict no-direct-answers toggle, probing questions, misconception probes | Planned ([#6](../../issues/6)) |
| 7 | **RAG Document Ingestion** — PDF/text upload → chunk/embed (`text-embedding-3-small`) → `pgvector` → grounded lectures and assignments | Planned ([#7](../../issues/7)) |
| 8 | **Essay & Open-Text Auto-Grader** — accuracy/clarity/depth rubric, missing-terms & logical-gap feedback, hints not answers | Planned ([#6](../../issues/6)) |
| 9 | **Mock Exam Mode** — timed, mixed-topic, strict grading | Planned ([#13](../../issues/13)) |
| 10 | **Pacing & Progress Reports** — behind-schedule detection + reschedule proposal, weekly report card (% mastered, time-on-task, at-risk topics) | Planned ([#9](../../issues/9), [#14](../../issues/14)) |

### Explicitly out of scope (student jobs)

* ❌ Flashcards / SM-2 decks / card review UI — student-owned active recall. Closed: [#8](../../issues/8). Teacher covers the same need via auto-assigned retrieval quizzes (#12).
* ❌ Summarizers / note-taking / highlight tools — student writes their own summaries. Teacher provides only a 2-min lesson recap as lecture.
* ❌ Badges / shops / streak gamification — cut. Kept only: scores, mastery %, XP-as-grade, attendance count (gradebook, not game).

### Deferred to v1.1

* Seminar/debate mode (humanities argumentation), full misconception library per node, parent-share reports.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | npm workspaces (`apps/*`, `packages/*`) |
| Backend | Express.js + TypeScript, SSE, Zod, Vercel AI SDK (OpenAI-first) |
| Frontend | Vite + React + `@xyflow/react` + Tailwind + KaTeX |
| DB | PostgreSQL 16 + `pgvector` (Docker), Prisma ORM |
| Retrieval scheduling | Teacher-assigned review (due-date + spaced rule on-write, filtered on-read, `node-cron` — no Redis, no SM-2 decks) |
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
      lib/             # provider gateway, dag, assignments, rag (per-issue)
  apps/web/            # Vite React SPA, React Flow graph, chat, assignments, reports UI
  packages/prompts/    # versioned system prompts (professor, evaluator, curriculum, ...)
  docker-compose.yml   # postgres:16 + pgvector
  .env.example
```

## API Sketch (target)

* `POST /api/curriculum/generate` — Zod-validated JSON roadmap → creates DAG
* `POST /api/placement/submit` — placement quiz → sets starting node
* `GET /api/graph/:id` / `POST /api/nodes/:id/transition`
* `POST /api/tutor/chat` (SSE) / `POST /api/tutor/submit` (rubric grade)
* `GET /api/nodes/:nodeId/lesson` / `POST /api/nodes/:nodeId/lesson/generate|regenerate` — micro-lessons (lazy-gen, 501 until #4+#7)
* `POST /api/documents/upload` → chunk/embed
* `POST /api/assignments/generate` / `GET /api/assignments/due` / `POST /api/assignments/submit`
* `POST /api/exams/generate` / `POST /api/exams/:id/submit` (timed mock)
* `GET /api/reports/weekly` — progress report

## Roadmap

Tracked as GitHub issues:

* #2 curriculum generator, #3 DAG, #4 provider gateway, #5 professor SSE
* #6 evaluator + Socratic + essay grader, #7 PDF RAG
* #8 ❌ flashcards — closed as out-of-scope (student job)
* #9 pacing + gradebook (rewritten, badges cut)
* #10 auth + validators + rate limits
* #11 placement diagnostic, #12 assignment variants + retrieval practice, #13 mock exam, #14 progress report
* #15 micro-lessons per node — scaffolded (model, prompt, validation, routes, UI); generation wiring needs #4 + #7

See [Issues](../../issues) for acceptance criteria.

## Contributing

PRs welcome. Scope filter: ask "would a teacher do this?" — if not, don't build it. Keep prompts in `packages/prompts` versioned, validate all LLM JSON with Zod, and add tests for DAG transitions + assignment scheduling + lesson validation.

## License

MIT — see [LICENSE](LICENSE).
