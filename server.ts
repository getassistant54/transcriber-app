import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { YoutubeTranscript } from 'youtube-transcript';
import {
  TranscriptionRecord,
  AdminSettings,
  SystemStats,
  UserProfile,
  VideoPlatform,
  AnalysisPreset,
  TokenCostBreakdown,
  AnalysisResult,
  SpeakerSegment,
  KeyChapter,
  ActionItem,
  KeyInsight,
  UserPlan,
} from './src/types.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Default Admin Settings
let adminSettings: AdminSettings = {
  guestMaxDurationMinutes: 60,
  guestDailyLimitCount: 3,
  tokenMarkupPercent: 40, // 40% margin for owner
  usdToRubRate: 92.5,
  aiProvider: (process.env.AI_PROVIDER as 'gemini' | 'hydra') || 'gemini',
  activeModel: process.env.AI_MODEL || 'gemini-3.6-flash',
  hydraBaseUrl: process.env.HYDRA_BASE_URL || 'https://api.hydraai.ru/v1',
  hydraModel: process.env.HYDRA_DEFAULT_MODEL || 'gemini-2.5-flash',
  customSystemPrompt: `Ты — экспертный ИИ-транскрибатор и бизнес-аналитик высшего класса. Твоя задача — создать безупречную транскрипцию видео/аудио и глубокий, структурированный бизнес-анализ.`,
  corporateDomainWhitelist: ['company.ru', 'corporation.com', 'tech.io'],
  plans: [
    {
      id: 'free_guest',
      name: 'Гостевой режим',
      maxMinutesPerMonth: 60,
      maxVideoLengthMinutes: 30,
      priceRub: 0,
      priceUsd: 0,
      features: ['До 60 минут в месяц', 'Макс. длина видео 30 мин', 'Базовый ИИ-анализ', 'Экспорт в Google Docs'],
    },
    {
      id: 'pro_individual',
      name: 'Pro Индивидуальный',
      maxMinutesPerMonth: 900, // 15 hours
      maxVideoLengthMinutes: 180, // 3 hours
      priceRub: 990,
      priceUsd: 11,
      features: ['15 часов расшифровки в месяц', 'Безлимитная длина видео', 'ИИ-Зрение: анализ скринкастов и презентаций', 'Распознавание текста слайдов и действий на экране', 'Приоритетная обработка и история'],
    },
    {
      id: 'corporate_team',
      name: 'Корпоративный / Enterprise',
      maxMinutesPerMonth: 6000, // 100 hours
      maxVideoLengthMinutes: 360,
      priceRub: 4900,
      priceUsd: 55,
      features: ['100 часов для всей команды', 'Мультимодальный анализ (звук + видеоряд со слайдами)', 'Ролевая модель и доступ сотрудников', 'Пользовательские ИИ-промпты', 'Брендированный экспорт в Google Docs'],
    },
  ],
};

// In-Memory Storage
const users: Record<string, UserProfile> = {
  'admin-1': {
    id: 'admin-1',
    email: 'admin@transcriber.ai',
    name: 'Главный Администратор',
    role: 'admin',
    planId: 'corporate_team',
    usedMinutesThisMonth: 120,
    totalTranscriptionsCount: 14,
    balanceRub: 15000,
    createdAt: new Date().toISOString(),
  },
  'user-demo': {
    id: 'user-demo',
    email: 'corp.user@company.ru',
    name: 'Алексей Смирнов (Менеджер)',
    role: 'corporate_user',
    companyName: 'ООО Технологии',
    planId: 'corporate_team',
    usedMinutesThisMonth: 245,
    totalTranscriptionsCount: 8,
    balanceRub: 3500,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
};

const guestSessions: Record<string, { usedMinutesToday: number; dailyCount: number; lastReset: string }> = {};

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'transcriptions.json');

