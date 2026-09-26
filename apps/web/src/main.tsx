import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>ApexTutor</h1>
      <p>Teacher replacement — scaffold. Student jobs (flashcards, summaries, notes) are out of scope.</p>
      <ul>
        <li>API health: <code>GET /api/health</code> (proxied to :4000)</li>
        <li>Graph: React Flow DAG (issue #3)</li>
        <li>Chat + lesson recap: SSE + KaTeX (issue #5)</li>
        <li>Assignments + retrieval practice: teacher-assigned (issue #12, replaces #8 flashcards)</li>
        <li>Reports: weekly progress (issue #14)</li>
      </ul>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
