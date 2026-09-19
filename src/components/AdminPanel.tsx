import React, { useState } from 'react';
import { AdminSettings, SystemStats, UserProfile, UserRole } from '../types';
import {
  ShieldCheck,
  Coins,
  TrendingUp,
  Users,
  Sliders,
  DollarSign,
  Building2,
  Lock,
  Save,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Key,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AdminPanelProps {
  settings: AdminSettings;
  stats: SystemStats;
  usersList: UserProfile[];
  onSaveSettings: (newSettings: Partial<AdminSettings>) => void;
  onUpdateUserRole: (userId: string, role: UserRole, planId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  settings,
  stats,
  usersList,
  onSaveSettings,
  onUpdateUserRole,
}) => {
  const [guestMaxDuration, setGuestMaxDuration] = useState(settings.guestMaxDurationMinutes);
  const [guestDailyLimit, setGuestDailyLimit] = useState(settings.guestDailyLimitCount);
  const [markupPercent, setMarkupPercent] = useState(settings.tokenMarkupPercent);
  const [usdRate, setUsdRate] = useState(settings.usdToRubRate);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'hydra'>(settings.aiProvider || 'gemini');
  const [activeModel, setActiveModel] = useState<string>(settings.activeModel);
  const [hydraBaseUrl, setHydraBaseUrl] = useState<string>(settings.hydraBaseUrl || 'https://api.hydra-ai.ru/v1');
  const [hydraModel, setHydraModel] = useState<string>(settings.hydraModel || 'gemini-2.5-flash');
  const [systemPrompt, setSystemPrompt] = useState(settings.customSystemPrompt);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAll = () => {
    onSaveSettings({
      guestMaxDurationMinutes: Number(guestMaxDuration),
      guestDailyLimitCount: Number(guestDailyLimit),
      tokenMarkupPercent: Number(markupPercent),
      usdToRubRate: Number(usdRate),
      aiProvider,
      activeModel,
      hydraBaseUrl,
      hydraModel,
      customSystemPrompt: systemPrompt,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8">
      
      {/* Admin Title Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> Панель Владельца Сервиса
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Администрирование &amp; Контроль Расходов Токенов
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Управление лимитами разовго гостевого режима, маржой на токены Gemini, подписками пользователей и корпоративными ролями.
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition active:scale-95"
          >
            {savedSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <Save className="w-5 h-5" />}
            <span>{savedSuccess ? 'Сохранено!' : 'Сохранить настройки'}</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Всего обработано</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            {stats.totalDurationHours} ч
          </p>
          <p className="text-xs text-slate-500 mt-1">{stats.totalTranscriptions} видеозаписей</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Расход токенов ИИ</span>
            <Coins className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-purple-300 mt-2 font-mono">
            {(stats.totalTokensUsed / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-slate-500 mt-1">Затраты API: ${stats.totalCostUsd.toFixed(3)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Выручка Сервиса</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">
            {stats.totalRevenueRub.toLocaleString()} ₽
          </p>
          <p className="text-xs text-slate-500 mt-1">Маржа токенов: {markupPercent}%</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Пользователи &amp; Гости</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300 mt-2 font-mono">
            {stats.activeUsersCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">{stats.guestSessionsCount} гостевых сессий сегодня</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Guest Limits & Pricing Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-blue-400" />
            <span>Настройка Разового Гостевого Режима &amp; Цен</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Макс. длина видео для гостей (минут): <span className="text-blue-400 font-mono font-bold">{guestMaxDuration} мин</span>
              </label>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={guestMaxDuration}
                onChange={(e) => setGuestMaxDuration(Number(e.target.value))}
                className="w-full accent-blue-500 bg-slate-950 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">Ограничивает разовые видео без авторизации.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Дневной лимит расшифровок для гостей: <span className="text-blue-400 font-mono font-bold">{guestDailyLimit} шт/день</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={guestDailyLimit}
                onChange={(e) => setGuestDailyLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Наценка на токены (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Курс USD к RUB (₽)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={usdRate}
                    onChange={(e) => setUsdRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">₽</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Model Selection & Prompt Tuning */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span>Провайдер ИИ &amp; Системный Промпт</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Провайдер нейросетей (API шлюз):
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setAiProvider('gemini')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'gemini'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> Google GenAI
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Официальный SDK Gemini</p>
                </button>

                <button
                  type="button"
                  onClick={() => setAiProvider('hydra')}
                  className={`p-3 rounded-xl border text-left transition ${
                    aiProvider === 'hydra'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Hydra AI (Амвера)
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Шлюз без блокировок РФ</p>
                </button>
              </div>

              {aiProvider === 'gemini' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Активная модель Google GenAI SDK:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveModel('gemini-2.5-flash')}
                      className={`p-3 rounded-xl border text-left transition ${
                        activeModel === 'gemini-2.5-flash'
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <p className="font-bold text-xs">gemini-2.5-flash</p>
                      <p className="text-[10px] text-slate-400 mt-1">Скорость • Минимальная цена токенов</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveModel('gemini-2.5-pro')}
                      className={`p-3 rounded-xl border text-left transition ${
                        activeModel === 'gemini-2.5-pro'
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <p className="font-bold text-xs">gemini-2.5-pro</p>
                      <p className="text-[10px] text-slate-400 mt-1">Максимальная точность &amp; Сложная логика</p>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Hydra Base URL:
                    </label>
                    <input
                      type="text"
                      value={hydraBaseUrl}
                      onChange={(e) => setHydraBaseUrl(e.target.value)}
                      placeholder="https://api.hydra-ai.ru/v1"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Модель в Hydra AI:
                    </label>
                    <input
                      type="text"
                      value={hydraModel}
                      onChange={(e) => setHydraModel(e.target.value)}
                      placeholder="gemini-2.5-flash или gpt-4o-mini"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ключ <code className="text-emerald-400">HYDRA_API_KEY</code> задается в переменных окружения на Amvera.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Глобальная инструкция для ИИ (System Prompt):
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>
        </div>

      </div>

      {/* User & Corporate Role Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>Управление Пользователями и Корпоративными Ролями</span>
          </span>
          <span className="text-xs text-slate-400">Всего аккаунтов: {usersList.length}</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3 rounded-l-lg">Пользователь</th>
                <th className="p-3">Роль</th>
                <th className="p-3">Тарифный План</th>
                <th className="p-3">Минут обработано</th>
                <th className="p-3 text-right rounded-r-lg">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-medium text-white">
                    <div>{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : u.role === 'corporate_user'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {u.role === 'admin' ? 'Администратор' : u.role === 'corporate_user' ? 'Корпоративный' : 'Pro Пользователь'}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{u.planId}</td>
                  <td className="p-3 font-mono">{u.usedMinutesThisMonth} мин</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() =>
                        onUpdateUserRole(
                          u.id,
                          u.role === 'standard_user' ? 'corporate_user' : 'standard_user',
                          u.role === 'standard_user' ? 'corporate_team' : 'pro_individual'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                    >
                      Изменить тариф/роль
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