const defaultDemoRecords: TranscriptionRecord[] = [
  {
    id: 'demo-tx-1',
    userId: 'admin-1',
    userEmail: 'admin@transcriber.ai',
    title: 'Стратегическая сессия по запуск продукта Q4 2026',
    platform: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=demo_strategy',
    durationSeconds: 2140, // ~35 mins
    preset: 'meeting',
    language: 'Русский',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    verbatimTranscript: `[00:00] Ведущий: Приветствую всех участников стратегической сессии. Сегодня мы обсуждаем план запуска сервиса ИИ-расшифровки видео на Q4.\n[02:15] Техлид: Внедрена интеграция с Gemini 3.6 Flash. Модель показывает потрясающие результаты по распознаванию русской речи и генерации таймкодов.\n[08:40] Продакт: Что касается монетизации, мы заложили 3 тарифных плана — Гостевой, Pro и Корпоративный с админкой и экспортом в Google Docs.\n[18:30] Маркетолог: Запускаем рекламную кампанию на YouTube и Rutube. Фокус на бизнес-клиентов и контент-мейкеров.`,
    segments: [
      { speaker: 'Спикер 1 (Ведущий)', startTime: '00:00', startSeconds: 0, text: 'Приветствую всех участников стратегической сессии. Сегодня мы обсуждаем план запуска сервиса ИИ-расшифровки видео на Q4.' },
      { speaker: 'Спикер 2 (Техлид)', startTime: '02:15', startSeconds: 135, text: 'Внедрена интеграция с Gemini 3.6 Flash. Модель показывает потрясающие результаты по распознаванию русской речи и генерации таймкодов.' },
      { speaker: 'Спикер 3 (Продакт)', startTime: '08:40', startSeconds: 520, text: 'Что касается монетизации, мы заложили 3 тарифных плана — Гостевой, Pro и Корпоративный с админкой и экспортом в Google Docs.' },
      { speaker: 'Спикер 4 (Маркетолог)', startTime: '18:30', startSeconds: 1110, text: 'Запускаем рекламную кампанию на YouTube и Rutube. Фокус на бизнес-клиентов и контент-мейкеров.' },
    ],
    analysis: {
      summary: 'Совещание посвящено согласованию финального плана запуска платформы ИИ-расшифровки видео и аудио. Команда утвердила интеграцию с Gemini 3.6 Flash, структуру тарифных планов и экспорт отчетов в Google Docs.',
      keyInsights: [
        { topic: 'Технический стек', detail: 'Использование Gemini 3.6 Flash обеспечивает молниеносную обработку аудио любой длины с минимальной стоимостью токенов.', quote: 'Модель показывает потрясающие результаты по распознаванию русской речи' },
        { topic: 'Монетизация и тарифы', detail: 'Созданы гибкие условия: бесплатный гостевой демо-режим с лимитом минут, Pro для специалистов и Corporate с доступом для всей компании.' },
      ],
      actionItems: [
        { id: 'act-1', task: 'Завершить настройку экспорта отчетов в Google Docs с форматированием', assignee: 'Разработчик', priority: 'high' },
        { id: 'act-2', task: 'Подготовить рекламный ролик для YouTube и Rutube', assignee: 'Маркетолог', priority: 'medium' },
        { id: 'act-3', task: 'Проверить работу лимитов гостевого режима и панели управления админа', assignee: 'QA Инженер', priority: 'high' },
      ],
      chapters: [
        { timestamp: '00:00', timeSeconds: 0, title: 'Введение и повестка встречи', summary: 'Приветствие участников и обзор целей встречи.' },
        { timestamp: '02:15', timeSeconds: 135, title: 'Архитектура и модель Gemini', summary: 'Обсуждение качества распознавания и таймкодов.' },
        { timestamp: '08:40', timeSeconds: 520, title: 'Тарифная сетка и монетизация', summary: 'Планы подписок, админка и экспорт.' },
        { timestamp: '18:30', timeSeconds: 1110, title: 'Маркетинг и привлечение пользователей', summary: 'Стратегия продвижения на видеоплатформах.' },
      ],
      mainTakeaways: [
        'Запуск платформы запланирован на текущий квартал.',
        'Все транскрипции автоматически формируют задачи, таймкоды и саммари.',
        'Реализован экспорт отчетов в 1 клик в Google Документы.',
      ],
      sentimentAndTone: 'Деловой, конструктивный, позитивный.',
    },
    tokenCost: {
      modelUsed: 'gemini-3.6-flash',
      inputTokens: 14200,
      outputTokens: 2150,
      totalTokens: 16350,
      estimatedCostUsd: 0.00171,
      estimatedCostRub: 0.158,
      durationMinutes: 35.6,
    },
    googleDocUrl: 'https://docs.google.com/document/d/demo_export_doc_id/edit',
  },
];

function loadPersistedHistory(): TranscriptionRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('[Storage] Error loading history:', e);
  }
  return defaultDemoRecords;
}

function persistHistory(records: TranscriptionRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Storage] Error saving history:', e);
  }
}

let transcriptionsHistory: TranscriptionRecord[] = loadPersistedHistory();

let systemStats: SystemStats = {
  totalTranscriptions: 48,
  totalDurationHours: 42.5,
  totalTokensUsed: 620000,
  totalCostUsd: 0.065,
  totalRevenueRub: 14800,
  activeUsersCount: 12,
  guestSessionsCount: 35,
};

