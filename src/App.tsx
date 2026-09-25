import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TranscribeForm } from './components/TranscribeForm';
import { TranscriptionView } from './components/TranscriptionView';
import { HistoryList } from './components/HistoryList';
import { AdminPanel } from './components/AdminPanel';
import { PricingModal } from './components/PricingModal';
import { GoogleDocExportModal } from './components/GoogleDocExportModal';
import {
  UserProfile,
  AdminSettings,
  SystemStats,
  TranscriptionRecord,
  UserRole,
  AnalysisPreset,
} from './types';
import { AlertCircle, CheckCircle2, Sparkles, Video } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'guest',
    email: 'гость@сессия',
    name: 'Гость (Разовая сессия)',
    role: 'guest',
    planId: 'free_guest',
    usedMinutesThisMonth: 15,
    totalTranscriptionsCount: 1,
    balanceRub: 0,
    createdAt: new Date().toISOString(),
  });

  const [isGuest, setIsGuest] = useState(true);
  const [guestLimits, setGuestLimits] = useState({
    usedMinutesToday: 15,
    maxMinutesToday: 60,
    dailyCount: 1,
    maxDailyCount: 3,
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    guestMaxDurationMinutes: 60,
    guestDailyLimitCount: 3,
    tokenMarkupPercent: 40,
    usdToRubRate: 92.5,
    aiProvider: 'gemini',
    activeModel: 'gemini-2.5-flash',
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

  // Load User & Data on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async (roleToSet?: UserRole) => {
    try {
      const headers: Record<string, string> = {
        'x-user-id': currentUser.id,
        'x-user-role': roleToSet || currentUser.role,
      };

      // 1. Fetch User / Guest info
      const userRes = await fetch('/api/user/me', { headers });
      const userData = await userRes.json();
      if (userData.user) {
        setCurrentUser(userData.user);
        setIsGuest(userData.isGuest || userData.user.role === 'guest');
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
        if (txData.transcriptions.length > 0 && !selectedRecord) {
          setSelectedRecord(txData.transcriptions[0]);
        }
      }

      // 4. If Admin, fetch stats
      if (roleToSet === 'admin' || currentUser.role === 'admin') {
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
        fetchInitialData(role);
        setSuccessToast(`Переключен режим: ${role === 'admin' ? 'Администратор' : role === 'corporate_user' ? 'Корпоративный сотрудник' : role === 'guest' ? 'Гость' : 'Pro Пользователь'}`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err) {
      console.error('Switch role failed:', err);
    }
  };

  const handleTranscribe = async (payload: {
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
  }) => {
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
          guestLimits={guestLimits}
        />

        {/* Global Toast Alerts */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-sm flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-xs text-red-400 hover:underline">
                Закрыть
              </button>
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

              {selectedRecord && (
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      <span>Результат ИИ-Расшифровки и Протокол</span>
                    </h2>
                    <span className="text-xs text-slate-400">
                      ID: <span className="font-mono text-slate-300">{selectedRecord.id}</span>
                    </span>
                  </div>

                  <TranscriptionView
                    record={selectedRecord}
                    onOpenGoogleDocsModal={handleOpenGoogleDocsModal}
                    onDeleteRecord={handleDeleteRecord}
                    currentUser={currentUser}
                  />
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

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5">
            <Video className="w-4 h-4 text-blue-400" />
            <span>Видео Расшифровщик &amp; AI Аналитик • Powered by Gemini 2.5 Flash</span>
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Поддержка: YouTube, Rutube, Яндекс Диск, Google Drive</span>
            <span>•</span>
            <span className="text-blue-400">Экспорт в Google Docs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
