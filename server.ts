import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { transcribeRouter } from './server/routes/transcribe.js';
import { apiRouter } from './server/routes/api.js';
import { generalApiLimiter } from './server/security.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security Middleware: Payload Protection (Max 200MB in Base64)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// CORS & Request Logger with Security Headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-user-id, x-user-role, x-admin-token');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Body parser error handler for payload too large
app.use((err: any, req: any, res: any, next: any) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'Файл слишком большой для веб-загрузки (лимит до 150 МБ). Рекомендуется загрузить аудиодорожку или сжать видео перед отправкой.',
    });
  }
  next(err);
});

// Apply API Rate Limiting to all /api endpoints
app.use('/api', generalApiLimiter);

// Mount modular routers
app.use('/api', transcribeRouter);
app.use('/api', apiRouter);

// Catch unhandled /api calls
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

// Static / SPA Serving
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    console.log(`📦 Раздача статических файлов из ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite not available, falling back to static:', e);
      app.use(express.static(distPath));
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер Расшифровщика видео запущен на http://0.0.0.0:${PORT}`);
  });
}

startServer();