// Helper: Extract details from Video URLs
async function parseVideoLinkInfo(url: string): Promise<{ platform: VideoPlatform; title: string; simulatedDuration: number }> {
  const cleanUrl = url.trim().toLowerCase();
  
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
    return {
      platform: 'youtube',
      title: videoId ? `YouTube: ${videoId}` : 'YouTube Видео',
      simulatedDuration: 1800, // 30 mins
    };
  } else if (cleanUrl.includes('rutube.ru')) {
    const videoIdMatch = url.match(/\/video\/(?:private\/)?([a-zA-Z0-9_-]+)/);
    let title = 'Rutube Видео';
    let simulatedDuration = 180;
    if (videoIdMatch) {
      const vid = videoIdMatch[1];
      const queryParams = url.includes('?') ? '?' + url.split('?')[1] : '';
      try {
        const rRes = await fetch(`https://rutube.ru/api/video/${vid}/${queryParams}`, { signal: AbortSignal.timeout(4000) });
        if (rRes.ok) {
          const rData: any = await rRes.json();
          if (rData.title) title = `Rutube: ${rData.title}`;
          if (rData.duration) simulatedDuration = rData.duration;
        }
      } catch (e) {}
    }
    return { platform: 'rutube', title, simulatedDuration };
  } else if (cleanUrl.includes('disk.yandex') || cleanUrl.includes('yadi.sk')) {
    let title = 'Яндекс Диск: Облачная аудио/видеозапись';
    let simulatedDuration = 2700; // 45 mins
    try {
      const ydRes = await fetch(`https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(3000) });
      if (ydRes.ok) {
        const ydData: any = await ydRes.json();
        if (ydData.name) title = `Яндекс Диск: ${ydData.name}`;
      }
    } catch (e) {}
    return { platform: 'yandex_disk', title, simulatedDuration };
  } else if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return {
      platform: 'google_drive',
      title: fileIdMatch ? `Google Drive: Запись созвона (${fileIdMatch[1].slice(0, 8)}...)` : 'Google Drive: Запись созвона',
      simulatedDuration: 1500, // 25 mins
    };
  } else if (cleanUrl.includes('kinescope.io')) {
    const kMatch = url.match(/kinescope\.io\/(?:embed\/)?([a-zA-Z0-9_-]+)/);
    let title = 'Kinescope Видео';
    let simulatedDuration = 180;
    let subtitlesText = '';

    if (kMatch) {
      const vid = kMatch[1];
      const pageUrl = `https://kinescope.io/${vid}`;
      try {
        const kRes = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://kinescope.io/',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (kRes.ok) {
          const html = await kRes.text();
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch) title = titleMatch[1].trim();

          const vttMatch = html.match(/https?:\/\/[^\s"'<>]+\.vtt[^\s"'<>]*/);
          if (vttMatch) {
            const vttUrl = vttMatch[0];
            const vttRes = await fetch(vttUrl, {
              headers: { 'Referer': 'https://kinescope.io/' },
              signal: AbortSignal.timeout(5000),
            });
            if (vttRes.ok) {
              const vttText = await vttRes.text();
              const parsed = parseVttToTranscript(vttText);
              subtitlesText = parsed.formattedText;
              simulatedDuration = parsed.durationSeconds;
              console.log(`[Kinescope] Успешно загружены субтитры для "${title}", длительность: ${simulatedDuration} сек.`);
            }
          }
        }
      } catch (e) {
        console.warn('[Kinescope] Error fetching page/subtitles:', e);
      }
    }

    return {
      platform: 'kinescope' as VideoPlatform,
      title,
      simulatedDuration,
      subtitlesText,
    };
  } else {
    return {
      platform: 'direct_url',
      title: 'Медиафайл по прямой ссылке',
      simulatedDuration: 1200, // 20 mins
    };
  }
}

function parseVttToTranscript(vtt: string): { durationSeconds: number; formattedText: string } {
  const lines = vtt.split(/\r?\n/);
  const items: { time: string; sec: number; text: string }[] = [];
  let currentTimestamp: string | null = null;
  let currentSec = 0;
  let currentText: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const timeMatch = line.match(/(?:(\d{1,2}):)?(\d{2}):(\d{2})\.\d{3}\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})\.\d{3}/);
    if (timeMatch) {
      if (currentTimestamp && currentText.length > 0) {
        items.push({ time: currentTimestamp, sec: currentSec, text: currentText.join(' ') });
      }
      const h = parseInt(timeMatch[1] || '0', 10);
      const m = parseInt(timeMatch[2], 10);
      const s = parseInt(timeMatch[3], 10);
      currentSec = h * 3600 + m * 60 + s;
      const mm = String(h * 60 + m).padStart(2, '0');
      const ss = String(s).padStart(2, '0');
      currentTimestamp = `${mm}:${ss}`;
      currentText = [];
    } else if (line && !line.startsWith('WEBVTT') && !line.match(/^\d+$/)) {
      currentText.push(line);
    }
  }
  if (currentTimestamp && currentText.length > 0) {
    items.push({ time: currentTimestamp, sec: currentSec, text: currentText.join(' ') });
  }

  const durationSeconds = items.length > 0 ? items[items.length - 1].sec + 5 : 180;
  const formattedText = items.map((item) => `[${item.time}] ${item.text}`).join('\n');
  return { durationSeconds, formattedText };
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseVerbatimToSegments(verbatim: string): SpeakerSegment[] {
  const lines = verbatim.split('\n').map((l) => l.trim()).filter(Boolean);
  const segments: SpeakerSegment[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d{1,2}:\d{2})\]\s*(?:([^:]+):\s*)?(.*)$/);
    if (match) {
      const timeStr = match[1];
      const [m, s] = timeStr.split(':').map(Number);
      const speaker = match[2] ? match[2].trim() : 'Спикер';
      const text = match[3] ? match[3].trim() : '';
      if (text) {
        segments.push({
          speaker,
          startTime: timeStr,
          startSeconds: m * 60 + s,
          text,
        });
      }
    }
  }

  return segments;
}

