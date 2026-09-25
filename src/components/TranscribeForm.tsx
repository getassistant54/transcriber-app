import React, { useState } from 'react';
import { AnalysisPreset, VideoPlatform } from '../types';
import {
  Youtube,
  FileAudio,
  Sparkles,
  PlayCircle,
  FileText,
  Clock,
  Briefcase,
  GraduationCap,
  Mic,
  Zap,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Monitor,
  Video,
  Info,
  PhoneCall,
  Building2,
} from 'lucide-react';

interface TranscribeFormProps {
  onTranscribe: (data: {
    url?: string;
    rawText?: string;
    preset: AnalysisPreset;
    language: string;
    customTitle?: string;
    fileName?: string;
    fileBase64?: string;
    fileMimeType?: string;
    businessNiche?: string;
    customAiPrompt?: string;
  }) => void;
  isLoading: boolean;
  isGuest: boolean;
  guestLimits?: {
    usedMinutesToday: number;
    maxMinutesToday: number;
    dailyCount: number;
    maxDailyCount: number;
  };
}

export const TranscribeForm: React.FC<TranscribeFormProps> = ({
  onTranscribe,
  isLoading,
  isGuest,
  guestLimits,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<VideoPlatform>('file_upload');
  const [inputUrl, setInputUrl] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [preset, setPreset] = useState<AnalysisPreset>('meeting');
  const [language, setLanguage] = useState('Русский');
  const [inputMode, setInputMode] = useState<'url' | 'file' | 'text'>('file');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);
  const [uploadedFileMimeType, setUploadedFileMimeType] = useState<string | null>(null);
  const [fileSizeMb, setFileSizeMb] = useState<number | null>(null);
  const [fileReading, setFileReading] = useState<boolean>(false);
  const [businessNiche, setBusinessNiche] = useState('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');

  const platformPresets: { id: VideoPlatform; name: string; icon: React.ReactNode; color: string; placeholder: string }[] = [
    {
      id: 'file_upload',
      name: 'Файл (Аудио / Скринкаст)',
      icon: <FileAudio className="w-5 h-5" />,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-400',
      placeholder: '',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube className="w-5 h-5" />,
      color: 'hover:border-red-500/50 hover:bg-red-500/10 text-red-400',
      placeholder: 'Вставьте ссылку на YouTube (например: https://www.youtube.com/watch?v=...)',
    },
    {
      id: 'kinescope',
      name: 'Kinescope',
      icon: <PlayCircle className="w-5 h-5" />,
      color: 'hover:border-violet-500/50 hover:bg-violet-500/10 text-violet-400',
      placeholder: 'Вставьте ссылку на Kinescope (например: https://kinescope.io/...)',
    },
  ];

  const analysisPresetsList: {
    id: AnalysisPreset;
    name: string;
    desc: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'meeting',
      name: 'Деловая встреча / Совещание',
      desc: 'Выделяет задачи (Action Items), ответственных, решения и споры.',
      icon: <Briefcase className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'screencast',
      name: 'Скринкаст / Презентация',
      desc: 'ИИ-Зрение: текст слайдов, действия на экране, софт и регламент.',
      icon: <Monitor className="w-5 h-5 text-emerald-400" />,
      badge: 'PRO Видео',
    },
    {
      id: 'lecture',
      name: 'Лекция / Вебинар',
      desc: 'Конспект, термины, глоссарий, квиз-вопросы и база знаний.',
      icon: <GraduationCap className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'podcast',
      name: 'Подкаст / Интервью',
      desc: 'Медиа-пак: пост в Telegram, статья для VC/блога и цитаты.',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'sales_call',
      name: 'Звонок / CustDev / Продажи',
      desc: 'Боли клиента, возражения, бюджет и вероятность сделки.',
      icon: <PhoneCall className="w-5 h-5 text-rose-400" />,
      badge: 'Enterprise 👑',
    },
    {
      id: 'quick_summary',
      name: 'Быстрый обзор (Экспресс)',
      desc: 'Ультра-короткое саммари за 10 секунд и 3 главных вывода.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'url' && !inputUrl.trim()) return;
    if (inputMode === 'text' && !rawTextInput.trim()) return;
    if (inputMode === 'file' && (!uploadedFileName || fileReading)) return;

    onTranscribe({
      url: inputMode === 'url' ? inputUrl.trim() : undefined,
      rawText: inputMode === 'text' ? rawTextInput.trim() : undefined,
      preset,
      language,
      customTitle: customTitle.trim() || undefined,
      fileName: uploadedFileName || undefined,
      fileBase64: inputMode === 'file' ? (uploadedFileBase64 || undefined) : undefined,
      fileMimeType: inputMode === 'file' ? (uploadedFileMimeType || undefined) : undefined,
      businessNiche: businessNiche.trim() || undefined,
      customAiPrompt: customAiPrompt.trim() || undefined,
    });
  };

  const clearUploadedFile = () => {
    setUploadedFileName(null);
    setUploadedFileBase64(null);
    setUploadedFileMimeType(null);
    setFileSizeMb(null);
  };

  const handleSelectPlatform = (platformId: VideoPlatform) => {
    setSelectedPlatform(platformId);
    if (platformId === 'file_upload') {
      setInputMode('file');
    } else if (platformId === 'kinescope') {
      setInputMode('url');
      setPreset('lecture'); // Kinescope is predominantly webinar / course lecture
      clearUploadedFile();
    } else {
      setInputMode('url');
      clearUploadedFile();
    }
  };

  const handleUrlChange = (val: string) => {
    setInputUrl(val);
    const lower = val.toLowerCase();
    if (lower.includes('kinescope.io')) {
      setSelectedPlatform('kinescope');
      setPreset('lecture');
    } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setSelectedPlatform('youtube');
      if (lower.includes('podcast') || lower.includes('interview')) {
        setPreset('podcast');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
      if (sizeMb > 250) {
        alert(`Файл "${file.name}" слишком большой (${sizeMb} МБ). Максимальный размер файла для веб-интерфейса — 250 МБ. Пожалуйста, сожмите видео или извлеките аудиодорожку.`);
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'webm', 'avi', 'mkv'].includes(ext);

      let mime = file.type;
      if (!mime || mime === '') {
        if (ext === 'mp4') mime = 'video/mp4';
        else if (ext === 'mov') mime = 'video/quicktime';
        else if (ext === 'webm') mime = 'video/webm';
        else if (ext === 'm4a') mime = 'audio/m4a';
        else if (ext === 'mp3') mime = 'audio/mp3';
        else if (ext === 'wav') mime = 'audio/wav';
        else mime = isVideo ? 'video/mp4' : 'audio/mp3';
      }

      setUploadedFileName(file.name);
      setInputMode('file');
      if (!customTitle) setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
      setFileSizeMb(sizeMb);
      setUploadedFileMimeType(mime);

      // Smart preset linking: video -> screencast/instruction, audio -> meeting
      if (isVideo) {
        setPreset('screencast');
      } else {
        setPreset('meeting');
      }

      setFileReading(true);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadedFileBase64(result);
        setFileReading(false);
      };
      reader.onerror = () => {
        setFileReading(false);
        alert('Не удалось прочитать файл в браузере.');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      
      {/* Header Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> ИИ-Обработка через Gemini 3.6 Flash
          </div>
          {isGuest && (
            <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Разовая сессия
            </div>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Расшифровка видео и аудио в текст &amp; AI Саммари
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Вставьте ссылку на видео с <strong className="text-slate-200">YouTube</strong>, <strong className="text-slate-200">Kinescope</strong> или загрузите медиафайл (<strong className="text-slate-200">аудиозапись или видео со скринкастом/презентацией</strong>). Получите полную стенограмму, действия на экране, список задач и экспорт в <strong className="text-blue-400">Google Документы</strong>.
        </p>
      </div>

      {/* Platform Pills */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Выберите источник медиафайла:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {platformPresets.map((p) => {
            const isSelected = p.id === 'file_upload' ? inputMode === 'file' : (selectedPlatform === p.id && inputMode === 'url');
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPlatform(p.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : `bg-slate-800/80 border-slate-700/80 text-slate-300 ${p.color}`
                }`}
              >
                {p.icon}
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Helpful Tip for Cloud Disks & Zoom */}
        <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 border border-slate-800/80 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Записи из Zoom, Rutube, Яндекс Диска или Telegram: просто сохраните файл на устройство и выберите «Файл (Аудио / Скринкаст)».</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Input Mode Selector & Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setInputMode('url'); clearUploadedFile(); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  inputMode === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                🔗 Ссылка на видео
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  inputMode === 'file' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📁 Загрузить файл (MP3/M4A/WAV)
              </button>
              <button
                type="button"
                onClick={() => { setInputMode('text'); clearUploadedFile(); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Вставить готовый сырой текст
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Язык:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="Русский">Русский 🇷🇺</option>
                <option value="English">English 🇺🇸</option>
                <option value="Автоматический">Авто-определение 🌐</option>
              </select>
            </div>
          </div>

          {/* Main Input Controls */}
          {inputMode === 'url' && (
            <div className="relative">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={
                  selectedPlatform === 'kinescope'
                    ? 'Вставьте ссылку на Kinescope (например: https://kinescope.io/...)'
                    : selectedPlatform === 'youtube'
                    ? 'Вставьте ссылку на YouTube (например: https://www.youtube.com/watch?v=...)'
                    : 'Вставьте ссылку на YouTube, Rutube, Kinescope или Яндекс Диск...'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 pr-24 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
                required
              />
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => setInputUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-md border border-slate-700 transition"
                  title="Очистить поле ввода"
                >
                  ✕ Очистить
                </button>
              )}
            </div>
          )}

          {inputMode === 'file' && (
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-950/60 rounded-xl p-6 text-center transition cursor-pointer relative">
              <input
                type="file"
                accept="audio/*,video/*,.m4a,.mp3,.wav,.mp4,.aac,.ogg,.flac"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileAudio className="w-10 h-10 mx-auto text-blue-400 mb-2" />
              <p className="text-sm font-medium text-slate-200">
                {fileReading ? (
                  <span className="text-amber-400 flex items-center justify-center gap-1.5 animate-pulse">
                    <Clock className="w-4 h-4" /> Чтение и подготовка файла ({fileSizeMb} МБ)...
                  </span>
                ) : uploadedFileName ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {uploadedFileMimeType?.includes('video') ? 'Видео готово к анализу:' : 'Аудио готово к расшифровке:'} {uploadedFileName} {fileSizeMb ? `(${fileSizeMb} МБ)` : ''}
                  </span>
                ) : (
                  'Перетащите файл (MP3, M4A, WAV или видео MP4/MOV) сюда или нажмите для выбора'
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Поддерживаются аудиозаписи и скринкасты/видео до 250 МБ (мультимодальный анализ Gemini AI)
              </p>
            </div>
          )}

          {inputMode === 'text' && (
            <textarea
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              placeholder="Вставьте сырую стенограмму или фрагмент выступления для глубокого ИИ-анализа и выделения задач..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
            />
          )}

          {/* Optional Title input */}
          <div className="pt-1">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Название встречи / видео (необязательно, определится автоматически)"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Preset Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Режим анализа &amp; Фокус ИИ:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysisPresetsList.map((p) => {
              const isSelected = preset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/80 ring-1 ring-blue-500/30'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        {p.icon}
                        <span className="font-semibold text-sm text-white">{p.name}</span>
                      </div>
                      {p.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                          p.id === 'sales_call'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise Business Inputs (Niche & Custom Prompt) */}
          {preset === 'sales_call' && (
            <div className="mt-4 bg-gradient-to-r from-rose-950/40 via-purple-950/20 to-slate-900 border border-rose-500/40 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs sm:text-sm">
                  <PhoneCall className="w-4 h-4 text-rose-400" />
                  <span>Бизнес-настройки для CustDev / Созвона по продажам</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase w-fit">
                  Enterprise 👑
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ИИ проанализирует говорящие головы, аргументы, интонации и возражения клиентов с учетом специфики вашей ниши.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-rose-400" />
                    Ниша / Сфера вашего бизнеса:
                  </label>
                  <input
                    type="text"
                    value={businessNiche}
                    onChange={(e) => setBusinessNiche(e.target.value)}
                    placeholder="например: Онлайн-школа, Недвижимость, B2B SaaS, IT-услуги..."
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    Свой промпт / Фокус анализа для ИИ:
                  </label>
                  <input
                    type="text"
                    value={customAiPrompt}
                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                    placeholder="например: Почему клиент сомневается и упомянул ли он наших конкурентов?"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button & Guest Warning */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>
              Модель Gemini 3.6 Flash • Расчет стоимости токенов включен
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-white shadow-xl flex items-center justify-center gap-2.5 transition-all ${
              isLoading
                ? 'bg-slate-700 cursor-not-allowed opacity-80'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-600/25 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>
                  {inputMode === 'file' && (uploadedFileMimeType?.includes('video') || preset === 'screencast')
                    ? 'ИИ-Зрение анализирует видеоряд и речь (1-2 мин)...'
                    : inputMode === 'url'
                      ? 'ИИ извлекает и анализирует стенограмму вебинара (15-30 сек)...'
                      : 'ИИ обрабатывает запись (извлечение & анализ)...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>Запустить ИИ-расшифровку и Анализ</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
