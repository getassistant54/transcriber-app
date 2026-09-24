import React, { useState } from 'react';
import { TranscriptionRecord } from '../types';
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
} from 'lucide-react';

interface TranscriptionViewProps {
  record: TranscriptionRecord;
  onOpenGoogleDocsModal: (record: TranscriptionRecord) => void;
  onDeleteRecord?: (id: string) => void;
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  record,
  onOpenGoogleDocsModal,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'transcript' | 'tokens'>('analytics');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
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

  const generateFullTextReport = () => {
    const displayLanguage = (!record.language || record.language.includes('?')) ? 'Русский' : record.language;
    return `================================================================================
НАЗВАНИЕ: ${record.title}
ИСТОЧНИК: ${record.sourceUrl} (${record.platform.toUpperCase()})
ДАТА: ${new Date(record.createdAt).toLocaleDateString('ru-RU')}
ДЛИТЕЛЬНОСТЬ: ~${Math.round(record.durationSeconds / 60)} мин (${record.durationSeconds} сек)
ЯЗЫК: ${displayLanguage}
================================================================================

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
      </div>

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