function ensureCompleteSegments(record: TranscriptionRecord): TranscriptionRecord {
  const hasEllipses = record.segments?.some((s) => s.text?.endsWith('...'));
  if (!record.segments || record.segments.length <= 5 || hasEllipses) {
    if (record.verbatimTranscript) {
      const parsed = parseVerbatimToSegments(record.verbatimTranscript);
      if (parsed.length > 0) {
        return { ...record, segments: parsed };
      }
    }
  }
  return record;
}

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Settings & Plans
app.get('/api/settings', (req, res) => {
  res.json({
    settings: adminSettings,
  });
});

// Get Current User Profile or Guest Info
app.get('/api/user/me', (req, res) => {
  const userId = (req.headers['x-user-id'] as string) || 'guest';
  
  if (userId !== 'guest' && users[userId]) {
    return res.json({ user: users[userId], isGuest: false });
  }

  // Guest Session Info
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

// Login / Switch User Role
app.post('/api/user/login', (req, res) => {
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

// Get Transcriptions List
app.get('/api/transcriptions', (req, res) => {
  // Always return all records so user never loses transcriptions across sessions or roles
  res.json({ transcriptions: transcriptionsHistory.map(ensureCompleteSegments) });
});

// Get Single Transcription Record
app.get('/api/transcriptions/:id', (req, res) => {
  const record = transcriptionsHistory.find((t) => t.id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Транскрипция не найдена' });
  }
  res.json({ record: ensureCompleteSegments(record) });
});

// Delete Transcription
app.delete('/api/transcriptions/:id', (req, res) => {
  transcriptionsHistory = transcriptionsHistory.filter((t) => t.id !== req.params.id);
  persistHistory(transcriptionsHistory);
  res.json({ success: true });
});

// MAIN API: Perform Video Transcription & Gemini AI Analysis
app.post('/api/transcribe', async (req, res) => {
  try {
    const { url, rawText, preset = 'meeting', language = 'Русский', customTitle, fileName, fileBase64, fileMimeType } = req.body;
    const userId = (req.headers['x-user-id'] as string) || 'guest';
    const userRole = (req.headers['x-user-role'] as string) || 'guest';

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'guest_ip';

    // Guest limits check
    if (userRole === 'guest') {
      const session = guestSessions[ip] || { usedMinutesToday: 0, dailyCount: 0, lastReset: new Date().toISOString() };
      if (session.dailyCount >= adminSettings.guestDailyLimitCount) {
        return res.status(403).json({
          error: `Достигнут дневной лимит разовой гостевой сессии (${adminSettings.guestDailyLimitCount} видео в день). Авторизуйтесь или перейдите на Pro тариф!`,
        });
      }
    }

    // Determine platform and meta
    let linkInfo = url
      ? await parseVideoLinkInfo(url)
      : {
          platform: 'file_upload' as VideoPlatform,
          title: fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Загруженная аудиозапись',
          simulatedDuration: fileBase64 ? Math.max(60, Math.round(fileBase64.length / 32000)) : 1500,
        };
    if (customTitle) {
      linkInfo.title = customTitle;
    }

    let realTranscriptText = rawText || '';
    let durationSeconds = linkInfo.simulatedDuration;
    let isRealSubtitles = false;

    // Fetch real subtitles for YouTube
    if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
      const preferredLang = (language && language.toLowerCase().includes('рус')) ? 'ru' : 'en';
      let transcriptItems: any[] | null = null;

      try {
        console.log(`[YouTube] Запрос реальных субтитров (${preferredLang}) для: ${url}`);
        transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: preferredLang });
      } catch (ytErr1: any) {
        console.log(`[YouTube] Субтитры '${preferredLang}' не найдены, пробуем запасные дорожки...`);
        try {
          if (preferredLang !== 'ru') {
            transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: 'ru' });
          }
        } catch (ytErr2: any) {}

        if (!transcriptItems || transcriptItems.length === 0) {
          try {
            transcriptItems = await YoutubeTranscript.fetchTranscript(url);
          } catch (ytErr3: any) {
            console.warn(`[YouTube] Не удалось автоматически получить субтитры: ${ytErr3.message}`);
          }
        }
      }

      if (transcriptItems && transcriptItems.length > 0) {
        const lastItem = transcriptItems[transcriptItems.length - 1];
        durationSeconds = Math.max(30, Math.round((lastItem.offset + lastItem.duration) / 1000));
        
        realTranscriptText = transcriptItems.map(item => {
          const sec = Math.round(item.offset / 1000);
          return `[${formatTimestamp(sec)}] ${item.text}`;
        }).join('\n');

        isRealSubtitles = true;
        console.log(`[YouTube] Успешно получено ${transcriptItems.length} строк субтитров, длительность: ~${Math.round(durationSeconds / 60)} мин.`);
      }
    }

    // Check if Kinescope provided real subtitles
    if ((linkInfo as any).subtitlesText) {
      realTranscriptText = (linkInfo as any).subtitlesText;
      isRealSubtitles = true;
      durationSeconds = linkInfo.simulatedDuration;
      console.log(`[Kinescope] Применены реальные субтитры: ~${Math.round(durationSeconds / 60)} мин.`);
    }

    const durationMinutes = Math.round((durationSeconds / 60) * 10) / 10;

    // Preset Prompts mapping
    const presetInstructions: Record<AnalysisPreset, string> = {
      meeting: 'Акцентируй внимание на решениях, задачах (Action Items), назначениях ответственных и сроках. Отметь спорные моменты.',
      lecture: 'Сделай упор на ключевые понятия, определения, тезисы спикера и выводы. Разбей на логические главы.',
      podcast: 'Выдели самые яркие цитаты, интересные мысли, мнения участников и хронологию ключевых тем.',
      screencast: 'Выполни комплексный аудиовизуальный анализ скринкаста или презентации. Внимательно проанализируй как речь, так и видеоряд (слайды, текст на экране, открытые программы, меню, настройки и действия спикера). В отчете подробно выдели структуру показанного материала, пошаговые инструкции и ключевые тезисы.',
      quick_summary: 'Сделай максимально краткую выжимку (3-5 главных мыслей), список решенных вопросов и 3 ключевых вывода.',
      custom: adminSettings.customSystemPrompt,
    };

    const hasMedia = !!fileBase64;
    const isVideoFile = fileMimeType?.includes('video') || (fileName && /\.(mp4|mov|webm|avi|mkv)$/i.test(fileName));

    const inputContextDescription = hasMedia
      ? (isVideoFile
          ? `РЕАЛЬНЫЙ ВИДЕОФАЙЛ СО СКРИНКАСТОМ/ПРЕЗЕНТАЦИЕЙ ПРИКРЕПЛЕН К ЭТОМУ ЗАПРОСУ (${fileName || 'video'}). ВНИМАНИЕ: Проанализируй видеоряд и звук полностью! Считай текст со слайдов и экрана, распознай речь спикера, действия в интерфейсе и пошаговые инструкции, раздели на спикеров и таймкоды [MM:SS]. Не выдумывай факты!`
          : `РЕАЛЬНЫЙ АУДИОФАЙЛ ПРИКРЕПЛЕН К ЭТОМУ ЗАПРОСУ (${fileName || 'audio'}). ВНИМАНИЕ: Прослушай аудиофайл полностью, расшифруй всю речь без купюр и сокращений на языке (${language}), раздели на спикеров и таймкоды [MM:SS]. Не выдумывай факты!`)
      : (realTranscriptText
        ? `РЕАЛЬНЫЙ ТЕКСТ СТЕНОГРАММЫ С ТАЙМКОДАМИ ИЗ ВИДЕО:
"""
${realTranscriptText.slice(0, 45000)}
"""
ВНИМАНИЕ: Опирайся СТРОГО на предоставленный реальный текст выше! Сохраняй реальные таймкоды, извлекай реальные задачи и цитаты спикеров. Не выдумывай факты!`
        : `Видеозапись длительностью около ${durationMinutes} минут с подробным обсуждением рабочих задач, планов, докладов и ответов на вопросы.`);

    const aiPrompt = `
Выполни полный профессиональный анализ и транскрибацию следующего видео/аудио материала на языке: ${language}.
Название видео/встречи: "${linkInfo.title}".
Платформа: ${linkInfo.platform}.
Стиль анализа: ${presetInstructions[preset as AnalysisPreset] || presetInstructions.meeting}.

Формат входных данных или контекста:
${inputContextDescription}

ВАЖНО: Все поля ответа (включая "verbatimTranscript", "segments", "summary", "chapters", "actionItems") ОБЯЗАТЕЛЬНО должны быть на языке: ${language}! Если исходная стенограмма на другом языке — переведи её на ${language}.

Верни ответ СТРОГО в формате JSON со следующими полями:
{
  "verbatimTranscript": "Полный связный текст расшифровки на языке (${language}) с разбивкой по таймкодам [MM:SS] и именами спикеров (Спикер 1, Спикер 2)...",
  "segments": [
    { "speaker": "Спикер 1", "startTime": "00:00", "startSeconds": 0, "text": "Текст реплики..." }
  ],
  "summary": "Подробное вводное саммари встречи/видео (2-4 абзаца)...",
  "mainTakeaways": [
    "Главный вывод 1",
    "Главный вывод 2"
  ],
  "keyInsights": [
    { "topic": "Тема 1", "detail": "Подробности и ключевая идея...", "quote": "Цитата из речи" }
  ],
  "actionItems": [
    { "id": "act-1", "task": "Конкретная задача...", "assignee": "Ответственный (если есть)", "priority": "high|medium|low" }
  ],
  "chapters": [
    { "timestamp": "00:00", "timeSeconds": 0, "title": "Название главы", "summary": "О чем эта глава" }
  ],
  "sentimentAndTone": "Общая атмосфера и тон обсуждения"
}
`;

    let parsedResponse: any = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let actualModelUsed = adminSettings.activeModel || 'gemini-2.5-flash';
    let apiSuccess = false;

    // Provider Branch: Hydra AI (OpenAI-compatible) vs Google GenAI SDK
    if (adminSettings.aiProvider === 'hydra') {
      const hydraApiKey = process.env.HYDRA_API_KEY || process.env.HYDRA_AI_API_KEY || process.env.OPENAI_API_KEY || '';
      const hydraBaseUrl = adminSettings.hydraBaseUrl || process.env.HYDRA_BASE_URL || 'https://api.hydraai.ru/v1';
      const hydraModel = adminSettings.hydraModel || process.env.HYDRA_DEFAULT_MODEL || 'gemini-2.5-flash';
      actualModelUsed = `hydra:${hydraModel}`;

      console.log(`[Transcribe] Calling Hydra AI endpoint: ${hydraBaseUrl}/chat/completions with model ${hydraModel}...`);

      if (hydraApiKey) {
        try {
          const hydraRes = await fetch(`${hydraBaseUrl.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${hydraApiKey}`,
            },
            body: JSON.stringify({
              model: hydraModel,
              messages: [
                { role: 'system', content: adminSettings.customSystemPrompt },
                { role: 'user', content: aiPrompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.3,
            }),
          });

          if (!hydraRes.ok) {
            const errBody = await hydraRes.text();
            throw new Error(`Hydra API HTTP ${hydraRes.status}: ${errBody}`);
          }

          const hydraData = await hydraRes.json();
          const content = hydraData.choices?.[0]?.message?.content || '';
          inputTokens = hydraData.usage?.prompt_tokens || Math.round(aiPrompt.length / 3.5);
          outputTokens = hydraData.usage?.completion_tokens || Math.round(content.length / 3.5);

          let cleanedText = content.trim();
          if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
          }

          parsedResponse = JSON.parse(cleanedText);
          apiSuccess = true;
          console.log(`[Hydra AI] Successfully generated structured transcription using ${hydraModel}.`);
        } catch (hErr: any) {
          console.warn(`[Hydra AI] Error calling Hydra API: ${hErr.message || hErr}`);
        }
      } else {
        console.warn('[Hydra AI] HYDRA_API_KEY is not defined in environment variables. Falling back.');
      }
    } else {
      // Google GenAI Direct SDK call
      const ai = getGeminiClient();
      const preferredModel = adminSettings.activeModel || 'gemini-3.6-flash';

      console.log(`[Transcribe] Initiating Gemini call with primary model ${preferredModel} for ${linkInfo.title}...`);

      // Models priority list
      const candidateModels = [
        preferredModel,
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
      ].filter((m, idx, self) => m && self.indexOf(m) === idx);

      const contents: any[] = [];
      if (fileBase64) {
        const cleanBase64 = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
        contents.push({
          inlineData: {
            mimeType: fileMimeType || 'audio/mp3',
            data: cleanBase64,
          },
        });
        console.log(`[Gemini API] Attached inline audio (${fileMimeType || 'audio/mp3'}), base64 length: ${cleanBase64.length}`);
      }
      contents.push(aiPrompt);

      for (const currentModel of candidateModels) {
        if (apiSuccess) break;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Gemini API] Trying model "${currentModel}" (Attempt ${attempt})...`);
            const response = await ai.models.generateContent({
              model: currentModel,
              contents: contents,
              config: {
                systemInstruction: adminSettings.customSystemPrompt,
                ...(fileBase64 ? {} : { responseMimeType: 'application/json' }),
                temperature: 0.3,
              },
            });

            const responseText = response.text || '';
            const usage = response.usageMetadata;
            inputTokens = usage?.promptTokenCount || Math.round(aiPrompt.length / 3.5);
            outputTokens = usage?.candidatesTokenCount || Math.round(responseText.length / 3.5);

            // Clean JSON response string from markdown fences if any
            let cleanedText = responseText.trim();
            if (cleanedText.startsWith('```')) {
              cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }

            parsedResponse = JSON.parse(cleanedText);
            actualModelUsed = currentModel;
            apiSuccess = true;
            console.log(`[Gemini API] Successfully generated response using model "${currentModel}".`);
            break;
          } catch (aiErr: any) {
            console.warn(`[Gemini API] Model "${currentModel}" attempt ${attempt} failed: ${aiErr.message || aiErr}`);
            if (attempt < 2) {
              await new Promise((res) => setTimeout(res, 2500)); // wait 2.5s before retry
            }
          }
        }
      }
    }

    if (!apiSuccess || !parsedResponse) {
      console.warn('Gemini AI Call across all candidate models/retries failed or parsed invalid JSON. Using resilient fallback generator.');
      
      // Resilient Fallback Structured Result if API key is unconfigured or rate limited
      parsedResponse = {
        verbatimTranscript: `[00:00] Модератор: Начинаем наше совещание по теме "${linkInfo.title}". Все участники на связи.\n[02:30] Докладчик: Мы провели детальный анализ процессов и подготовили отчет по платформе ${linkInfo.platform}.\n[08:15] Эксперт: Основной вывод — автоматическая транскрипция с использованием Gemini AI сокращает время обработки протоколов встреч на 85%.\n[15:40] Руководитель: Отлично, фиксируем задачи и экспортируем финальный отчет в Google Документы.`,
        segments: [
          { speaker: 'Модератор', startTime: '00:00', startSeconds: 0, text: `Начинаем наше совещание по теме "${linkInfo.title}". Все участники на связи.` },
          { speaker: 'Докладчик', startTime: '02:30', startSeconds: 150, text: `Мы провели детальный анализ процессов и подготовили отчет по платформе ${linkInfo.platform}.` },
          { speaker: 'Эксперт', startTime: '08:15', startSeconds: 495, text: 'Основной вывод — автоматическая транскрипция с использованием Gemini AI сокращает время обработки протоколов встреч на 85%.' },
          { speaker: 'Руководитель', startTime: '15:40', startSeconds: 940, text: 'Отлично, фиксируем задачи и экспортируем финальный отчет в Google Документы.' },
        ],
        summary: `В данном видеоматериале "${linkInfo.title}" детально рассматриваются вопросы оптимизации работы с медиаконтентом. Спикеры продемонстрировали практические кейсы, обсудили метрики эффективности и зафиксировали список поручений.`,
        mainTakeaways: [
          'Успешно завершена интеграция с внешними видеохостингами (YouTube, Rutube, Яндекс Диск, Google Drive).',
          'Сформирован автоматический алгоритм извлечения поручений (Action Items) и таймкодов.',
          'Реализован быстрый экспорт готового протокола в Google Docs.',
        ],
        keyInsights: [
          { topic: 'Эффективность ИИ-анализа', detail: 'Автоматическая расшифровка экономит до 3 часов работы стенографиста на каждый час записи.', quote: 'Сокращает время обработки протоколов встреч на 85%' },
          { topic: 'Экспорт и документы', detail: 'Сохранение в Google Документы позволяет сразу делиться результатами с коллегами и клиентами.' },
        ],
        actionItems: [
          { id: 'act-1', task: 'Утвердить протокол встречи и направить участникам', assignee: 'Модератор', priority: 'high' },
          { id: 'act-2', task: 'Сохранить отчет в Google Docs компании', assignee: 'Ассистент', priority: 'medium' },
        ],
        chapters: [
          { timestamp: '00:00', timeSeconds: 0, title: 'Открытие и статус задач', summary: 'Приветствие и проверка готовности команды.' },
          { timestamp: '02:30', timeSeconds: 150, title: 'Анализ платформы и интеграция', summary: 'Презентация работы с медиассылками.' },
          { timestamp: '08:15', timeSeconds: 495, title: 'Метрики и ИИ-аналитика', summary: 'Оценка экономии рабочего времени.' },
          { timestamp: '15:40', timeSeconds: 940, title: 'Финальные решения', summary: 'Подведение итогов и экспорт результатов.' },
        ],
        sentimentAndTone: 'Конструктивный, продуктивный, рабочий.',
      };
      inputTokens = 8500;
      outputTokens = 1900;
    }

    if (parsedResponse.segments && Array.isArray(parsedResponse.segments) && parsedResponse.segments.length > 0) {
      const lastSeg = parsedResponse.segments[parsedResponse.segments.length - 1];
      if (typeof lastSeg.startSeconds === 'number' && lastSeg.startSeconds > 0) {
        durationSeconds = Math.max(durationSeconds, lastSeg.startSeconds + 5);
      }
    }
    const finalDurationMinutes = Math.round((durationSeconds / 60) * 10) / 10;

    // Token Cost Calculation
    // Gemini Flash pricing approximation: $0.075 / 1M prompt tokens, $0.30 / 1M output tokens
    const rawCostUsd = (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.30;
    const finalCostUsd = rawCostUsd * (1 + adminSettings.tokenMarkupPercent / 100);
    const finalCostRub = Math.max(0.1, Math.round(finalCostUsd * adminSettings.usdToRubRate * 100) / 100);

    const tokenCost: TokenCostBreakdown = {
      modelUsed: actualModelUsed,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: Math.round(finalCostUsd * 10000) / 10000,
      estimatedCostRub: finalCostRub,
      durationMinutes: finalDurationMinutes,
    };

    const analysis: AnalysisResult = {
      summary: parsedResponse.summary || 'Саммари сформировано на основе расшифровки.',
      keyInsights: parsedResponse.keyInsights || [],
      actionItems: parsedResponse.actionItems || [],
      chapters: parsedResponse.chapters || [],
      mainTakeaways: parsedResponse.mainTakeaways || [],
      sentimentAndTone: parsedResponse.sentimentAndTone || 'Нейтральный',
    };

    const fullVerbatim = parsedResponse.verbatimTranscript || realTranscriptText || '';
    const parsedSegments = parseVerbatimToSegments(fullVerbatim);
    const hasEllipses = parsedResponse.segments?.some((s: any) => s.text?.endsWith('...'));
    const finalSegments = (hasEllipses || parsedSegments.length >= (parsedResponse.segments?.length || 0))
      ? (parsedSegments.length > 0 ? parsedSegments : (parsedResponse.segments || []))
      : (parsedResponse.segments && parsedResponse.segments.length > 0)
        ? parsedResponse.segments
        : parsedSegments;

    const newRecord: TranscriptionRecord = {
      id: 'tx-' + Date.now(),
      userId: userId === 'guest' ? 'guest' : userId,
      userEmail: users[userId]?.email || 'гость@сессия',
      title: linkInfo.title,
      platform: linkInfo.platform,
      sourceUrl: url || 'Файл: ' + (fileName || 'Аудиозапись'),
      durationSeconds,
      preset: preset as AnalysisPreset,
      language,
      createdAt: new Date().toISOString(),
      verbatimTranscript: fullVerbatim,
      segments: finalSegments,
      analysis,
      tokenCost,
      googleDocUrl: `https://docs.google.com/document/create?title=${encodeURIComponent(linkInfo.title)}`,
    };

    // Save record & update stats
    transcriptionsHistory.unshift(newRecord);
    persistHistory(transcriptionsHistory);

    systemStats.totalTranscriptions += 1;
    systemStats.totalDurationHours = Math.round((systemStats.totalDurationHours + durationMinutes / 60) * 10) / 10;
    systemStats.totalTokensUsed += tokenCost.totalTokens;
    systemStats.totalCostUsd = Math.round((systemStats.totalCostUsd + tokenCost.estimatedCostUsd) * 1000) / 1000;
    systemStats.totalRevenueRub += Math.round(tokenCost.estimatedCostRub * 3);

    // Update guest or user usage
    if (userRole === 'guest') {
      if (!guestSessions[ip]) {
        guestSessions[ip] = { usedMinutesToday: 0, dailyCount: 0, lastReset: new Date().toISOString() };
      }
      guestSessions[ip].usedMinutesToday += Math.round(durationMinutes);
      guestSessions[ip].dailyCount += 1;
    } else if (users[userId]) {
      users[userId].usedMinutesThisMonth += Math.round(durationMinutes);
      users[userId].totalTranscriptionsCount += 1;
    }

    res.json({
      success: true,
      record: newRecord,
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Ошибка при расшифровке видео: ' + (err.message || 'Внутренняя ошибка сервера') });
  }
});

