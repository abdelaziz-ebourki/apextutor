# AGENTS.md — ApexTutor

## Scope filter
"Would a teacher do this?" If not, don't build it. Out of scope (closed #8):
flashcards/SM-2, summarizers/notes, badges/shop. Teacher-owned replacements:
retrieval-practice assignments (#12), 2-min lesson recaps (#15).

## Workflow (must-follow)
- Never work directly on `main`. Branch per issue (`feat/15-micro-lessons`),
  push, open a PR to `main`. (History shows direct-to-main; that ends now.)
- Commit messages follow Conventional Commits: `type(#issue): imperative subject`
  (types in use: `feat`, `chore`, `refactor`; e.g. `feat(#15): …`).
- Ask the user via the question tool when blocked or when a decision affects
  scope, cost, or UX — batch questions, never guess on those. Don't ask about
  anything this file or the README already answers.

## Setup & verify (exact order)
1. `docker compose up -d` → `npm install` → `cp .env.example .env`
   (fill `DATABASE_URL`, `OPENAI_API_KEY`) → `npm run db:migrate --workspace=apps/api`
2. `npm run dev` runs all workspaces (api :4000, web :5173; web proxies `/api` → `:4000`).
3. Focused checks (prefer over root scripts): `npx tsc --noEmit -p apps/api/tsconfig.json`;
   `npx tsc --noEmit` in `apps/web`; `npx vitest run` in `apps/api` (only package with tests).

## TypeScript gotcha
`apps/api` uses `moduleResolution: NodeNext` — relative imports MUST carry `.js`
extensions (`../lib/x.js`), including test files (TS2835). `apps/web` uses
`bundler` — no extensions. Don't mix them up.

## Architecture
- `apps/api` (Express + Zod + Prisma, entry `src/index.ts`): routes `src/routes/`,
  validation `src/lib/`; env via `dotenv/config`, `PORT` defaults 4000.
- `apps/web` (Vite React SPA): UI in `src/components/`.
- `packages/prompts` (`<name>.v1.ts`: system const + builder fn, no build step):
  do NOT import from `apps/api` (`rootDir: src` forbids it) — duplicate the const
  with a TODO until a build step exists. Never edit a prompt in place; add `v2`.
- Pre-DB scaffolds: memory-store-behind-interface (see `LessonStore` in
  `routes/lessons.ts`); swap for Prisma without touching routes.

## Conventions
- All LLM JSON Zod-validated, retry 2× then 422; missing lazy resources →
  404 + `suggestGenerate:true`; endpoints blocked on #4/#7 → 501 with TODO.
- `package-lock.json` is committed; `.env` never is. pgvector `vector(1536)`
  arrives via raw SQL migration, not the Prisma schema (`Chunk` comment).

## Standards
Apply the relevant industry standard in each area, concretely:
- Commits: Conventional Commits. HTTP: correct methods/status codes and JSON errors.
- Validation: never trust LLM or client input — Zod at every boundary.
- Security (matters for #10 auth): OWASP basics — no secrets in repo, rate-limit
  AI/upload endpoints, validate uploads (type/size), least-privilege DB user.
- TypeScript: `strict` clean, no `any` without justification. React: keys, no
  direct DOM mutation. SQL: parameterized via Prisma only.
