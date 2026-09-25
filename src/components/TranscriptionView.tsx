import React, { useState } from 'react';
import { TranscriptionRecord, UserProfile } from '../types';
import {
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckSquare,
  Clock,
  Coins,
  Download,
  Copy,
  Share2,
  ExternalLink,
  Search,
  User,
  Quote,
  Check,
  Play,
  Volume2,
  Tag,
  Youtube,
  HardDrive,
  Cloud,
  FileAudio,
  CheckCircle2,
  BookOpen,
  ListChecks,
  GraduationCap,
  Mic,
  PhoneCall,
  Zap,
  Building2,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Target,
  Send,
} from 'lucide-react';

interface TranscriptionViewProps {
  record: TranscriptionRecord;
  onOpenGoogleDocsModal: (record: TranscriptionRecord) => void;
  onDeleteRecord?: (id: string) => void;
  currentUser?: UserProfile;
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  record,
  onOpenGoogleDocsModal,
  currentUser,
}) => {
  const hasGuide = !!record.analysis.stepByStepGuide || record.preset === 'screencast';
  const hasLecture = !!record.analysis.lectureStudyGuide || record.preset === 'lecture';
  const hasPodcast = !!record.analysis.podcastMediaPack || record.preset === 'podcast';
  const hasSalesCall = !!record.analysis.salesCallAnalysis || record.preset === 'sales_call';
  const hasQuickSummary = !!record.analysis.quickSummaryCard || record.preset === 'quick_summary';

  const hasSpecialized = hasGuide || hasLecture || hasPodcast || hasSalesCall || hasQuickSummary;

  const [activeTab, setActiveTab] = useState<'specialized' | 'analytics' | 'transcript' | 'tokens'>(
    hasSpecialized ? 'specialized' : 'analytics'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [copiedArticle, setCopiedArticle] = useState(false);
  const [copiedTimestamps, setCopiedTimestamps] = useState(false);
  const [copiedLecture, setCopiedLecture] = useState(false);
  const [revealedQuizAnswers, setRevealedQuizAnswers] = useState<Record<number, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [downloadedTxt, setDownloadedTxt] = useState(false);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [transcriptViewMode, setTranscriptViewMode] = useState<'segments' | 'verbatim'>('segments');

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-400" />;
      case 'rutube':
        return <Play className="w-5 h-5 text-blue-400" />;
      case 'yandex_disk':
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case 'google_drive':
        return <Cloud className="w-5 h-5 text-emerald-400" />;
      default:
        return <FileAudio className="w-5 h-5 text-purple-400" />;
    }
  };

  const handleJumpToTime = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      setCurrentTimeSeconds(parts[0] * 60 + parts[1]);
    }
  };

  const handleCopyGuide = () => {
    const guide = record.analysis.stepByStepGuide;
    if (!guide) return;
    let md = `# ${guide.title || record.title}\n\n`;
    md += `**🎯 ЦКП (Результат):** ${guide.goal}\n\n`;
    if (guide.prerequisites && guide.prerequisites.length > 0) {
      md += `### Предварительные требования:\n`;
      guide.prerequisites.forEach((p) => { md += `- ${p}\n`; });
      md += `\n`;
    }
    md += `### Пошаговые действия:\n`;
    guide.steps.forEach((s) => {
      md += `#### Шаг ${s.stepNumber}. ${s.title} ${s.timestamp ? `[${s.timestamp}]` : ''}\n`;
      md += `- **Действие:** ${s.action}\n`;
      if (s.screenDetails) md += `- **Интерфейс на экране:** ${s.screenDetails}\n`;
      if (s.notesOrWarnings) md += `- **⚠️ Внимание:** ${s.notesOrWarnings}\n`;
      md += `\n`;
    });
    if (guide.checklist && guide.checklist.length > 0) {
      md += `### Чек-лист проверки результата:\n`;
      guide.checklist.forEach((c) => { md += `- [ ] ${c}\n`; });
    }
    navigator.clipboard.writeText(md);
    setCopiedGuide(true);
    setTimeout(() => setCopiedGuide(false), 2500);
  };

  const handleCopyPost = () => {
    const post = record.analysis.podcastMediaPack?.readyPostTelegram;
    if (!post) return;
    navigator.clipboard.writeText(post);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2500);
  };

  const handleCopyArticle = () => {
    const art = record.analysis.podcastMediaPack?.blogArticleMarkdown;
    if (!art) return;
    navigator.clipboard.writeText(art);
    setCopiedArticle(true);
    setTimeout(() => setCopiedArticle(false), 2500);
  };

  const handleCopyTimestamps = () => {
    const ts = record.analysis.podcastMediaPack?.youtubeTimestamps;
    if (!ts) return;
    navigator.clipboard.writeText(ts);
    setCopiedTimestamps(true);
    setTimeout(() => setCopiedTimestamps(false), 2500);
  };

  const handleCopyLecture = () => {
    const l = record.analysis.lectureStudyGuide;
    if (!l) return;
    let md = `# ${l.subject || record.title}\n\n`;
    md += `**🎯 Цель материала:** ${l.coreGoal}\n\n`;
    if (l.glossary && l.glossary.length > 0) {
      md += `### 📖 Глоссарий терминов:\n`;
      l.glossary.forEach(g => {
        md += `- **${g.term}**: ${g.definition} ${g.timestamp ? `[${g.timestamp}]` : ''}\n`;
      });
      md += `\n`;
    }
    if (l.topicBreakdown && l.topicBreakdown.length > 0) {
      md += `### 📚 Разбор тем:\n`;
      l.topicBreakdown.forEach(t => {
        md += `#### ${t.title} ${t.timestamp ? `[${t.timestamp}]` : ''}\n${t.explanation}\n`;
        if (t.examples && t.examples.length > 0) {
          t.examples.forEach(ex => { md += `- *Пример:* ${ex}\n`; });
        }
        md += `\n`;
      });
    }
    if (l.quiz && l.quiz.length > 0) {
      md += `### 🧠 Вопросы для самопроверки:\n`;
      l.quiz.forEach((q, idx) => {
        md += `${idx + 1}. **${q.question}**\n   - *Ответ:* ${q.answer}\n`;
      });
      md += `\n`;
    }
    if (l.cheatSheet && l.cheatSheet.length > 0) {
      md += `### 💡 Шпаргалка ключевых мыслей:\n`;
      l.cheatSheet.forEach(c => { md += `- ${c}\n`; });
    }
    navigator.clipboard.writeText(md);
    setCopiedLecture(true);
    setTimeout(() => setCopiedLecture(false), 2500);
  };

  const getSpecializedTabInfo = () => {
    if (hasGuide) {
      return {
        name: '📘 Инструкция (SOP / Регламент)',
        icon: <BookOpen className="w-4 h-4 text-emerald-300" />,
        badgeText: 'ЦКП',
        badgeColor: 'bg-emerald-500/30 text-emerald-200',
        activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
      };
    }
    if (hasLecture) {
      return {
        name: '🎓 Учебный конспект & База знаний',
        icon: <GraduationCap className="w-4 h-4 text-indigo-300" />,
        badgeText: 'ЦКП',
        badgeColor: 'bg-indigo-500/30 text-indigo-200',
        activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
      };
    }
    if (hasPodcast) {
      return {
        name: '🎙 Медиа-пак & Цитатник',
        icon: <Mic className="w-4 h-4 text-purple-300" />,
        badgeText: 'ЦКП',
        badgeColor: 'bg-purple-500/30 text-purple-200',
        activeClass: 'bg-purple-600 text-white shadow-md shadow-purple-500/20',
      };
    }
    if (hasSalesCall) {
      return {
        name: '💼 Разбор звонка / CustDev',
        icon: <PhoneCall className="w-4 h-4 text-rose-300" />,
        badgeText: 'Enterprise 👑',
        badgeColor: 'bg-rose-500/30 text-rose-200',
        activeClass: 'bg-rose-600 text-white shadow-md shadow-rose-500/20',
      };
    }
    if (hasQuickSummary) {
      return {
        name: '⚡ Экспресс-выжимка (TL;DR)',
        icon: <Zap className="w-4 h-4 text-amber-300" />,
        badgeText: 'ЦКП',
        badgeColor: 'bg-amber-500/30 text-amber-200',
        activeClass: 'bg-amber-600 text-white shadow-md shadow-amber-500/20',
      };
    }
    return null;
  };

  const generateFullTextReport = () => {
    const displayLanguage = (!record.language || record.language.includes('?')) ? 'Русский' : record.language;
    const guide = record.analysis.stepByStepGuide;
    const guideSection = guide ? `
================================================================================
📘 ПОШАГОВАЯ ИНСТРУКЦИЯ (SOP / РЕГЛАМЕНТ)
--------------------------------------------------------------------------------
НАЗВАНИЕ: ${guide.title}
ЦКП (РЕЗУЛЬТАТ): ${guide.goal}

${guide.prerequisites && guide.prerequisites.length > 0 ? `ПРЕДВАРИТЕЛЬНЫЕ ТРЕБОВАНИЯ:\n${guide.prerequisites.map((p) => `- ${p}`).join('\n')}\n\n` : ''}ПОШАГОВЫЕ ДЕЙСТВИЯ:
${guide.steps.map((s) => `ШАГ ${s.stepNumber}. ${s.title} ${s.timestamp ? `[${s.timestamp}]` : ''}\n  - Действие: ${s.action}${s.screenDetails ? `\n  - Экран: ${s.screenDetails}` : ''}${s.notesOrWarnings ? `\n  - Важно: ${s.notesOrWarnings}` : ''}`).join('\n\n')}

${guide.checklist && guide.checklist.length > 0 ? `ЧЕК-ЛИСТ ПРОВЕРКИ:\n${guide.checklist.map((c) => `[ ] ${c}`).join('\n')}\n` : ''}` : '';

    return `================================================================================
НАЗВАНИЕ: ${record.title}
ИСТОЧНИК: ${record.sourceUrl} (${record.platform.toUpperCase()})
ДАТА: ${new Date(record.createdAt).toLocaleDateString('ru-RU')}
ДЛИТЕЛЬНОСТЬ: ~${Math.round(record.durationSeconds / 60)} мин (${record.durationSeconds} сек)
ЯЗЫК: ${displayLanguage}
================================================================================
${guideSection}
1. КРАТКОЕ СОДЕРЖАНИЕ (САММАРИ)
--------------------------------------------------------------------------------
${record.analysis.summary}

2. ГЛАВНЫЕ ВЫВОДЫ
--------------------------------------------------------------------------------
${record.analysis.mainTakeaways.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

3. ПОРУЧЕНИЯ И ЗАДАЧИ (ACTION ITEMS)
--------------------------------------------------------------------------------
${record.analysis.actionItems.map((a, idx) => `${idx + 1}. [${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}] ${a.task}${a.assignee ? ` (Ответственный: ${a.assignee})` : ''}`).join('\n')}

4. ГЛАВЫ И ТАЙМКОДЫ
--------------------------------------------------------------------------------
${record.analysis.chapters.map((c) => `[${c.timestamp}] ${c.title} — ${c.summary}`).join('\n')}

5. ПОЛНАЯ СТЕНОГРАММА ДИАЛОГА
--------------------------------------------------------------------------------
${
  record.segments && record.segments.length > 0
    ? record.segments.map((s) => `[${s.startTime}] ${s.speaker}: ${s.text}`).join('\n\n')
    : record.verbatimTranscript
}
================================================================================
`;
  };

  const handleCopyAll = () => {
    const textToCopy = generateFullTextReport();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const fullText = generateFullTextReport();
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.title.replace(/[^a-zA-Z0-9а-яА-Я_-]/gi, '_')}_отчет.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadedTxt(true);
    setTimeout(() => setDownloadedTxt(false), 3500);
  };

  const filteredTranscriptSegments = record.segments.filter((s) =>
    s.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                {getPlatformIcon(record.platform)}
                <span className="uppercase">{record.platform.replace('_', ' ')}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                ~{Math.round(record.durationSeconds / 60)} мин ({record.durationSeconds} сек)
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                Язык: {record.language}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {record.title}
            </h1>
            <p className="text-xs text-slate-400 truncate max-w-2xl">
              Источник: <a href={record.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{record.sourceUrl}</a>
            </p>
          </div>

          {/* Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenGoogleDocsModal(record)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-200" />
              <span>Сохранить в Google Docs</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                downloadedTxt
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {downloadedTxt ? <Check className="w-4 h-4 text-white" /> : <Download className="w-4 h-4 text-slate-400" />}
              <span>{downloadedTxt ? 'Отчет TXT скачан!' : 'Скачать TXT'}</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Скопировано!' : 'Копировать все'}</span>
            </button>
          </div>
        </div>

        {/* Media Player Bar Simulation with Jump navigation */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentTimeSeconds((prev) => (prev > 0 ? 0 : 120))}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-md transition"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="font-mono text-blue-400">
                {Math.floor(currentTimeSeconds / 60).toString().padStart(2, '0')}:
                {(currentTimeSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span className="font-mono">
                {Math.floor(record.durationSeconds / 60).toString().padStart(2, '0')}:
                {(record.durationSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden cursor-pointer">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentTimeSeconds / record.durationSeconds) * 100)}%` }}
              />
            </div>
          </div>
          <Volume2 className="w-4 h-4 text-slate-500 hidden sm:block" />
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {hasSpecialized && getSpecializedTabInfo() && (
          <button
            onClick={() => setActiveTab('specialized')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'specialized'
                ? getSpecializedTabInfo()!.activeClass
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {getSpecializedTabInfo()!.icon}
            <span>{getSpecializedTabInfo()!.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ml-1 ${getSpecializedTabInfo()!.badgeColor}`}>
              {getSpecializedTabInfo()!.badgeText}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>ИИ-Аналитика &amp; Задачи</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
            activeTab === 'transcript'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-300" />
          <span>Чистая Стенограмма ({record.segments.length || 1} фразы)</span>
        </button>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'tokens'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4 text-purple-300" />
            <span>Токены &amp; Стоимость ({record.tokenCost.estimatedCostRub} ₽)</span>
          </button>
        )}
      </div>

      {/* TAB: SPECIALIZED VALUE RESULT (ЦКП РАСШИФРОВКИ) */}
      {activeTab === 'specialized' && (
        <div className="space-y-6">
          {/* 1. SCREENCAST / PRESENTATION -> SOP GUIDE */}
          {hasGuide && (
            <div className="space-y-6">
              {/* Header Card: Title, Goal (ЦКП), Prerequisites & Copy Guide Button */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold mb-2">
                      <BookOpen className="w-3.5 h-3.5" /> ЦКП расшифровки: Готовая пошаговая инструкция (SOP)
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {record.analysis.stepByStepGuide?.title || `Инструкция по настройке: ${record.title}`}
                    </h2>
                  </div>
                  <button
                    onClick={handleCopyGuide}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition active:scale-95 shrink-0"
                  >
                    {copiedGuide ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedGuide ? 'Инструкция скопирована!' : 'Скопировать регламент (Markdown)'}</span>
                  </button>
                </div>

                {/* ЦКП / Цель инструкции */}
                <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-4 mb-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    🎯 Ценный конечный результат (ЦКП):
                  </span>
                  <p className="text-sm font-medium text-emerald-100 leading-relaxed">
                    {record.analysis.stepByStepGuide?.goal || 'Пошаговый алгоритм действий для точного повторения настроек из видеоматериала.'}
                  </p>
                </div>

                {/* Prerequisites */}
                {record.analysis.stepByStepGuide?.prerequisites && record.analysis.stepByStepGuide.prerequisites.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Перед началом работы подготовьте:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {record.analysis.stepByStepGuide.prerequisites.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-emerald-400" />
                    <span>Пошаговые действия ({record.analysis.stepByStepGuide?.steps?.length || 0} шагов)</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Нажимайте на таймкоды для перехода к моменту видео
                  </span>
                </div>

                {record.analysis.stepByStepGuide?.steps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                          {step.stepNumber || idx + 1}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {step.title}
                        </h4>
                      </div>
                      {step.timestamp && (
                        <button
                          onClick={() => handleJumpToTime(step.timestamp!)}
                          className="px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-mono font-medium flex items-center gap-1 transition"
                          title="Перейти к таймкоду в видео"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          [{step.timestamp}]
                        </button>
                      )}
                    </div>

                    {/* What to do */}
                    <div className="text-sm text-slate-200 leading-relaxed">
                      <strong className="text-emerald-400 font-semibold">Действие: </strong>
                      {step.action}
                    </div>

                    {/* Screen details */}
                    {step.screenDetails && (
                      <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2">
                        <span className="text-slate-500 font-semibold shrink-0">🖥️ Экран:</span>
                        <span>{step.screenDetails}</span>
                      </div>
                    )}

                    {/* Warnings / Notes */}
                    {step.notesOrWarnings && (
                      <div className="text-xs text-amber-300 bg-amber-950/20 p-3 rounded-xl border border-amber-900/40 flex items-start gap-2">
                        <span className="shrink-0">⚠️</span>
                        <span><strong>Важно: </strong>{step.notesOrWarnings}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Interactive Checklist */}
              {record.analysis.stepByStepGuide?.checklist && record.analysis.stepByStepGuide.checklist.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    <span>Чек-лист проверки результата (самоконтроль)</span>
                  </h3>
                  <div className="space-y-2.5">
                    {record.analysis.stepByStepGuide.checklist.map((item, idx) => {
                      const isChecked = !!checkedItems[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-slate-200'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                            isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`text-sm ${isChecked ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. LECTURE / WEBINAR -> STUDY GUIDE & GLOSSARY */}
          {hasLecture && record.analysis.lectureStudyGuide && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold mb-2">
                      <GraduationCap className="w-3.5 h-3.5" /> ЦКП расшифровки: Учебный Конспект &amp; База Знаний
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {record.analysis.lectureStudyGuide.subject || `Конспект вебинара: ${record.title}`}
                    </h2>
                  </div>
                  <button
                    onClick={handleCopyLecture}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition active:scale-95 shrink-0"
                  >
                    {copiedLecture ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLecture ? 'Конспект скопирован!' : 'Скопировать конспект (Markdown)'}</span>
                  </button>
                </div>

                <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                    🎯 Цель учебного материала:
                  </span>
                  <p className="text-sm font-medium text-indigo-100 leading-relaxed">
                    {record.analysis.lectureStudyGuide.coreGoal}
                  </p>
                </div>
              </div>

              {/* Glossary */}
              {record.analysis.lectureStudyGuide.glossary && record.analysis.lectureStudyGuide.glossary.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <span>Глоссарий терминов и ключевых понятий</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold ml-2">
                      {record.analysis.lectureStudyGuide.glossary.length} терминов
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {record.analysis.lectureStudyGuide.glossary.map((g, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/30 transition flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-sm font-bold text-indigo-300">{g.term}</span>
                            {g.timestamp && (
                              <button
                                onClick={() => handleJumpToTime(g.timestamp!)}
                                className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-mono flex items-center gap-1 transition"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                [{g.timestamp}]
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{g.definition}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic Breakdown */}
              {record.analysis.lectureStudyGuide.topicBreakdown && record.analysis.lectureStudyGuide.topicBreakdown.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                    <span>Структурированный конспект по темам</span>
                  </h3>
                  <div className="space-y-3.5">
                    {record.analysis.lectureStudyGuide.topicBreakdown.map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>{t.title}</span>
                          </h4>
                          {t.timestamp && (
                            <button
                              onClick={() => handleJumpToTime(t.timestamp!)}
                              className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-mono flex items-center gap-1 transition"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              [{t.timestamp}]
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{t.explanation}</p>
                        {t.examples && t.examples.length > 0 && (
                          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
                            <span className="font-semibold text-indigo-300">Примеры и кейсы спикера:</span>
                            <ul className="list-disc list-inside space-y-1 text-slate-400">
                              {t.examples.map((ex, exIdx) => (
                                <li key={exIdx}>{ex}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz */}
              {record.analysis.lectureStudyGuide.quiz && record.analysis.lectureStudyGuide.quiz.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    <span>Вопросы для самопроверки (Квиз с ответами)</span>
                  </h3>
                  <div className="space-y-3">
                    {record.analysis.lectureStudyGuide.quiz.map((q, idx) => {
                      const isRevealed = !!revealedQuizAnswers[idx];
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-200">
                              <span className="text-amber-400 font-bold mr-1.5">#{idx + 1}</span> {q.question}
                            </p>
                            <button
                              onClick={() => setRevealedQuizAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition shrink-0"
                            >
                              {isRevealed ? 'Скрыть ответ' : 'Показать ответ'}
                            </button>
                          </div>
                          {isRevealed && (
                            <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200 animate-in fade-in">
                              <strong>Ответ: </strong> {q.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cheat Sheet */}
              {record.analysis.lectureStudyGuide.cheatSheet && record.analysis.lectureStudyGuide.cheatSheet.length > 0 && (
                <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 shadow-md">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span>Шпаргалка главных выводов лектора</span>
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                    {record.analysis.lectureStudyGuide.cheatSheet.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 3. PODCAST / INTERVIEW -> MEDIA PACK */}
          {hasPodcast && record.analysis.podcastMediaPack && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/40 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold mb-2">
                      <Mic className="w-3.5 h-3.5" /> ЦКП расшифровки: Медиа-пак для соцсетей &amp; Блога
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {record.title}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCopyPost}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition active:scale-95"
                    >
                      {copiedPost ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      <span>{copiedPost ? 'Пост скопирован!' : 'Пост для Telegram'}</span>
                    </button>
                    <button
                      onClick={handleCopyArticle}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                    >
                      {copiedArticle ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedArticle ? 'Статья скопирована!' : 'Статья (Markdown)'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-purple-950/50 border border-purple-500/30 rounded-xl p-4">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                    🔥 Интригующий лид / Хук выпуска:
                  </span>
                  <p className="text-sm font-medium text-purple-100 leading-relaxed">
                    {record.analysis.podcastMediaPack.episodeHook}
                  </p>
                </div>
              </div>

              {/* Ready Telegram Post */}
              {record.analysis.podcastMediaPack.readyPostTelegram && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Send className="w-5 h-5 text-blue-400" />
                      <span>Готовый пост для Telegram-канала</span>
                    </h3>
                    <button
                      onClick={handleCopyPost}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition flex items-center gap-1"
                    >
                      {copiedPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Копировать пост</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-sans text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {record.analysis.podcastMediaPack.readyPostTelegram}
                  </div>
                </div>
              )}

              {/* Speaker Quotes */}
              {record.analysis.podcastMediaPack.quotes && record.analysis.podcastMediaPack.quotes.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <Quote className="w-5 h-5 text-amber-400" />
                    <span>«Золотой фонд» ярких цитат спикеров</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold ml-2">
                      {record.analysis.podcastMediaPack.quotes.length} цитат
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {record.analysis.podcastMediaPack.quotes.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 border-l-4 border-l-amber-500 space-y-2"
                      >
                        <p className="text-xs sm:text-sm italic text-slate-200">
                          «{q.quote}»
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-850">
                          <span className="font-semibold text-amber-400">— {q.speaker}</span>
                          {q.timestamp && (
                            <button
                              onClick={() => handleJumpToTime(q.timestamp!)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-mono text-[11px] flex items-center gap-1 transition"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              [{q.timestamp}]
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Timestamps Box */}
              {record.analysis.podcastMediaPack.youtubeTimestamps && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-400" />
                      <span>Таймкоды для описания на YouTube</span>
                    </h3>
                    <button
                      onClick={handleCopyTimestamps}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium transition flex items-center gap-1"
                    >
                      {copiedTimestamps ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Копировать таймкоды</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {record.analysis.podcastMediaPack.youtubeTimestamps}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 4. SALES CALL / CUSTDEV -> ENTERPRISE ANALYSIS */}
          {hasSalesCall && record.analysis.salesCallAnalysis && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-semibold mb-2">
                      <PhoneCall className="w-3.5 h-3.5" /> ЦКП: Разбор звонка / CustDev (Enterprise Анализ)
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {record.businessNiche ? `Ниша: ${record.businessNiche} • ` : ''}{record.title}
                    </h2>
                  </div>
                  <div className="bg-rose-950/60 border border-rose-500/30 px-5 py-3 rounded-xl text-center shrink-0">
                    <span className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold block">
                      Deal Score (Зрелость сделки):
                    </span>
                    <span className="text-2xl font-extrabold text-white">
                      {record.analysis.salesCallAnalysis.dealScore || 75} / 100
                    </span>
                  </div>
                </div>

                <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                    👤 Профиль клиента: {record.analysis.salesCallAnalysis.clientType}
                  </div>
                  <p className="text-sm font-medium text-rose-100 leading-relaxed">
                    {record.analysis.salesCallAnalysis.currentSituation}
                  </p>
                </div>
              </div>

              {/* Pain points & Objections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-rose-400" />
                    <span>Выявленные боли клиента (Pain Points)</span>
                  </h3>
                  <div className="space-y-3">
                    {record.analysis.salesCallAnalysis.painPoints.map((p, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-200">{p.pain}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.urgency === 'high' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {p.urgency === 'high' ? 'Критично' : 'Умеренно'}
                          </span>
                        </div>
                        {p.quote && (
                          <p className="text-xs italic text-slate-400">«{p.quote}»</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    <span>Сомнения, возражения и отработка</span>
                  </h3>
                  <div className="space-y-3">
                    {record.analysis.salesCallAnalysis.objections.map((o, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                        <div className="text-sm font-semibold text-amber-300">
                          Сомнение: {o.objection}
                        </div>
                        {o.rootCause && (
                          <div className="text-xs text-slate-400">
                            <strong className="text-slate-300">Истинная причина:</strong> {o.rootCause}
                          </div>
                        )}
                        {o.howHandledByManager && (
                          <div className="text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg">
                            <strong>Отработка менеджером:</strong> {o.howHandledByManager}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget & Next Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-blue-400" />
                    <span>Бюджет и критерии принятия решений</span>
                  </h3>
                  <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                    <p><strong className="text-slate-200">Бюджет / Ожидания:</strong> {record.analysis.salesCallAnalysis.budgetAndDecision.budgetOrExpectations || 'Не озвучен прямо'}</p>
                    <p><strong className="text-slate-200">Главный критерий выбора:</strong> {record.analysis.salesCallAnalysis.budgetAndDecision.decisionCriteria || 'Стандартные условия'}</p>
                    <p><strong className="text-slate-200">Лица, принимающие решение (ЛПР):</strong> {record.analysis.salesCallAnalysis.budgetAndDecision.decisionMakers || 'Собеседник'}</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    <span>Следующие шаги и договоренности (Next Steps)</span>
                  </h3>
                  <div className="space-y-2">
                    {record.analysis.salesCallAnalysis.nextSteps.map((s, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-medium">{s.action}</span>
                        <span className="text-slate-400 font-mono">[{s.responsiblePerson}{s.deadline ? `, ${s.deadline}` : ''}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Prompt Findings */}
              {record.analysis.salesCallAnalysis.customPromptFindings && (
                <div className="bg-gradient-to-r from-rose-950/30 to-purple-950/30 border border-rose-500/30 rounded-2xl p-6 shadow-md">
                  <h3 className="text-base font-bold text-rose-300 flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-rose-400" />
                    <span>Результат анализа по вашему специальному промпту:</span>
                  </h3>
                  {record.customAiPrompt && (
                    <p className="text-xs font-mono text-slate-400 mb-2">«{record.customAiPrompt}»</p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    {record.analysis.salesCallAnalysis.customPromptFindings}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. QUICK SUMMARY -> ONE PAGER */}
          {hasQuickSummary && record.analysis.quickSummaryCard && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold mb-3">
                  <Zap className="w-3.5 h-3.5" /> ЦКП расшифровки: Экспресс-выжимка (TL;DR)
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-4">
                  Вердикт за 30 секунд: {record.title}
                </h2>
                <div className="bg-amber-950/50 border border-amber-500/30 rounded-xl p-4 text-sm font-medium text-amber-100 leading-relaxed">
                  {record.analysis.quickSummaryCard.oneMinuteVerdict}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>3 Главных Инсайта</span>
                  </h3>
                  <div className="space-y-2.5">
                    {record.analysis.quickSummaryCard.threeKeyInsights.map((ins, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-200 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Кому стоит смотреть / Кому пропустить</span>
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                      <strong className="block text-emerald-300 font-bold mb-1">✅ Обязательно смотреть:</strong>
                      {record.analysis.quickSummaryCard.targetAudienceRecommendation.mustWatchFor}
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400">
                      <strong className="block text-slate-300 font-bold mb-1">⏭️ Можно пропустить:</strong>
                      {record.analysis.quickSummaryCard.targetAudienceRecommendation.skipIf}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: AI ANALYTICS & ACTION ITEMS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Left Column: Summary, Action Items & Insights */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Executive Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Основное Саммари (Executive Summary)</span>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                {record.analysis.summary}
              </p>
            </div>

            {/* Action Items / Tasks */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Поручения и Задачи (Action Items)</span>
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {record.analysis.actionItems.length} задач
                </span>
              </div>

              <div className="space-y-3">
                {record.analysis.actionItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-200 text-sm font-medium">{item.task}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        {item.assignee && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <User className="w-3 h-3 text-blue-400" /> {item.assignee}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            item.priority === 'high'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          Приоритет: {item.priority === 'high' ? 'Высокий' : 'Обычный'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Insights with Quotes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Quote className="w-4 h-4 text-indigo-400" />
                <span>Ключевые идеи и Цитаты спикеров</span>
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {record.analysis.keyInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                      {insight.topic}
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{insight.detail}</p>
                    {insight.quote && (
                      <blockquote className="mt-2.5 pl-3 border-l-2 border-indigo-500 text-xs italic text-slate-400">
                        «{insight.quote}»
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Timeline Chapters & Takeaways */}
          <div className="space-y-6">
            
            {/* Chapters & Timestamps */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Таймкоды &amp; Главы</span>
              </h3>

              <div className="space-y-3">
                {record.analysis.chapters.map((ch, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentTimeSeconds(ch.timeSeconds || 0)}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white transition">
                        [{ch.timestamp}]
                      </span>
                      <Play className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{ch.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ch.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Takeaways */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Главные выводы</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {record.analysis.mainTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: VERBATIM TRANSCRIPT */}
      {activeTab === 'transcript' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по словам или спикерам в стенограмме..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setTranscriptViewMode('segments')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    transcriptViewMode === 'segments'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  По репликам ({filteredTranscriptSegments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTranscriptViewMode('verbatim')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    transcriptViewMode === 'verbatim'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Сплошная стенограмма
                </button>
              </div>
            </div>
          </div>

          {transcriptViewMode === 'verbatim' ? (
            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 max-h-[600px] overflow-y-auto">
              <div className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed select-text space-y-2">
                {record.verbatimTranscript}
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredTranscriptSegments.length > 0 ? (
                filteredTranscriptSegments.map((seg, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentTimeSeconds(seg.startSeconds || 0)}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {seg.speaker}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 hover:text-blue-400 transition">
                        [{seg.startTime}]
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{seg.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Ничего не найдено по запросу "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TOKEN COSTS & FINANCIAL METRICS */}
      {activeTab === 'tokens' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Coins className="w-5 h-5 text-purple-400" />
              <span>Прозрачный Расчет ИИ-Токенов &amp; Себестоимости</span>
            </h3>
            <p className="text-xs text-slate-400">
              Каждый запрос к Gemini AI подсчитывается с высокой точностью. Вот полная финансовая статистика по этой видеозаписи.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">Модель ИИ</p>
              <p className="text-lg font-bold text-purple-300 mt-1 font-mono">{record.tokenCost.modelUsed}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Google GenAI SDK</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">Токены Входа / Выхода</p>
              <p className="text-lg font-bold text-blue-300 mt-1 font-mono">
                {record.tokenCost.inputTokens.toLocaleString()} / {record.tokenCost.outputTokens.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Всего: {record.tokenCost.totalTokens.toLocaleString()} токенов</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">Себестоимость API ($)</p>
              <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                ${record.tokenCost.estimatedCostUsd.toFixed(4)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">По тарифу Google Cloud</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-xs text-slate-400 uppercase font-semibold">Стоимость в Рублях (₽)</p>
              <p className="text-lg font-bold text-amber-300 mt-1 font-mono">
                ~{record.tokenCost.estimatedCostRub} ₽
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">С учетом наценки сервиса</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-purple-300">💡 Справка для Главного Администратора:</h4>
            <p>
              Средняя стоимость расшифровки 1 часа видео на модели Gemini 2.5 Flash составляет от <strong className="text-white">0.15 до 0.40 ₽</strong> за токены. Это позволяет владельцу сервиса продавать подписки с маржинальностью более <strong className="text-emerald-400">900%</strong>!
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
