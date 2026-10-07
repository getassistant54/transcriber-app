import { Router, Request, Response } from 'express';
import {
  adminSettings,
  updateAdminSettings,
  users,
  saveUser,
  guestSessions,
  systemStats,
  transcriptionsHistory,
  deleteTranscriptionRecord,
  ensureCompleteSegments,
} from '../storage.js';
import { generateGoogleDocHtml } from '../exporters/googleDocs.js';
import { UserRole } from '../../src/types.js';
import { requireAdminAuth } from '../security.js';

export const apiRouter = Router();

// Protect all admin endpoints with authentication
apiRouter.use('/admin', requireAdminAuth);

apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ settings: adminSettings });
});

apiRouter.get('/user/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  const userRole = (req.headers['x-user-role'] as string) || 'guest';

  // If userId matches a known user
  if (userId !== 'guest' && users[userId]) {
    return res.json({ user: users[userId], isGuest: false });
  }

  // If non-guest role requested, find or create user for that role
  if (userRole !== 'guest') {
    let targetUser = Object.values(users).find((u) => u.role === userRole);
    if (!targetUser) {
      const newId = 'user-' + Date.now();
      targetUser = {
        id: newId,
        email: `${userRole}@transcriber.ai`,
        name: userRole === 'admin' ? 'Администратор' : userRole === 'corporate_user' ? 'Корпоративный сотрудник' : 'Пользователь Pro',
        role: userRole as any,
        planId: userRole === 'corporate_user' || userRole === 'admin' ? 'corporate_team' : 'pro_individual',
        usedMinutesThisMonth: 10,
        totalTranscriptionsCount: 1,
        balanceRub: 5000,
        createdAt: new Date().toISOString(),
      };
      saveUser(targetUser);
    }
    return res.json({ user: targetUser, isGuest: false });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'guest_ip';
  if (!guestSessions[ip]) {
    guestSessions[ip] = { usedMinutesToday: 0, dailyCount: 0, lastReset: new Date().toISOString() };
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

apiRouter.post('/user/reset-guest-limit', (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'guest_ip';
  guestSessions[ip] = { usedMinutesToday: 0, dailyCount: 0, lastReset: new Date().toISOString() };
  res.json({ success: true, message: 'Лимиты гостя сброшены' });
});

apiRouter.post('/user/login', (req: Request, res: Response) => {
  const { role, email, name, companyName } = req.body;

  // 1. Direct Email Login / Registration
  if (email && typeof email === 'string' && email.includes('@')) {
    const cleanEmail = email.trim().toLowerCase();
    let userByEmail = Object.values(users).find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (!userByEmail) {
      const newId = 'user-' + Date.now();
      const isAdmin = cleanEmail === 'admin@transcriber.ai' || cleanEmail.startsWith('admin@');
      userByEmail = {
        id: newId,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        role: isAdmin ? 'admin' : 'standard_user',
        planId: isAdmin ? 'corporate_team' : 'pro_individual',
        usedMinutesThisMonth: 0,
        totalTranscriptionsCount: 0,
        balanceRub: isAdmin ? 15000 : 1500,
        createdAt: new Date().toISOString(),
      };
      saveUser(userByEmail);
    }
    return res.json({ user: userByEmail });
  }

  // 2. Role-based fallback (Admin / Demo)
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
      usedMinutesThisMonth: 0,
      totalTranscriptionsCount: 0,
      balanceRub: role === 'admin' ? 15000 : 1000,
      createdAt: new Date().toISOString(),
    };
    saveUser(targetUser);
  }

  res.json({ user: targetUser });
});

apiRouter.get('/transcriptions', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  const userRole = (req.headers['x-user-role'] as string) || 'guest';

  let list = transcriptionsHistory;
  if (userRole === 'admin') {
    list = transcriptionsHistory;
  } else if (userRole === 'guest') {
    list = transcriptionsHistory.filter((t) => t.userId === 'guest');
  } else if (userRole === 'corporate_user') {
    list = transcriptionsHistory.filter(
      (t) => t.userId === userId || (users[userId] && t.userEmail === users[userId].email)
    );
  } else {
    list = transcriptionsHistory.filter(
      (t) => t.userId === userId || (users[userId] && t.userEmail === users[userId].email)
    );
  }

  res.json({ transcriptions: list.map(ensureCompleteSegments) });
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

apiRouter.post('/client-error', (req: Request, res: Response) => {
  console.error(`🚨 [Frontend Error] ${req.body.message || 'Unknown'}`);
  if (req.body.stack) console.error(req.body.stack);
  if (req.body.componentStack) console.error(req.body.componentStack);
  res.json({ received: true });
});

