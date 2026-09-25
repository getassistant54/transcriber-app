import React, { useState } from 'react';
import { TranscriptionRecord } from '../types';
import {
  Search,
  Clock,
  Trash2,
  FileSpreadsheet,
  ExternalLink,
  Youtube,
  HardDrive,
  Cloud,
  FileAudio,
  Play,
  Video,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface HistoryListProps {
  transcriptions: TranscriptionRecord[];
  onSelectRecord: (record: TranscriptionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onOpenGoogleDocsModal: (record: TranscriptionRecord) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  transcriptions,
  onSelectRecord,
  onDeleteRecord,
  onOpenGoogleDocsModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-400" />;
      case 'kinescope':
        return <Play className="w-4 h-4 text-violet-400" />;
      case 'zoom':
        return <Video className="w-4 h-4 text-sky-400" />;
      case 'rutube':
        return <Play className="w-4 h-4 text-blue-400" />;
      case 'yandex_disk':
        return <HardDrive className="w-4 h-4 text-amber-400" />;
      case 'google_drive':
        return <Cloud className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileAudio className="w-4 h-4 text-purple-400" />;
    }
  };

  const filteredRecords = transcriptions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sourceUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.analysis.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlatform = platformFilter === 'all' || t.platform === platformFilter;

    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию, ссылке или содержанию саммари..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Platform Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setPlatformFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              platformFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Все записи ({transcriptions.length})
          </button>
          <button
            onClick={() => setPlatformFilter('file_upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              platformFilter === 'file_upload'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" /> Файлы ({transcriptions.filter((t) => t.platform === 'file_upload').length})
          </button>
          <button
            onClick={() => setPlatformFilter('kinescope')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              platformFilter === 'kinescope'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Kinescope ({transcriptions.filter((t) => t.platform === 'kinescope').length})
          </button>
          <button
            onClick={() => setPlatformFilter('zoom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              platformFilter === 'zoom'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" /> Zoom ({transcriptions.filter((t) => t.platform === 'zoom').length})
          </button>
          <button
            onClick={() => setPlatformFilter('youtube')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              platformFilter === 'youtube'
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" /> YouTube ({transcriptions.filter((t) => t.platform === 'youtube').length})
          </button>
          <button
            onClick={() => setPlatformFilter('yandex_disk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              platformFilter === 'yandex_disk'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Яндекс Диск
          </button>
          <button
            onClick={() => setPlatformFilter('google_drive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              platformFilter === 'google_drive'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> Google Drive
          </button>
        </div>

      </div>

      {/* Grid of Transcriptions */}
      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group hover:shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {getPlatformIcon(item.platform)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {item.platform.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>

                <h3
                  onClick={() => onSelectRecord(item)}
                  className="text-base font-bold text-white group-hover:text-blue-400 cursor-pointer transition line-clamp-2"
                >
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                  {item.analysis.summary}
                </p>

                {/* Key Metrics Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-slate-400">
                  <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" /> ~{Math.round(item.durationSeconds / 60)} мин
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800">
                    {item.analysis.actionItems.length} задач
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-purple-300 font-mono">
                    {item.tokenCost.estimatedCostRub} ₽
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onSelectRecord(item)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                >
                  <span>Открыть протокол</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenGoogleDocsModal(item)}
                    title="Сохранить в Google Docs"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-400 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteRecord(item.id)}
                    title="Удалить запись"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-lg font-bold text-white">Записи не найдены</h3>
          <p className="text-xs max-w-md mx-auto text-slate-500">
            Вы еще не расшифровали ни одного видео, либо записи были отфильтрованы. Попробуйте сбросить поиск.
          </p>
        </div>
      )}

    </div>
  );
};
