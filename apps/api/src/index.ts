import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createLessonsRouter } from './routes/lessons.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'apextutor-api', ts: new Date().toISOString() });
});

app.use(createLessonsRouter());

// TODO(#2 + #11): POST /api/curriculum/generate, POST /api/placement/submit
// TODO(#3): GET /api/graph/:id, POST /api/nodes/:id/transition
// TODO(#5): POST /api/tutor/chat (SSE, incl. lesson context — no student summaries)
// TODO(#6): POST /api/tutor/submit (rubric grade, Socratic overlay)
// TODO(#7): POST /api/documents/upload (chunk/embed -> pgvector); flag lessons stale on upload
// TEACHER-OWNED review (replaces #8 flashcards): assignment-based retrieval practice
// TODO(#12): POST /api/assignments/generate, GET /api/assignments/due, POST /api/assignments/submit
// TODO(#13): POST /api/exams/generate, POST /api/exams/:id/submit (timed mock)
// TODO(#14): GET /api/reports/weekly (progress report)
// DONE(#15 scaffold): GET /api/nodes/:nodeId/lesson, POST .../lesson/generate|regenerate (501 until #4+#7)

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});
