/**
 * lesson.v1 — micro-lesson generator prompt (issue #15).
 * Teacher voice only. Own-words explanation + citations, never textbook verbatim.
 *
 * Contract (see apps/api/src/lib/lessonSchema.ts):
 * - Input: node title/level/focus + prior node titles + 0..5 RAG chunks.
 * - Output: objectives[2..3], body 300-600 words, 1 example, 1 misconception,
 *   1 checkQuestion, sourceRefs (required iff chunks given), grounded flag.
 * - No chunks => grounded:false + "verify with textbook" flag, no fabricated Ch./pp.
 */

export const LESSON_V1_SYSTEM = `You are ApexTutor's teacher writing a 10-minute lesson intro for one topic in a prerequisite graph.

Rules:
1. Explain in your own words. Paraphrase, never copy textbook phrasing verbatim.
2. If RAG source chunks are provided, ground every factual claim in them and cite them by document title in sourceRefs with the given chunkIds.
3. If NO chunks are provided, set grounded=false, add a "Verify with your textbook" note naming the topic (never invent chapter/page numbers), and only teach stable, non-controversial framing plus one worked example of the reasoning skill.
4. Reading level follows the student's level (beginner: plain language + one analogy; intermediate: precise terms; advanced: nuance + open questions).
5. Structure: 2-3 testable objectives, body of 300-600 words, exactly 1 worked example or analogy (<=150 words), exactly 1 common misconception stated as a probe question (<=100 words), exactly 1 check question with 2-4 expected points and a hidden model answer.
6. History/philosophy/economics/literature topics: include claim + evidence + one alternative perspective. Sciences/languages: show the worked steps, not just the result.
7. KaTeX-safe plain text for formulas ($...$ inline, $$...$$ block). No markdown tables.
8. Output strict JSON matching the provided schema. No prose outside JSON.`;

export interface LessonChunkInput {
  id: string;
  docTitle: string;
  pages?: string;
  content: string; // <=1500 chars, pre-truncated by caller
}

export interface LessonPromptInput {
  nodeTitle: string;
  level: string;
  focus: string;
  priorTitles: string[];
  chunks: LessonChunkInput[];
}

export function buildLessonUserPrompt(input: LessonPromptInput): string {
  const lines: string[] = [
    `Topic: ${input.nodeTitle}`,
    `Student level: ${input.level}`,
    `Curriculum focus: ${input.focus}`,
  ];
  if (input.priorTitles.length > 0) {
    lines.push(`Already mastered before this topic: ${input.priorTitles.join('; ')}`);
  }
  if (input.chunks.length === 0) {
    lines.push(
      'Sources: NONE. Set grounded=false, do not invent chapters or page numbers, add the verify-with-textbook note.',
    );
  } else {
    lines.push('Sources (ground all claims in these, cite via chunkIds):');
    for (const c of input.chunks.slice(0, 5)) {
      const loc = c.pages ? ` (pp. ${c.pages})` : '';
      lines.push(`- [${c.id}] ${c.docTitle}${loc}: ${c.content.slice(0, 1500)}`);
    }
  }
  return lines.join('\n');
}

export const LESSON_V1_VERSION = 'lesson.v1';
