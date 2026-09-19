import React, { useState } from 'react';
import { UserPlan } from '../types';
import {
  CreditCard,
  Check,
  Zap,
  Building2,
  Users,
  Coins,
  Calculator,
  X,
  Sparkles,
} from 'lucide-react';

interface PricingModalProps {
  plans: UserPlan[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (planId: string) => void;
  usdToRubRate: number;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  plans,
  isOpen,
  onClose,
  onSelectPlan,
  usdToRubRate,
}) => {
  const [calcHours, setCalcHours] = useState(10); // 10 hours calculation

  if (!isOpen) return null;

  // Calculation estimates: 1 hour video ~ 25,000 tokens
  const totalTokensEstimated = calcHours * 25000;
  const rawApiCostUsd = (totalTokensEstimated / 1_000_000) * 0.12; // average input/output cost
  const rawApiCostRub = Math.round(rawApiCostUsd * usdToRubRate);
  const ProPlanPriceRub = 990;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
            Прозрачные Тарифы &amp; Монетизация
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Тарифные Планы и Расчет Затрат Токенов
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mt-1">
            Выберите подходящий уровень доступа для себя или вашей команды.
          </p>
        </div>

        {/* Tariff Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const isPopular = plan.id === 'pro_individual';
            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between relative transition-all ${
                  isPopular
                    ? 'bg-gradient-to-b from-blue-900/30 to-slate-900 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                    Хит продаж
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-white">{plan.priceRub} ₽</span>
                    <span className="text-xs text-slate-400"> / месяц</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    onSelectPlan(plan.id);
                    onClose();
                  }}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-md ${
                    isPopular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {plan.priceRub === 0 ? 'Использовать бесплатно' : 'Подключить тариф'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Token Cost Calculator for Transparency */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Интерактивный Калькулятор Расхода Токенов ИИ
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Часов видео в месяц: <strong className="text-white font-mono">{calcHours} ч</strong>
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={calcHours}
                onChange={(e) => setCalcHours(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Примерный объем токенов:</p>
              <p className="text-sm font-bold text-purple-300 font-mono">
                {totalTokensEstimated.toLocaleString()} токенов
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Себестоимость API Gemini:</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">
                ~{rawApiCostRub} ₽ (${rawApiCostUsd.toFixed(2)})
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
