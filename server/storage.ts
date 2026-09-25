import fs from 'fs';
import path from 'path';
import {
  TranscriptionRecord,
  AdminSettings,
  SystemStats,
  UserProfile,
  SpeakerSegment,
} from '../src/types.js';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const HISTORY_FILE = path.join(DATA_DIR, 'transcriptions.json');

// Default Admin Settings
export let adminSettings: AdminSettings = {
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
      features: [
        '15 часов расшифровки в месяц',
        'Безлимитная длина видео',
        'ИИ-Зрение: анализ скринкастов и презентаций',
        'Пошаговая инструкция (SOP / Регламент) для скринкастов',
        'Распознавание текста слайдов и действий на экране',
        'Приоритетная обработка и история',
      ],
    },
    {
      id: 'corporate_team',
      name: 'Корпоративный / Enterprise',
      maxMinutesPerMonth: 6000, // 100 hours
      maxVideoLengthMinutes: 360,
      priceRub: 4900,
      priceUsd: 55,
      features: [
        '100 часов для всей команды',
        'Мультимодальный анализ (звук + видеоряд со слайдами)',
        'Генерация регламентов и инструкций для обучения сотрудников',
        'Ролевая модель и доступ сотрудников',
        'Пользовательские ИИ-промпты',
        'Брендированный экспорт в Google Docs',
      ],
    },
  ],
};

export function updateAdminSettings(newSettings: Partial<AdminSettings>) {
  adminSettings = { ...adminSettings, ...newSettings };
}

// In-Memory Users & Sessions
export const users: Record<string, UserProfile> = {
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

export const guestSessions: Record<string, { usedMinutesToday: number; dailyCount: number; lastReset: string }> = {};

export let systemStats: SystemStats = {
  totalTranscriptions: 48,
  totalDurationHours: 42.5,
  totalTokensUsed: 620000,
  totalCostUsd: 0.065,
  totalRevenueRub: 14800,
  activeUsersCount: 12,
  guestSessionsCount: 35,
};

// Persistence functions
export function loadPersistedHistory(): TranscriptionRecord[] {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const records = JSON.parse(data);
      if (Array.isArray(records) && records.length > 0) {
        return records;
      }
    }
  } catch (e) {
    console.error('[Storage] Error reading history file:', e);
  }
  return [];
}

export function persistHistory(records: TranscriptionRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Storage] Error saving history:', e);
  }
}

export let transcriptionsHistory: TranscriptionRecord[] = loadPersistedHistory();

export function prependTranscriptionRecord(record: TranscriptionRecord) {
  transcriptionsHistory.unshift(record);
  persistHistory(transcriptionsHistory);
}

export function deleteTranscriptionRecord(id: string): boolean {
  const index = transcriptionsHistory.findIndex((t) => t.id === id);
  if (index !== -1) {
    transcriptionsHistory.splice(index, 1);
    persistHistory(transcriptionsHistory);
    return true;
  }
  return false;
}

// Helpers
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function parseVerbatimToSegments(verbatim: string): SpeakerSegment[] {
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

export function ensureCompleteSegments(record: TranscriptionRecord): TranscriptionRecord {
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
