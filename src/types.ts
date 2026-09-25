export type VideoPlatform = 'youtube' | 'rutube' | 'yandex_disk' | 'google_drive' | 'kinescope' | 'direct_url' | 'file_upload';

export type AnalysisPreset = 'meeting' | 'lecture' | 'podcast' | 'screencast' | 'quick_summary' | 'custom';

export type UserRole = 'admin' | 'corporate_user' | 'standard_user' | 'guest';

export interface UserPlan {
  id: string;
  name: string;
  maxMinutesPerMonth: number;
  maxVideoLengthMinutes: number;
  priceRub: number;
  priceUsd: number;
  features: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  planId: string;
  usedMinutesThisMonth: number;
  totalTranscriptionsCount: number;
  balanceRub: number;
  createdAt: string;
}

export interface SpeakerSegment {
  speaker: string;
  startTime: string; // e.g. "01:23"
  startSeconds: number;
  text: string;
}

export interface KeyChapter {
  timestamp: string; // e.g. "04:15"
  timeSeconds: number;
  title: string;
  summary: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface KeyInsight {
  topic: string;
  detail: string;
  quote?: string;
}

export interface InstructionStep {
  stepNumber: number;
  timestamp?: string; // e.g. "01:23"
  title: string; // Краткое название шага
  action: string; // Конкретное действие (куда нажать, что ввести)
  screenDetails?: string; // Что отображается на экране (кнопки, разделы, меню)
  notesOrWarnings?: string; // Важные предостережения и нюансы
}

export interface StepByStepGuide {
  title: string;
  goal: string; // ЦКП (Ценный Конечный Продукт) / Результат
  prerequisites?: string[]; // Что нужно подготовить (доступы, ключи, файлы)
  steps: InstructionStep[];
  checklist?: string[]; // Чек-лист проверки готовности
}

export interface TokenCostBreakdown {
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostRub: number;
  durationMinutes: number;
}

export interface AnalysisResult {
  summary: string;
  keyInsights: KeyInsight[];
  actionItems: ActionItem[];
  chapters: KeyChapter[];
  mainTakeaways: string[];
  sentimentAndTone: string;
  stepByStepGuide?: StepByStepGuide;
}

export interface TranscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  platform: VideoPlatform;
  sourceUrl: string;
  durationSeconds: number;
  preset: AnalysisPreset;
  language: string;
  createdAt: string;
  verbatimTranscript: string;
  segments: SpeakerSegment[];
  analysis: AnalysisResult;
  tokenCost: TokenCostBreakdown;
  googleDocUrl?: string;
}

export interface AdminSettings {
  guestMaxDurationMinutes: number;
  guestDailyLimitCount: number;
  tokenMarkupPercent: number; // e.g. 50% margin
  usdToRubRate: number; // e.g. 90 RUB per USD
  aiProvider: 'gemini' | 'hydra';
  activeModel: string;
  hydraBaseUrl?: string;
  hydraModel?: string;
  customSystemPrompt: string;
  plans: UserPlan[];
  corporateDomainWhitelist: string[];
}

export interface SystemStats {
  totalTranscriptions: number;
  totalDurationHours: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  totalRevenueRub: number;
  activeUsersCount: number;
  guestSessionsCount: number;
}
