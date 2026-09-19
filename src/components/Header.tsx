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
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  isGuest: boolean;
  activeTab: 'transcribe' | 'history' | 'admin' | 'pricing';
  setActiveTab: (tab: 'transcribe' | 'history' | 'admin' | 'pricing') => void;
  onSwitchUserRole: (role: UserRole) => void;
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
                Транскрибация &amp; ИИ-Аналитика (YouTube, Rutube, Диск)
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
              <span>Тарифы &amp; Токены</span>
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
            {/* Guest Limit Badge */}
            {isGuest && guestLimits && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Гость: {guestLimits.dailyCount}/{guestLimits.maxDailyCount} видео сегодня</span>
              </div>
            )}

            {/* Quick Role Switcher Dropdown for Demo */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-700 transition">
                {currentUser.role === 'admin' ? (
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <Lock className="w-3.5 h-3.5" /> Владелец / Админ
                  </span>
                ) : currentUser.role === 'corporate_user' ? (
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Building2 className="w-3.5 h-3.5" /> Корпоративный
                  </span>
                ) : isGuest ? (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <UserPlus className="w-3.5 h-3.5" /> Гостевой режим
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <UserCheck className="w-3.5 h-3.5" /> Pro Аккаунт
                  </span>
                )}
              </button>

              {/* Role Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-56 rounded-xl bg-slate-850 border border-slate-700 bg-slate-900 shadow-2xl py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Сменить режим тестирования:</p>
                  <p className="text-xs text-slate-200 truncate font-medium mt-0.5">{currentUser.email}</p>
                </div>

                <button
                  onClick={() => onSwitchUserRole('admin')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-purple-900/30 hover:text-purple-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-purple-400" /> Владелец (Админка + Токены)
                  </span>
                  {currentUser.role === 'admin' && <span className="text-purple-400">✓</span>}
                </button>

                <button
                  onClick={() => onSwitchUserRole('corporate_user')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-blue-900/30 hover:text-blue-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" /> Корпоративный сотрудник
                  </span>
                  {currentUser.role === 'corporate_user' && <span className="text-blue-400">✓</span>}
                </button>

                <button
                  onClick={() => onSwitchUserRole('standard_user')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-emerald-900/30 hover:text-emerald-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Pro Подписчик
                  </span>
                  {currentUser.role === 'standard_user' && <span className="text-emerald-400">✓</span>}
                </button>

                <button
                  onClick={() => onSwitchUserRole('guest')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-amber-900/30 hover:text-amber-200 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" /> Разовая гостевая сессия
                  </span>
                  {isGuest && <span className="text-amber-400">✓</span>}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
