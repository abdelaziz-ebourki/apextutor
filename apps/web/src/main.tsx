import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>ApexTutor</h1>
      <p>Adaptive learning platform — scaffold. Graph + chat UI land in issues #3 / #5.</p>
      <ul>
        <li>API health: <code>GET /api/health</code> (proxied to :4000)</li>
        <li>Graph: React Flow DAG (issue #3)</li>
        <li>Chat: SSE + KaTeX (issue #5)</li>
      </ul>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
