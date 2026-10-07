import React from 'react';
import { UserProfile, UserRole } from '../types';
import {
  Video,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Sparkles,
  History,
  CreditCard,
  Settings,
  Building2,
  Lock,
  Bug,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  isGuest: boolean;
  activeTab: 'transcribe' | 'history' | 'admin' | 'pricing';
  setActiveTab: (tab: 'transcribe' | 'history' | 'admin' | 'pricing') => void;
  onSwitchUserRole: (role: UserRole) => void;
  onOpenAuthModal?: () => void;
  onOpenFeedbackModal?: () => void;
  onLogout?: () => void;
  guestLimits?: {
    usedMinutesToday: number;
    maxMinutesToday: number;
    dailyCount: number;
    maxDailyCount: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isGuest,
  activeTab,
  setActiveTab,
  onSwitchUserRole,
  onOpenAuthModal,
  onOpenFeedbackModal,
  onLogout,
  guestLimits,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('transcribe')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Видео Расшифровщик</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Транскрибация &amp; ИИ-Аналитика (Скринкасты, Вебинары, Kinescope, YouTube)
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('transcribe')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transcribe'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Расшифровать</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>История</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pricing'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Тарифы</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-purple-400 hover:bg-purple-900/30 hover:text-purple-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Админка</span>
              </button>
            )}
          </nav>

          {/* User Mode & Switcher Controls */}
          <div className="flex items-center gap-3">
            {onOpenFeedbackModal && (
              <button
                onClick={onOpenFeedbackModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
                title="Написать автору / Отправить баг-репорт"
              >
                <Bug className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Баг-репорт</span>
              </button>
            )}

            {/* Guest: Show Login / Register Button & Daily Limit */}
            {isGuest ? (
              <>
                {guestLimits && (
                  <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Пробный режим: {guestLimits.dailyCount}/{guestLimits.maxDailyCount} видео</span>
                  </div>
                )}
                {onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Войти / Регистрация</span>
                  </button>
                )}
              </>
            ) : (
              /* Logged In User Profile Dropdown */
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 transition">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                    {currentUser.name ? currentUser.name[0] : 'U'}
                  </div>
                  <span className="max-w-[120px] truncate text-slate-200">{currentUser.name || currentUser.email}</span>
                  {currentUser.role === 'admin' ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">Админ</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Pro</span>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                <div className="absolute right-0 mt-1 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{currentUser.name || 'Пользователь'}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                    <p className="text-[11px] text-emerald-400 mt-1 font-medium">Баланс: {currentUser.balanceRub} ₽ (Pro доступ)</p>
                  </div>

                  {currentUser.role === 'admin' && (
                    <div className="px-3.5 py-2 border-b border-slate-800 space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Тестовые роли:</p>
                      <button
                        onClick={() => onSwitchUserRole('corporate_user')}
                        className="w-full text-left text-xs text-slate-300 hover:text-white py-0.5"
                      >
                        Режим: Корпоративный сотрудник
                      </button>
                      <button
                        onClick={() => onSwitchUserRole('standard_user')}
                        className="w-full text-left text-xs text-slate-300 hover:text-white py-0.5"
                      >
                        Режим: Pro Пользователь
                      </button>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => (onLogout ? onLogout() : onSwitchUserRole('guest'))}
                      className="w-full text-left px-3.5 py-2 text-xs text-red-400 hover:bg-red-950/30 transition flex items-center justify-between"
                    >
                      <span>Выйти из аккаунта</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
