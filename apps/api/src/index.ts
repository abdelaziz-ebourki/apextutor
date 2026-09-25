import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'apextutor-api', ts: new Date().toISOString() });
});

// TODO(#2): POST /api/curriculum/generate (Zod-validated LLM JSON -> DAG)
// TODO(#3): GET /api/graph/:id, POST /api/nodes/:id/transition
// TODO(#5): POST /api/tutor/chat (SSE)
// TODO(#6): POST /api/tutor/submit (rubric grade)
// TODO(#7): POST /api/documents/upload (chunk/embed -> pgvector)
// TODO(#8): GET /api/srs/due, POST /api/srs/review

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});
