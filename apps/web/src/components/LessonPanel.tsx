import { useEffect, useState } from 'react';

// Issue #15: micro-lesson panel. Read-only teacher intro per DAG node.
// Fetches GET /api/nodes/:nodeId/lesson (lazy-gen: 404 suggestGenerate -> offer generate).

export interface LessonSourceRef {
  docId?: string;
  title: string;
  chapter?: string;
  pages?: string;
  chunkIds: string[];
}

export interface Lesson {
  nodeId: string;
  objectives: string[];
  body: string;
  example: string;
  misconception: string;
  checkQuestion: { question: string; expectedPoints: string[]; hiddenAnswer: string };
  sourceRefs: LessonSourceRef[];
  grounded: boolean;
  version: number;
  stale: boolean;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; lesson: Lesson }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

export function LessonPanel({ nodeId }: { nodeId: string }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (!nodeId) return;
    setStatus({ kind: 'loading' });
    setShowAnswer(false);
    fetch(`/api/nodes/${encodeURIComponent(nodeId)}/lesson`)
      .then(async (res) => {
        if (res.status === 404) {
          setStatus({ kind: 'missing' });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { lesson: Lesson };
        setStatus({ kind: 'ready', lesson: data.lesson });
      })
      .catch((e: unknown) => setStatus({ kind: 'error', message: String(e) }));
  }, [nodeId]);

  const generate = () => {
    setStatus({ kind: 'loading' });
    fetch(`/api/nodes/${encodeURIComponent(nodeId)}/lesson/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'beginner', priorTitles: [], chunks: [] }),
    })
      .then(async (res) => {
        if (res.status === 501) {
          setStatus({ kind: 'error', message: 'Generation needs #4 gateway + #7 RAG (501).' });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { lesson: Lesson };
        setStatus({ kind: 'ready', lesson: data.lesson });
      })
      .catch((e: unknown) => setStatus({ kind: 'error', message: String(e) }));
  };

  if (!nodeId) return null;
  if (status.kind === 'idle' || status.kind === 'loading') return <section>Loading lesson…</section>;
  if (status.kind === 'missing') {
    return (
      <section>
        <p>No lesson yet for this topic.</p>
        <button onClick={generate}>Generate lesson</button>
      </section>
    );
  }
  if (status.kind === 'error') {
    return (
      <section>
        <p>Lesson unavailable: {status.message}</p>
        <button onClick={generate}>Retry</button>
      </section>
    );
  }

  const { lesson } = status;
  return (
    <article>
      <header>
        <h2>Lesson</h2>
        {lesson.grounded ? (
          <span title="Grounded in your uploaded sources">✅ grounded</span>
        ) : (
          <span title="No sources yet — verify with your textbook">⚠️ verify with textbook</span>
        )}
        {lesson.stale && <span title="New documents uploaded since this was written"> · stale</span>}
      </header>

      <h3>Objectives</h3>
      <ul>
        {lesson.objectives.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>

      <p>{lesson.body}</p>

      <aside>
        <h4>Worked example</h4>
        <p>{lesson.example}</p>
      </aside>

      <aside>
        <h4>Common misconception</h4>
        <p>{lesson.misconception}</p>
      </aside>

      <section>
        <h4>Check yourself</h4>
        <p>{lesson.checkQuestion.question}</p>
        <ul>
          {lesson.checkQuestion.expectedPoints.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <button onClick={() => setShowAnswer((v) => !v)}>
          {showAnswer ? 'Hide model answer' : 'Show model answer'}
        </button>
        {showAnswer && <p>{lesson.checkQuestion.hiddenAnswer}</p>}
      </section>

      {lesson.sourceRefs.length > 0 && (
        <footer>
          <h4>Sources</h4>
          <ul>
            {lesson.sourceRefs.map((s, i) => (
              <li key={`${s.title}-${i}`}>
                {s.title}
                {s.chapter ? `, ${s.chapter}` : ''}
                {s.pages ? ` (pp. ${s.pages})` : ''}
              </li>
            ))}
          </ul>
        </footer>
      )}

      <nav>
        <a href={`/chat?node=${encodeURIComponent(lesson.nodeId)}`}>Ask about this</a>{' '}
        <a href={`/assignments?node=${encodeURIComponent(lesson.nodeId)}`}>Practice</a>
      </nav>
    </article>
  );
}
