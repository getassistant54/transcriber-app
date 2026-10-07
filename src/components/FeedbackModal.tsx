import React, { useState } from 'react';
import { X, MessageSquare, Send, Mail, Copy, Check, ExternalLink, Bug, Sparkles } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastError?: string | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, lastError }) => {
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const bugReportTemplate = `[Баг-репорт / Отзыв фокус-группы]
• Что я делал(а): 
• Файл / Ссылка: 
• Какая возникла проблема: ${lastError ? `\n(Ошибка: ${lastError})` : ''}
• Браузер / Устройство: ${typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : ''}`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(bugReportTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('getassist@yandex.ru');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const emailSubject = encodeURIComponent('Баг-репорт / Обратная связь (Фокус-группа)');
  const emailBody = encodeURIComponent(bugReportTemplate);
  const mailtoUrl = `mailto:getassist@yandex.ru?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/20 mb-1">
            <Bug className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Баг-репорт &amp; Обратная связь</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Спасибо, что участвуете в первой фокус-группе! Нашли баг, зависание или есть идея по улучшению? Напишите напрямую автору проекта:
          </p>
        </div>

        {/* Contact Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Telegram Card */}
          <a
            href="https://t.me/getassistant54"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-500/40 hover:border-sky-400 hover:bg-sky-900/30 text-white transition group shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 group-hover:scale-110 transition shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-sky-300 flex items-center gap-1">
                <span>Telegram</span>
                <ExternalLink className="w-3 h-3" />
              </p>
              <p className="text-sm font-bold text-white truncate">@getassistant54</p>
              <p className="text-[11px] text-slate-400">Быстрый ответ</p>
            </div>
          </a>

          {/* Email Card */}
          <a
            href={mailtoUrl}
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-900/30 text-white transition group shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-110 transition shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                <span>Электронная почта</span>
                <ExternalLink className="w-3 h-3" />
              </p>
              <p className="text-sm font-bold text-white truncate">getassist@yandex.ru</p>
              <p className="text-[11px] text-slate-400">Открыть почту</p>
            </div>
          </a>

        </div>

        {/* Template Quick Copy Section */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Шаблон сообщения для отправки:
            </span>
            <button
              onClick={handleCopyTemplate}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700 flex items-center gap-1 transition"
            >
              {copiedTemplate ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedTemplate ? 'Скопировано!' : 'Скопировать'}</span>
            </button>
          </div>

          <pre className="text-[11px] font-mono text-slate-400 bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {bugReportTemplate}
          </pre>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            Или скопируйте почту: <button onClick={handleCopyEmail} className="text-slate-300 underline hover:text-white font-mono">{copiedEmail ? 'getassist@yandex.ru (Скопировано!)' : 'getassist@yandex.ru'}</button>
          </p>
        </div>

      </div>
    </div>
  );
};