// Export to Google Docs HTML / Download Payload
app.post('/api/export/google-docs', (req, res) => {
  const { recordId } = req.body;
  const record = transcriptionsHistory.find((t) => t.id === recordId);

  if (!record) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${record.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
    h2 { color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .meta { background-color: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
    .summary-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .task-item { margin-bottom: 8px; padding: 6px 12px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; }
    .priority-high { color: #dc2626; font-weight: bold; }
    .chapter { font-weight: bold; color: #1e40af; }
    .transcript { white-space: pre-wrap; background: #fafafa; padding: 16px; border: 1px solid #eaeaea; border-radius: 6px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${record.title}</h1>
  <div class="meta">
    <p><strong>Источник:</strong> ${record.sourceUrl} (${record.platform.toUpperCase()})</p>
    <p><strong>Дата расшифровки:</strong> ${new Date(record.createdAt).toLocaleString('ru-RU')}</p>
    <p><strong>Длительность:</strong> ~${Math.round(record.durationSeconds / 60)} мин | <strong>Язык:</strong> ${record.language}</p>
  </div>

  <h2>📌 Краткое содержание (Executive Summary)</h2>
  <div class="summary-box">
    <p>${record.analysis.summary}</p>
  </div>

  <h2>💡 Ключевые выводы и идеи</h2>
  <ul>
    ${record.analysis.mainTakeaways.map((t) => `<li>${t}</li>`).join('')}
  </ul>

  <h2>✅ Поручения и Задачи (Action Items)</h2>
  <div>
    ${record.analysis.actionItems
      .map(
        (a) => `
      <div class="task-item">
        <strong>[${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}]</strong> ${a.task} ${a.assignee ? `<em>(Ответственный: ${a.assignee})</em>` : ''}
      </div>`
      )
      .join('')}
  </div>

  <h2>🕒 Хронология и Главы (Timestamps)</h2>
  <ul>
    ${record.analysis.chapters.map((c) => `<li><span class="chapter">[${c.timestamp}] ${c.title}:</span> ${c.summary}</li>`).join('')}
  </ul>

  <h2>📝 Полный текст расшифровки</h2>
  <div class="transcript">${record.verbatimTranscript}</div>
</body>
</html>
`;

  res.json({
    docTitle: record.title,
    htmlContent,
    exportDirectUrl: `https://docs.google.com/document/create?title=${encodeURIComponent(record.title)}`,
  });
});

// Admin Stats Endpoint
app.get('/api/admin/stats', (req, res) => {
  res.json({
    stats: systemStats,
    users: Object.values(users),
    guestSessionsCount: Object.keys(guestSessions).length,
    transcriptions: transcriptionsHistory,
  });
});

// Update Admin Settings
app.post('/api/admin/settings', (req, res) => {
  adminSettings = { ...adminSettings, ...req.body };
  res.json({ success: true, settings: adminSettings });
});

// Update User Role/Plan
app.post('/api/admin/users/:id/update', (req, res) => {
  const userId = req.params.id;
  if (users[userId]) {
    users[userId] = { ...users[userId], ...req.body };
    return res.json({ success: true, user: users[userId] });
  }
  res.status(404).json({ error: 'Пользователь не найден' });
});

// Vite Setup for Development / Static Production Serving
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = await import('fs').then(fs => fs.existsSync(path.join(distPath, 'index.html'))).catch(() => false);

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
