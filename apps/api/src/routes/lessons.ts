import { Router } from 'express';
import {
  lessonGenerateRequestSchema,
  type LessonOutput,
} from '../lib/lessonSchema.js';

// Issue #15: micro-lessons per node (uniform 300-600w, lazy-gen, flagged-if-ungrounded).
//
// Storage is an in-memory stand-in behind the LessonStore interface so routes,
// validation, and the web UI work before Prisma wiring lands (#2/#3).
// Swap MemoryLessonStore for Prisma (Lesson model) without changing routes.

export interface StoredLesson extends LessonOutput {
  nodeId: string;
  version: number;
  stale: boolean;
  createdAt: string;
}

export interface LessonStore {
  get(nodeId: string): Promise<StoredLesson | null>;
  upsert(nodeId: string, lesson: LessonOutput): Promise<StoredLesson>;
  markStale(nodeIds: string[]): Promise<void>;
}

export class MemoryLessonStore implements LessonStore {
  private map = new Map<string, StoredLesson>();

  async get(nodeId: string): Promise<StoredLesson | null> {
    return this.map.get(nodeId) ?? null;
  }

  async upsert(nodeId: string, lesson: LessonOutput): Promise<StoredLesson> {
    const prev = this.map.get(nodeId);
    const stored: StoredLesson = {
      ...lesson,
      nodeId,
      version: (prev?.version ?? 0) + 1,
      stale: false,
      createdAt: new Date().toISOString(),
    };
    this.map.set(nodeId, stored);
    return stored;
  }

  async markStale(nodeIds: string[]): Promise<void> {
    for (const id of nodeIds) {
      const prev = this.map.get(id);
      if (prev) this.map.set(id, { ...prev, stale: true });
    }
  }
}

export function createLessonsRouter(store: LessonStore = new MemoryLessonStore()): Router {
  const r = Router();

  // GET /api/nodes/:nodeId/lesson — lazy-gen contract: 404 + suggestGenerate when absent.
  r.get('/api/nodes/:nodeId/lesson', async (req, res) => {
    const lesson = await store.get(req.params.nodeId);
    if (!lesson) {
      res.status(404).json({ error: 'no lesson yet', suggestGenerate: true });
      return;
    }
    res.json({ lesson });
  });

  // POST /api/nodes/:nodeId/lesson/generate — validates input now; LLM call lands
  // with #4 provider gateway + #7 RAG (caller may already pass RAG chunks).
  r.post('/api/nodes/:nodeId/lesson/generate', async (req, res) => {
    const parsed = lessonGenerateRequestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid request', details: parsed.error.flatten() });
      return;
    }
    // TODO(#4/#7): fetch RAG top-5 for node when chunks absent, call
    // provider.generateJSON(LESSON_V1_SYSTEM + buildLessonUserPrompt(...)),
    // validate with lessonOutputSchema, retry 2x then 422, run
    // hasVerbatimOverlap + validateSourceRefs guards, then store.upsert().
    res.status(501).json({
      error: 'lesson generation not wired yet: needs #4 provider gateway + #7 RAG',
      validatedInput: parsed.data,
      grounded: parsed.data.chunks.length > 0,
    });
  });

  // POST /api/nodes/:nodeId/lesson/regenerate — teacher re-explains on demand.
  r.post('/api/nodes/:nodeId/lesson/regenerate', async (req, res) => {
    const existing = await store.get(req.params.nodeId);
    if (!existing) {
      res.status(404).json({ error: 'no lesson yet', suggestGenerate: true });
      return;
    }
    // TODO(#4/#7): same pipeline as generate; version bumps on upsert.
    res.status(501).json({
      error: 'lesson regeneration not wired yet: needs #4 provider gateway + #7 RAG',
      currentVersion: existing.version,
    });
  });

  return r;
}
