import { Router, Request, Response } from 'express';
import {
  adminSettings,
  updateAdminSettings,
  users,
  guestSessions,
  systemStats,
  transcriptionsHistory,
  deleteTranscriptionRecord,
  ensureCompleteSegments,
} from '../storage.js';
import { generateGoogleDocHtml } from '../exporters/googleDocs.js';
import { UserRole } from '../../src/types.js';

export const apiRouter = Router();

apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ settings: adminSettings });
});

apiRouter.get('/user/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'guest';

  if (userId !== 'guest' && users[userId]) {
    return res.json({ user: users[userId], isGuest: false });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'guest_ip';
  if (!guestSessions[ip]) {
    guestSessions[ip] = { usedMinutesToday: 15, dailyCount: 1, lastReset: new Date().toISOString() };
  }

  res.json({
    user: {
      id: 'guest',
      email: 'гость@сессия',
      name: 'Гость (Разовая сессия)',
      role: 'guest' as const,
      planId: 'free_guest',
      usedMinutesThisMonth: guestSessions[ip].usedMinutesToday,
      totalTranscriptionsCount: guestSessions[ip].dailyCount,
      balanceRub: 0,
      createdAt: new Date().toISOString(),
    },
    isGuest: true,
    guestLimits: {
      usedMinutesToday: guestSessions[ip].usedMinutesToday,
      maxMinutesToday: adminSettings.guestMaxDurationMinutes,
      dailyCount: guestSessions[ip].dailyCount,
      maxDailyCount: adminSettings.guestDailyLimitCount,
    },
  });
});

apiRouter.post('/user/login', (req: Request, res: Response) => {
  const { role, email, name, companyName } = req.body;
  let targetUser = Object.values(users).find((u) => u.role === role);

  if (!targetUser) {
    const newId = 'user-' + Date.now();
    targetUser = {
      id: newId,
      email: email || `${role}@transcriber.ai`,
      name: name || (role === 'admin' ? 'Администратор' : role === 'corporate_user' ? 'Корпоративный ИИ' : 'Пользователь Pro'),
      role: role || 'standard_user',
      companyName: companyName || (role === 'corporate_user' ? 'ООО Инновации' : undefined),
      planId: role === 'corporate_user' || role === 'admin' ? 'corporate_team' : 'pro_individual',
      usedMinutesThisMonth: 10,
      totalTranscriptionsCount: 1,
      balanceRub: 5000,
      createdAt: new Date().toISOString(),
    };
    users[newId] = targetUser;
  }

  res.json({ user: targetUser });
});

apiRouter.get('/transcriptions', (req: Request, res: Response) => {
  res.json({ transcriptions: transcriptionsHistory.map(ensureCompleteSegments) });
});

apiRouter.delete('/transcriptions/:id', (req: Request, res: Response) => {
  const success = deleteTranscriptionRecord(req.params.id);
  res.json({ success });
});

apiRouter.post('/export/google-docs', (req: Request, res: Response) => {
  const { recordId } = req.body;
  const record = transcriptionsHistory.find((t) => t.id === recordId);

  if (!record) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }

  const htmlContent = generateGoogleDocHtml(record);

  res.json({
    docTitle: record.title,
    htmlContent,
    exportDirectUrl: `https://docs.google.com/document/create?title=${encodeURIComponent(record.title)}`,
  });
});

apiRouter.get('/admin/stats', (req: Request, res: Response) => {
  res.json({
    stats: systemStats,
    users: Object.values(users),
    guestSessionsCount: Object.keys(guestSessions).length,
    transcriptions: transcriptionsHistory,
  });
});

apiRouter.post('/admin/settings', (req: Request, res: Response) => {
  updateAdminSettings(req.body);
  res.json({ success: true, settings: adminSettings });
});

apiRouter.post('/admin/users/:id/update', (req: Request, res: Response) => {
  const userId = req.params.id;
  if (users[userId]) {
    users[userId] = { ...users[userId], ...req.body };
    return res.json({ success: true, user: users[userId] });
  }
  res.status(404).json({ error: 'Пользователь не найден' });
});
