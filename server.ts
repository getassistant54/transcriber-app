import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { transcribeRouter } from './server/routes/transcribe.js';
import { apiRouter } from './server/routes/api.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware for high-payload video uploads (up to 350mb)
app.use(express.json({ limit: '350mb' }));
app.use(express.urlencoded({ limit: '350mb', extended: true }));

// Body parser error handler for payload too large
app.use((err: any, req: any, res: any, next: any) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'Файл слишком большой для веб-загрузки (лимит до 250 МБ). Рекомендуется загрузить аудиодорожку или сжать видео перед отправкой.',
    });
  }
  next(err);
});

// Mount modular routers
app.use('/api', transcribeRouter);
app.use('/api', apiRouter);

// Static / SPA Serving
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    console.log(`📦 Раздача статических файлов из ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
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
