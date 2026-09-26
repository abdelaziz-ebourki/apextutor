import { z } from 'zod';

// Issue #15: micro-lesson contracts (uniform 300-600w, lazy-gen, flagged-if-ungrounded).

export const lessonChunkSchema = z.object({
  id: z.string().min(1),
  docTitle: z.string().min(1),
  pages: z.string().max(50).optional(),
  content: z.string().min(1).max(1500),
});

export const lessonSourceRefSchema = z.object({
  docId: z.string().optional(),
  title: z.string().min(1),
  chapter: z.string().max(120).optional(),
  pages: z.string().max(50).optional(),
  chunkIds: z.array(z.string().min(1)).min(1),
});

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const bodyWordCount = (min: number, max: number) => (s: string) => {
  const n = wordCount(s);
  return n >= min && n <= max;
};

export const lessonCheckQuestionSchema = z.object({
  question: z.string().min(10).max(500),
  expectedPoints: z.array(z.string().min(3).max(200)).min(2).max(4),
  hiddenAnswer: z.string().min(10).max(800),
});

export const lessonOutputSchema = z
  .object({
    objectives: z.array(z.string().min(5).max(140)).min(2).max(3),
    body: z
      .string()
      .min(100)
      .refine(bodyWordCount(300, 600), 'body must be 300-600 words'),
    example: z
      .string()
      .min(20)
      .refine(bodyWordCount(1, 150), 'example must be <=150 words'),
    misconception: z
      .string()
      .min(20)
      .refine(bodyWordCount(1, 100), 'misconception must be <=100 words'),
    checkQuestion: lessonCheckQuestionSchema,
    sourceRefs: z.array(lessonSourceRefSchema).default([]),
    grounded: z.boolean(),
  })
  .refine((v) => (v.grounded ? v.sourceRefs.length > 0 : true), {
    message: 'grounded lessons must cite at least one sourceRef',
    path: ['sourceRefs'],
  });

export type LessonOutput = z.infer<typeof lessonOutputSchema>;

export const lessonGenerateRequestSchema = z.object({
  level: z.string().min(1).max(60).default('beginner'),
  focus: z.string().min(1).max(200).optional(),
  priorTitles: z.array(z.string().max(200)).max(20).default([]),
  chunks: z.array(lessonChunkSchema).max(5).default([]),
});

export type LessonGenerateRequest = z.infer<typeof lessonGenerateRequestSchema>;

/** Normalize text for verbatim-overlap detection (copyright guard, >90 chars). */
export function normalizeForOverlap(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Returns true if any contiguous window of `windowSize` chars from `body`
 * appears verbatim in any chunk. Default window 90 chars per #15 spec.
 */
export function hasVerbatimOverlap(
  body: string,
  chunks: Array<{ content: string }>,
  windowSize = 90,
): boolean {
  const norm = normalizeForOverlap(body);
  if (norm.length < windowSize) return false;
  const chunkSet = chunks.map((c) => normalizeForOverlap(c.content));
  // Slide in steps to keep this O(n) cheap; step 30 catches any 90-char copy.
  for (let i = 0; i + windowSize <= norm.length; i += 30) {
    const window = norm.slice(i, i + windowSize);
    if (chunkSet.some((c) => c.includes(window))) return true;
  }
  return false;
}

/**
 * Cross-checks sourceRefs against the chunks actually provided:
 * every chunkId must exist in inputs, and grounded must equal hasChunks.
 * Returns a list of human-readable problems (empty = ok).
 */
export function validateSourceRefs(
  output: Pick<LessonOutput, 'sourceRefs' | 'grounded'>,
  chunks: Array<{ id: string }>,
): string[] {
  const problems: string[] = [];
  const ids = new Set(chunks.map((c) => c.id));
  if (output.grounded && chunks.length === 0) {
    problems.push('grounded=true but no chunks were provided');
  }
  if (!output.grounded && output.sourceRefs.length > 0) {
    problems.push('grounded=false but sourceRefs are present');
  }
  for (const ref of output.sourceRefs) {
    for (const cid of ref.chunkIds) {
      if (!ids.has(cid)) problems.push(`sourceRef cites unknown chunkId: ${cid}`);
    }
  }
  return problems;
}
