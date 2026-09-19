import React, { useState } from 'react';
import { AnalysisPreset, VideoPlatform } from '../types';
import {
  Youtube,
  HardDrive,
  Cloud,
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
} from 'lucide-react';

interface TranscribeFormProps {
  onTranscribe: (data: {
    url?: string;
    rawText?: string;
    preset: AnalysisPreset;
    language: string;
    customTitle?: string;
    fileName?: string;
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
  const [selectedPlatform, setSelectedPlatform] = useState<VideoPlatform>('youtube');
  const [inputUrl, setInputUrl] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [preset, setPreset] = useState<AnalysisPreset>('meeting');
  const [language, setLanguage] = useState('Русский');
  const [inputMode, setInputMode] = useState<'url' | 'file' | 'text'>('url');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const platformPresets: { id: VideoPlatform; name: string; icon: React.ReactNode; color: string; sampleUrl: string }[] = [
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube className="w-5 h-5" />,
      color: 'hover:border-red-500/50 hover:bg-red-500/10 text-red-400',
      sampleUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      id: 'rutube',
      name: 'Rutube',
      icon: <PlayCircle className="w-5 h-5" />,
      color: 'hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400',
      sampleUrl: 'https://rutube.ru/video/1a2b3c4d5e6f7g8h/',
    },
    {
      id: 'yandex_disk',
      name: 'Яндекс Диск',
      icon: <HardDrive className="w-5 h-5" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-400',
      sampleUrl: 'https://disk.yandex.ru/i/sample_recording_2026',
    },
    {
      id: 'google_drive',
      name: 'Google Drive',
      icon: <Cloud className="w-5 h-5" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400',
      sampleUrl: 'https://drive.google.com/file/d/1A2B3C_google_doc_media/view',
    },
    {
      id: 'direct_url',
      name: 'Прямой файл / Загрузка',
      icon: <FileAudio className="w-5 h-5" />,
      color: 'hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-400',
      sampleUrl: 'https://example.com/recorded_meeting.mp4',
    },
  ];

  const analysisPresetsList = [
    {
      id: 'meeting' as AnalysisPreset,
      name: 'Деловая встреча / Совещание',
      desc: 'Выделяет задачи (Action Items), ответственных, решения и споры.',
      icon: <Briefcase className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'lecture' as AnalysisPreset,
      name: 'Лекция / Вебинар',
      desc: 'Конспектирует термины, логические главы и ключевые тезисы.',
      icon: <GraduationCap className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'podcast' as AnalysisPreset,
      name: 'Подкаст / Интервью',
      desc: 'Собирает яркие цитаты, хронологию спикеров и темы.',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'quick_summary' as AnalysisPreset,
      name: 'Быстрый обзор (Экспресс)',
      desc: 'Ультра-короткое саммари за 10 секунд и 3 главных вывода.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'url' && !inputUrl.trim()) return;
    if (inputMode === 'text' && !rawTextInput.trim()) return;

    onTranscribe({
      url: inputMode === 'url' ? inputUrl.trim() : undefined,
      rawText: inputMode === 'text' ? rawTextInput.trim() : undefined,
      preset,
      language,
      customTitle: customTitle.trim() || undefined,
      fileName: uploadedFileName || undefined,
    });
  };

  const setSampleLink = (platformId: VideoPlatform, url: string) => {
    setSelectedPlatform(platformId);
    setInputUrl(url);
    setInputMode('url');
  };

  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setInputMode('file');
      if (!customTitle) setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
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
          Вставьте открытую ссылку на видео или запись встречи с <strong className="text-slate-200">YouTube, Rutube, Яндекс Диска</strong> или <strong className="text-slate-200">Google Drive</strong>. Получите стенограмму, списки задач, таймкоды и экспорт в <strong className="text-blue-400">Google Документы</strong>.
        </p>
      </div>

      {/* Platform Pills */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Выберите источник медиафайла:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {platformPresets.map((p) => {
            const isSelected = selectedPlatform === p.id && inputMode === 'url';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSampleLink(p.id, p.sampleUrl)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : `bg-slate-800/80 border-slate-700/80 text-slate-300 ${p.color}`
                }`}
              >
                {p.icon}
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Input Mode Selector & Field */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode('url')}
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
                📁 Загрузить файл (MP3/MP4)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
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
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Вставьте ссылку на YouTube, Rutube, Яндекс Диск или Google Drive..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 pr-28 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setInputUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                className="absolute right-2 top-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700 transition"
              >
                Демо-ссылка
              </button>
            </div>
          )}

          {inputMode === 'file' && (
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-950/60 rounded-xl p-6 text-center transition cursor-pointer relative">
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileUploadMock}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileAudio className="w-10 h-10 mx-auto text-blue-400 mb-2" />
              <p className="text-sm font-medium text-slate-200">
                {uploadedFileName ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Файл выбран: {uploadedFileName}
                  </span>
                ) : (
                  'Перетащите аудио/видео файл сюда или нажмите для выбора'
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">Поддерживает MP3, MP4, WAV, M4A, MOV до 500 МБ</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {analysisPresetsList.map((p) => {
              const isSelected = preset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/80 ring-1 ring-blue-500/30'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {p.icon}
                    <span className="font-semibold text-sm text-white">{p.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
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
                <span>ИИ обрабатывает видео (извлечение &amp; анализ)...</span>
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
