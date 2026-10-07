import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TranscribeForm } from './components/TranscribeForm';
import { TranscriptionView } from './components/TranscriptionView';
import { HistoryList } from './components/HistoryList';
import { AdminPanel } from './components/AdminPanel';
import { PricingModal } from './components/PricingModal';
import { GoogleDocExportModal } from './components/GoogleDocExportModal';
import { AuthModal } from './components/AuthModal';
import { FeedbackModal } from './components/FeedbackModal';
import {
  UserProfile,
  AdminSettings,
  SystemStats,
  TranscriptionRecord,
  UserRole,
  AnalysisPreset,
} from './types';
import { AlertCircle, CheckCircle2, Sparkles, Video, History, Clock } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedRole = (typeof window !== 'undefined' ? (localStorage.getItem('transcriber_role') as UserRole) : null) || 'guest';
    const savedId = (typeof window !== 'undefined' ? localStorage.getItem('transcriber_user_id') : null) || (savedRole === 'admin' ? 'admin-1' : 'guest');
    const isAdmin = savedRole === 'admin';
    return {
      id: savedId,
      email: isAdmin ? 'admin@transcriber.ai' : 'гость@сессия',
      name: isAdmin ? 'Главный Администратор' : 'Гость (Разовая сессия)',
      role: savedRole,
      planId: isAdmin ? 'corporate_team' : 'free_guest',
      usedMinutesThisMonth: 0,
      totalTranscriptionsCount: 0,
      balanceRub: isAdmin ? 15000 : 0,
      createdAt: new Date().toISOString(),
    };
  });

  const [isGuest, setIsGuest] = useState(() => {
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('transcriber_role') : null;
    return !savedRole || savedRole === 'guest';
  });

  const [guestLimits, setGuestLimits] = useState({
    usedMinutesToday: 0,
    maxMinutesToday: 60,
    dailyCount: 0,
    maxDailyCount: 10,
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    guestMaxDurationMinutes: 60,
    guestDailyLimitCount: 10,
    tokenMarkupPercent: 40,
    usdToRubRate: 92.5,
    aiProvider: 'gemini',
    activeModel: 'gemini-3.6-flash',
    hydraBaseUrl: 'https://api.hydra-ai.ru/v1',
    hydraModel: 'gemini-2.5-flash',
    customSystemPrompt: 'Ты — экспертный ИИ-транскрибатор и бизнес-аналитик.',
    corporateDomainWhitelist: ['company.ru'],
    plans: [],
  });

  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalTranscriptions: 12,
    totalDurationHours: 14.5,
    totalTokensUsed: 350000,
    totalCostUsd: 0.038,
    totalRevenueRub: 8500,
    activeUsersCount: 5,
    guestSessionsCount: 12,
  });

  const [transcriptions, setTranscriptions] = useState<TranscriptionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TranscriptionRecord | null>(null);
  const [allUsersList, setAllUsersList] = useState<UserProfile[]>([]);

  const [activeTab, setActiveTab] = useState<'transcribe' | 'history' | 'admin' | 'pricing'>('transcribe');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [isGoogleDocModalOpen, setIsGoogleDocModalOpen] = useState(false);
  const [exportRecord, setExportRecord] = useState<TranscriptionRecord | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [processingTitle, setProcessingTitle] = useState<string | null>(null);

  // Load User & Data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async (roleToSet?: UserRole, userIdToSet?: string) => {
    try {
      const activeRole = roleToSet || currentUser.role || 'admin';
      const activeId = userIdToSet || currentUser.id || 'admin-1';
      const headers: Record<string, string> = {
        'x-user-id': activeId,
        'x-user-role': activeRole,
      };

      // 1. Fetch User / Guest info
      const userRes = await fetch('/api/user/me', { headers });
      const userData = await userRes.json();
      if (userData.user) {
        setCurrentUser(userData.user);
        setIsGuest(userData.isGuest || userData.user.role === 'guest');
        if (typeof window !== 'undefined') {
          localStorage.setItem('transcriber_role', userData.user.role);
          localStorage.setItem('transcriber_user_id', userData.user.id);
        }
        if (userData.guestLimits) {
          setGuestLimits(userData.guestLimits);
        }
      }

      // 2. Fetch Settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      if (settingsData.settings) {
        setAdminSettings(settingsData.settings);
      }

      // 3. Fetch Transcriptions
      const txRes = await fetch('/api/transcriptions', { headers });
      const txData = await txRes.json();
      if (txData.transcriptions) {
        setTranscriptions(txData.transcriptions);
      }

      // 4. If Admin, fetch stats
      if (activeRole === 'admin') {
        const adminRes = await fetch('/api/admin/stats');
        const adminData = await adminRes.json();
        if (adminData.stats) setSystemStats(adminData.stats);
        if (adminData.users) setAllUsersList(adminData.users);
      }
    } catch (err) {
      console.error('Failed to load server initial data:', err);
    }
  };

  const handleSwitchUserRole = async (role: UserRole) => {
    setErrorMsg(null);
    setSelectedRecord(null);
    setProcessingTitle(null);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setIsGuest(role === 'guest');
        if (typeof window !== 'undefined') {
          if (role === 'guest') {
            localStorage.setItem('transcriber_role', 'guest');
            localStorage.setItem('transcriber_user_id', 'guest');
          } else {
            localStorage.setItem('transcriber_role', data.user.role);
            localStorage.setItem('transcriber_user_id', data.user.id);
          }
        }
        await fetchInitialData(role, data.user.id);
        setSuccessToast(`Переключен режим: ${role === 'admin' ? 'Администратор (Полный безлимит)' : role === 'corporate_user' ? 'Корпоративный сотрудник' : role === 'guest' ? 'Гость' : 'Pro Пользователь (Безлимит)'}`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err) {
      console.error('Switch role failed:', err);
    }
  };

  const handleLogout = async () => {
    setSelectedRecord(null);
    setProcessingTitle(null);
    setErrorMsg(null);
    setTranscriptions([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('transcriber_role', 'guest');
      localStorage.setItem('transcriber_user_id', 'guest');
    }
    await handleSwitchUserRole('guest');
  };

  const handleTranscribe = async (payload: {
    url?: string;
    passcode?: string;
    rawText?: string;
    preset: AnalysisPreset;
    language: string;
    customTitle?: string;
    fileName?: string;
    fileBase64?: string;
    fileMimeType?: string;
    businessNiche?: string;
    customAiPrompt?: string;
    _hp_security_check?: string;
  }) => {
    const targetTitle = payload.customTitle || payload.fileName || (payload.url ? 'Видео по ссылке' : 'Аудиозапись');
    setProcessingTitle(targetTitle);
    setSelectedRecord(null);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Ошибка сервера (${res.status}). Рекомендуется загрузить файл меньшего размера или аудиозапись.`);
      }

      if (data.record) {
        setTranscriptions((prev) => [data.record, ...prev]);
        setSelectedRecord(data.record);
        setSuccessToast('Расшифровка и ИИ-анализ успешно завершены!');
        setTimeout(() => setSuccessToast(null), 3000);

        // Refresh user usage
        fetchInitialData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Произошла ошибка обработки видео.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await fetch(`/api/transcriptions/${id}`, { method: 'DELETE' });
      setTranscriptions((prev) => prev.filter((t) => t.id !== id));
      if (selectedRecord?.id === id) {
        const remaining = transcriptions.filter((t) => t.id !== id);
        setSelectedRecord(remaining[0] || null);
      }
      setSuccessToast('Запись удалена из истории');
      setTimeout(() => setSuccessToast(null), 2500);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSaveAdminSettings = async (newSettings: Partial<AdminSettings>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.settings) {
        setAdminSettings(data.settings);
        setSuccessToast('Настройки сервера и лимиты гостей обновлены');
        setTimeout(() => setSuccessToast(null), 2500);
      }
    } catch (err) {
      console.error('Admin save settings error:', err);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole, planId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, planId }),
      });
      const data = await res.json();
      if (data.success) {
        setAllUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role, planId } : u))
        );
        setSuccessToast('Роль и тариф пользователя обновлены');
        setTimeout(() => setSuccessToast(null), 2500);
      }
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  const handleOpenGoogleDocsModal = (record: TranscriptionRecord) => {
    setExportRecord(record);
    setIsGoogleDocModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white flex flex-col justify-between">
      
      <div>
        {/* Header Navigation */}
        <Header
          currentUser={currentUser}
          isGuest={isGuest}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSwitchUserRole={handleSwitchUserRole}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
          onLogout={handleLogout}
          guestLimits={guestLimits}
        />

        {/* Global Toast Alerts */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold transition"
                >
                  Сообщить о баге 🐛
                </button>
                <button onClick={() => setErrorMsg(null)} className="text-xs text-red-400 hover:underline">
                  Закрыть
                </button>
              </div>
            </div>
          )}

          {successToast && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-2 shadow-lg animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}
        </div>

        {/* Main Workspace Body */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          
          {/* TAB 1: TRANSCRIBE & VIEW RESULT */}
          {activeTab === 'transcribe' && (
            <div className="space-y-8">
              <TranscribeForm
                onTranscribe={handleTranscribe}
                isLoading={isLoading}
                isGuest={isGuest}
                guestLimits={guestLimits}
              />

              {/* Processing Progress Card (While generating) */}
              {isLoading && (
                <div className="p-8 rounded-2xl bg-slate-900/90 border border-blue-500/30 text-center space-y-4 shadow-2xl shadow-blue-500/10 backdrop-blur-md animate-fade-in">
                  <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
                    <Sparkles className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">
                      Идет расшифровка и ИИ-анализ: «{processingTitle || 'Медиафайл'}»
                    </h3>
                    <p className="text-sm text-slate-400 max-w-xl mx-auto">
                      Нейросеть слушает аудиодорожку, разделяет реплики по спикерам, расставляет таймкоды и формирует итоговый протокол...
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-blue-400">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Обычно обработка занимает от 30 до 90 секунд в зависимости от длины файла</span>
                  </div>
                </div>
              )}

              {/* Result View (Only when fresh record is ready or chosen) */}
              {!isLoading && selectedRecord && (
                <div className="pt-2 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Свежая расшифровка готова
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                        {selectedRecord.title}
                      </h2>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRecord(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition shrink-0"
                    >
                      <span>➕ Скрыть и начать новую расшифровку</span>
                    </button>
                  </div>

                  <TranscriptionView
                    record={selectedRecord}
                    onOpenGoogleDocsModal={handleOpenGoogleDocsModal}
                    onDeleteRecord={handleDeleteRecord}
                    currentUser={currentUser}
                  />
                </div>
              )}

              {/* Discreet hint for recent transcription when form is clean */}
              {!isLoading && !selectedRecord && transcriptions.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <History className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      Предыдущая расшифровка: <strong className="text-slate-200">{transcriptions[0].title}</strong> ({new Date(transcriptions[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRecord(transcriptions[0]);
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold underline text-left sm:text-right"
                  >
                    Посмотреть результат ➔
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORY LIST */}
          {activeTab === 'history' && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">История ИИ-Расшифровок</h1>
                <p className="text-xs text-slate-400 mt-1">Все сохраненные видео, протоколы встреч и экспорт в Google Docs</p>
              </div>

              <HistoryList
                transcriptions={transcriptions}
                onSelectRecord={(rec) => {
                  setSelectedRecord(rec);
                  setActiveTab('transcribe');
                }}
                onDeleteRecord={handleDeleteRecord}
                onOpenGoogleDocsModal={handleOpenGoogleDocsModal}
              />
            </div>
          )}

          {/* TAB 3: ADMIN PANEL */}
          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <AdminPanel
              settings={adminSettings}
              stats={systemStats}
              usersList={allUsersList}
              onSaveSettings={handleSaveAdminSettings}
              onUpdateUserRole={handleUpdateUserRole}
            />
          )}

          {/* TAB 4: PRICING & TOKEN COSTS */}
          {activeTab === 'pricing' && (
            <PricingModal
              plans={adminSettings.plans}
              isOpen={true}
              onClose={() => setActiveTab('transcribe')}
              onSelectPlan={(planId) => {
                setSuccessToast(`Выбран тариф: ${planId}`);
                setTimeout(() => setSuccessToast(null), 2500);
              }}
              usdToRubRate={adminSettings.usdToRubRate}
            />
          )}

        </main>
      </div>

      {/* Google Docs Export Modal */}
      <GoogleDocExportModal
        record={exportRecord}
        isOpen={isGoogleDocModalOpen}
        onClose={() => setIsGoogleDocModalOpen(false)}
      />

      {/* Auth / Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsGuest(user.role === 'guest');
          if (typeof window !== 'undefined') {
            localStorage.setItem('transcriber_role', user.role);
            localStorage.setItem('transcriber_user_id', user.id);
          }
          fetchInitialData(user.role, user.id);
          setSuccessToast(`Добро пожаловать, ${user.name || user.email}!`);
          setTimeout(() => setSuccessToast(null), 3000);
        }}
      />

      {/* Feedback & Bug Report Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        lastError={errorMsg}
      />

      {/* Footer with Focus Group Contacts */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1.5">
            <Video className="w-4 h-4 text-blue-400" />
            <span>Видео Расшифровщик • Мультимодальный анализ Gemini AI</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
            <span className="text-slate-300 font-medium">Фокус-группа &amp; Баг-репорты:</span>
            <a
              href="https://t.me/getassistant54"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline font-medium"
            >
              Telegram @getassistant54
            </a>
            <span>•</span>
            <a
              href="mailto:getassist@yandex.ru"
              className="text-amber-400 hover:text-amber-300 underline font-medium"
            >
              getassist@yandex.ru
            </a>
            <span>•</span>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-semibold transition"
            >
              🐛 Отправить отзыв
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
