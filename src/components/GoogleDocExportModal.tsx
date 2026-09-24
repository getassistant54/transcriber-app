import React, { useState } from 'react';
import { TranscriptionRecord } from '../types';
import {
  FileSpreadsheet,
  X,
  ExternalLink,
  Copy,
  Check,
  Download,
  Sparkles,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface GoogleDocExportModalProps {
  record: TranscriptionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDocExportModal: React.FC<GoogleDocExportModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  if (!isOpen || !record) return null;

  const docTitle = record.title;

  const buildHtmlReport = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 20px auto; padding: 0 15px; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; font-size: 24px; }
    h2 { color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 18px; }
    .meta { background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; border: 1px solid #e2e8f0; }
    .summary-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 4px; margin: 16px 0; }
    .task-item { margin-bottom: 6px; padding: 6px 10px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; }
    .chapter-time { color: #2563eb; font-weight: bold; }
    .segment-time { color: #64748b; font-family: monospace; font-size: 12px; }
    .speaker-name { font-weight: bold; color: #1e40af; }
  </style>
</head>
<body>
  <h1>📄 ${docTitle}</h1>
  <div class="meta">
    <p><strong>Источник:</strong> <a href="${record.sourceUrl}">${record.sourceUrl}</a> (${record.platform.toUpperCase()})</p>
    <p><strong>Дата создания:</strong> ${new Date(record.createdAt).toLocaleDateString('ru-RU')} | <strong>Длительность:</strong> ~${Math.round(record.durationSeconds / 60)} мин | <strong>Язык:</strong> ${record.language}</p>
  </div>

  <h2>📌 Краткое содержание (Саммари)</h2>
  <div class="summary-box">
    <p>${record.analysis.summary.replace(/\n/g, '<br>')}</p>
  </div>

  <h2>💡 Главные выводы</h2>
  <ul>
    ${record.analysis.mainTakeaways.map((t) => `<li>${t}</li>`).join('')}
  </ul>

  <h2>✅ Поручения и Задачи (Action Items)</h2>
  <div>
    ${record.analysis.actionItems
      .map(
        (a) => `
      <div class="task-item">
        <b>[${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}]</b> ${a.task}
        ${a.assignee ? `<i>(Ответственный: ${a.assignee})</i>` : ''}
      </div>`
      )
      .join('')}
  </div>

  <h2>🕒 Главы и таймкоды</h2>
  <ul>
    ${record.analysis.chapters
      .map(
        (c) => `
      <li>
        <span class="chapter-time">[${c.timestamp}]</span> <b>${c.title}</b> — ${c.summary}
      </li>`
      )
      .join('')}
  </ul>

  <h2>💬 Стенограмма диалога</h2>
  <div>
    ${
      record.segments && record.segments.length > 0
        ? record.segments
            .map(
              (s) => `
          <p style="margin-bottom: 8px;">
            <span class="segment-time">[${s.startTime}]</span> <span class="speaker-name">${s.speaker}:</span> ${s.text}
          </p>`
            )
            .join('')
        : `<pre style="white-space: pre-wrap; font-family: sans-serif;">${record.verbatimTranscript}</pre>`
    }
  </div>
</body>
</html>
    `;
  };

  const formattedDocMarkdown = `
# 📄 ${record.title}
**Источник:** ${record.sourceUrl} (${record.platform.toUpperCase()})  
**Дата:** ${new Date(record.createdAt).toLocaleDateString('ru-RU')} | **Длительность:** ~${Math.round(record.durationSeconds / 60)} мин

---

## 📌 Краткое содержание (Саммари)
${record.analysis.summary}

---

## 💡 Главные выводы
${record.analysis.mainTakeaways.map((t) => '* ' + t).join('\n')}

---

## ✅ Поручения и Задачи (Action Items)
${record.analysis.actionItems.map((a) => `* **[${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}]** ${a.task} ${a.assignee ? `*(Ответственный: ${a.assignee})*` : ''}`).join('\n')}

---

## 🕒 Главы и таймкоды
${record.analysis.chapters.map((c) => `* **[${c.timestamp}] ${c.title}:** ${c.summary}`).join('\n')}

---

## 💬 Стенограмма диалога
${
  record.segments && record.segments.length > 0
    ? record.segments.map((s) => `[${s.startTime}] **${s.speaker}:** ${s.text}`).join('\n\n')
    : record.verbatimTranscript
}
  `.trim();

  // Primary Action: Copy Rich HTML to Clipboard & Open Google Docs in 1 click
  const handleCopyAndOpenGoogleDocs = async () => {
    try {
      const htmlText = buildHtmlReport();
      const blobHtml = new Blob([htmlText], { type: 'text/html' });
      const blobText = new Blob([formattedDocMarkdown], { type: 'text/plain' });

      // ClipboardItem copies rich HTML so Google Docs pastes formatted headings, styles and colors
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);
    } catch (e) {
      // Fallback to plain text
      await navigator.clipboard.writeText(formattedDocMarkdown);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 4000);

    // Open Google Docs
    window.open(
      `https://docs.google.com/document/create?title=${encodeURIComponent(docTitle)}`,
      '_blank'
    );
  };

  const handleCopyOnly = async () => {
    try {
      const htmlText = buildHtmlReport();
      const blobHtml = new Blob([htmlText], { type: 'text/html' });
      const blobText = new Blob([formattedDocMarkdown], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);
    } catch (e) {
      await navigator.clipboard.writeText(formattedDocMarkdown);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadDoc = () => {
    const htmlBlob = new Blob([buildHtmlReport()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(htmlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/[^a-zA-Z0-9а-яА-Я_-]/gi, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Экспорт в Google Документы</h2>
            <p className="text-xs text-slate-400">Саммари, выводы, задачи и полная стенограмма</p>
          </div>
        </div>

        {/* Hero 1-Click Action */}
        <div className="my-5 p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Быстрый экспорт в 1 клик
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Скопировать отчет и открыть Google Docs
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                Нажмите кнопку ниже: мы <strong>скопируем готовый отчет со стилями и форматированием в буфер обмена</strong> и сразу откроем новый Google Документ. Вам останется только нажать <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-white font-mono text-[11px]">Ctrl+V</kbd>.
              </p>
            </div>

            <button
              onClick={handleCopyAndOpenGoogleDocs}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition active:scale-95 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Скопировано! Открываем...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Скопировать и открыть Docs</span>
                </>
              )}
            </button>
          </div>

          {copied && (
            <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Форматированный текст в буфере обмена! В открывшемся документе нажмите <strong>Ctrl + V</strong>.</span>
            </div>
          )}
        </div>

        {/* Alternative Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            onClick={handleCopyOnly}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-emerald-400" /> Скопировать текст в буфер
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Вставить в Word, Telegram или Notion</p>
            </div>
            <span className="text-xs text-slate-400">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </span>
          </button>

          <button
            onClick={handleDownloadDoc}
            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-purple-400" /> Скачать файл документа (.doc)
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Для Word или загрузки на Google Диск</p>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Text Preview Box (User requested to see the text) */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Предпросмотр текста отчета
            </span>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] text-blue-400 hover:underline"
            >
              {showPreview ? 'Свернуть' : 'Развернуть'}
            </button>
          </div>

          {showPreview && (
            <div className="p-4 max-h-56 overflow-y-auto font-sans text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap select-text">
              {formattedDocMarkdown}
            </div>
          )}
        </div>

        {/* Helpful Explanation */}
        <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
          <p>
            Google Docs по соображениям безопасности не позволяет сторонним сайтам передавать текст документа через ссылку (поддерживается только название). Поэтому связка <strong>«Клик ➔ Скопировано ➔ Ctrl+V»</strong> является самым быстрым и безопасным способом перенести готовый отчет.
          </p>
        </div>

      </div>
    </div>
  );
};
