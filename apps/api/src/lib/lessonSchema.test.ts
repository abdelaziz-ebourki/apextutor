import { describe, expect, it } from 'vitest';
import {
  hasVerbatimOverlap,
  lessonGenerateRequestSchema,
  lessonOutputSchema,
  validateSourceRefs,
} from './lessonSchema.js';

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

function validOutput() {
  return {
    objectives: ['Explain the causes of the event', 'Compare two perspectives on it'],
    body: words(350),
    example: words(80),
    misconception: words(40),
    checkQuestion: {
      question: 'What were two causes and why did they matter?',
      expectedPoints: ['First cause with reason', 'Second cause with reason'],
      hiddenAnswer: words(30),
    },
    sourceRefs: [{ title: 'Course reader', chunkIds: ['c1'] }],
    grounded: true,
  };
}

describe('lessonOutputSchema', () => {
  it('accepts a valid grounded lesson', () => {
    expect(lessonOutputSchema.safeParse(validOutput()).success).toBe(true);
  });

  it('rejects grounded lessons without sourceRefs', () => {
    const out = { ...validOutput(), sourceRefs: [] };
    const r = lessonOutputSchema.safeParse(out);
    expect(r.success).toBe(false);
  });

  it('rejects bodies outside 300-600 words', () => {
    expect(lessonOutputSchema.safeParse({ ...validOutput(), body: words(100) }).success).toBe(false);
    expect(lessonOutputSchema.safeParse({ ...validOutput(), body: words(700) }).success).toBe(false);
  });

  it('accepts ungrounded lessons without refs (flagged path)', () => {
    const out = { ...validOutput(), grounded: false, sourceRefs: [] };
    expect(lessonOutputSchema.safeParse(out).success).toBe(true);
  });
});

describe('hasVerbatimOverlap', () => {
  it('detects >90-char verbatim copies', () => {
    const chunk = 'the quick brown fox jumps over the lazy dog near the riverbank at dawn ' + words(40);
    const body = words(320) + ' ' + chunk.slice(0, 120) + ' ' + words(20);
    expect(hasVerbatimOverlap(body, [{ content: chunk }])).toBe(true);
  });

  it('passes paraphrased bodies', () => {
    const chunk = 'photosynthesis converts light energy into chemical energy in chloroplasts';
    const body = words(350);
    expect(hasVerbatimOverlap(body, [{ content: chunk }])).toBe(false);
  });
});

describe('validateSourceRefs', () => {
  it('flags unknown chunkIds and grounded mismatches', () => {
    const problems = validateSourceRefs(
      { sourceRefs: [{ title: 'X', chunkIds: ['nope'] }], grounded: true },
      [{ id: 'c1' }],
    );
    expect(problems.length).toBeGreaterThan(0);
  });

  it('returns no problems for consistent refs', () => {
    expect(
      validateSourceRefs(
        { sourceRefs: [{ title: 'X', chunkIds: ['c1'] }], grounded: true },
        [{ id: 'c1' }],
      ),
    ).toEqual([]);
  });
});

describe('lessonGenerateRequestSchema', () => {
  it('defaults level/priorTitles/chunks', () => {
    const r = lessonGenerateRequestSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.level).toBe('beginner');
      expect(r.data.chunks).toEqual([]);
    }
  });

  it('caps chunks at 5', () => {
    const chunks = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`,
      docTitle: 'D',
      content: 'x',
    }));
    expect(lessonGenerateRequestSchema.safeParse({ chunks }).success).toBe(false);
  });
});
