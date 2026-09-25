export type VideoPlatform = 'youtube' | 'rutube' | 'yandex_disk' | 'google_drive' | 'kinescope' | 'direct_url' | 'file_upload';

export type AnalysisPreset = 'meeting' | 'lecture' | 'podcast' | 'screencast' | 'quick_summary' | 'sales_call' | 'custom';

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

// 1. Учебный конспект (для лекций и вебинаров)
export interface GlossaryTerm {
  term: string;
  definition: string;
  timestamp?: string;
}

export interface SelfCheckQuestion {
  question: string;
  answer: string;
}

export interface LectureTopicBlock {
  title: string;
  timestamp?: string;
  explanation: string;
  examples?: string[];
}

export interface LectureStudyGuide {
  subject: string; // Тема / Дисциплина
  coreGoal: string; // Чему учит лекция
  glossary: GlossaryTerm[]; // Термины и определения
  topicBreakdown: LectureTopicBlock[]; // Разбор тем по главам с примерами
  quiz: SelfCheckQuestion[]; // Вопросы для самопроверки
  cheatSheet: string[]; // Шпаргалка главных тезисов
}

// 2. Медиа-пак (для подкастов и интервью)
export interface QuoteHighlight {
  speaker: string;
  quote: string;
  timestamp?: string;
  context?: string;
}

export interface PodcastMediaPack {
  episodeHook: string; // Главный интригующий хук
  readyPostTelegram: string; // Готовый форматированный пост для Telegram
  blogArticleMarkdown: string; // Готовая статья-лонгрид для VC.ru / блога
  quotes: QuoteHighlight[]; // Золотой фонд цитат спикеров
  youtubeTimestamps: string; // Блок таймкодов для YouTube описания
  guestDebates?: string[]; // Спорные тезисы или разногласия спикеров
}

// 3. Экспресс-выжимка (TL;DR)
export interface QuickSummaryCard {
  oneMinuteVerdict: string; // Суть за 10-30 секунд
  threeKeyInsights: string[]; // 3 главных вывода
  targetAudienceRecommendation: {
    mustWatchFor: string; // Кому обязательно смотреть
    skipIf: string; // Кому можно пропустить
  };
}

// 4. Звонок клиенту / CustDev / Продажи (Enterprise)
export interface ClientPainPoint {
  pain: string; // Боль/проблема
  urgency: 'high' | 'medium' | 'low';
  quote?: string; // Цитата клиента
}

export interface ClientObjection {
  objection: string; // Сомнение или возражение ("дорого", "нет времени")
  rootCause?: string; // Истинная причина
  howHandledByManager?: string; // Как отработал менеджер
}

export interface SalesCallAnalysis {
  businessNiche?: string;
  clientType: string; // B2B / B2C / ЛПР / Менеджер
  currentSituation: string; // Текущая ситуация клиента
  painPoints: ClientPainPoint[]; // Боли и проблемы клиента
  objections: ClientObjection[]; // Возражения и сомнения
  budgetAndDecision: {
    budgetOrExpectations?: string; // Озвученные цифры / рамки бюджета
    decisionCriteria?: string; // Главный критерий выбора
    decisionMakers?: string; // Кто принимает решение
  };
  nextSteps: {
    action: string;
    deadline?: string;
    responsiblePerson: string;
  }[];
  customPromptFindings?: string; // Результаты поиска по пользовательскому промпту
  dealScore: number; // Оценка вероятности сделки (1-100)
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
  lectureStudyGuide?: LectureStudyGuide;
  podcastMediaPack?: PodcastMediaPack;
  quickSummaryCard?: QuickSummaryCard;
  salesCallAnalysis?: SalesCallAnalysis;
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
  businessNiche?: string;
  customAiPrompt?: string;
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
