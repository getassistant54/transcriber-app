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
  Info,
  CheckCircle2,
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
  const [copiedHtml, setCopiedHtml] = useState(false);

  if (!isOpen || !record) return null;

  const docTitle = record.title;

  const formattedDocMarkdown = `
# 📄 ${record.title}
**Источник:** ${record.sourceUrl} (${record.platform.toUpperCase()})  
**Дата:** ${new Date(record.createdAt).toLocaleDateString('ru-RU')} | **Длительность:** ~${Math.round(record.durationSeconds / 60)} мин

---

## 📌 Краткое содержание (Executive Summary)
${record.analysis.summary}

---

## 💡 Главные выводы и идеи
${record.analysis.mainTakeaways.map((t) => '* ' + t).join('\n')}

---

## ✅ Поручения и Задачи (Action Items)
${record.analysis.actionItems.map((a) => `* **[${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}]** ${a.task} ${a.assignee ? `*(Ответственный: ${a.assignee})*` : ''}`).join('\n')}

---

## 🕒 Хронология и Главы (Timestamps)
${record.analysis.chapters.map((c) => `* **[${c.timestamp}] ${c.title}:** ${c.summary}`).join('\n')}

---

## 📝 Полная Стенограмма
${record.verbatimTranscript}
`;

  const handleCopyFormatted = () => {
    navigator.clipboard.writeText(formattedDocMarkdown);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadDocxHtml = () => {
    const htmlBlob = new Blob(
      [
        `
<html>
<head><meta charset="utf-8"><title>${docTitle}</title></head>
<body style="font-family: Arial, sans-serif; padding: 30px; line-height: 1.6;">
  <h1 style="color: #1e3a8a;">${docTitle}</h1>
  <p><strong>Источник:</strong> ${record.sourceUrl}</p>
  <h2>Саммари</h2>
  <p>${record.analysis.summary}</p>
  <h2>Задачи</h2>
  <ul>${record.analysis.actionItems.map((a) => `<li><b>[${a.priority}]</b> ${a.task}</li>`).join('')}</ul>
  <h2>Стенограмма</h2>
  <pre>${record.verbatimTranscript}</pre>
</body>
</html>
      `,
      ],
      { type: 'text/html;charset=utf-8' }
    );

    const url = URL.createObjectURL(htmlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/[^a-zA-Z0-9а-яА-Я_-]/gi, '_')}_GoogleDoc.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Экспорт в Google Документы</h2>
            <p className="text-xs text-slate-400">Форматированный отчет протокола встречи</p>
          </div>
        </div>

        {/* Action Options */}
        <div className="space-y-4 my-6">
          
          {/* Option 1: Direct Create in Google Docs */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>Способ 1: Создать новый файл в Google Docs</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Откроет встроенный конструктор Google Drive. Скопируйте текст ниже и вставьте в открывшийся документ (Ctrl+V с сохранением стилей).
            </p>
            <a
              href={`https://docs.google.com/document/create?title=${encodeURIComponent(docTitle)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
            >
              <span>Открыть Google Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Option 2: Copy Formatted Markdown / HTML */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Copy className="w-4 h-4 text-emerald-400" />
              <span>Способ 2: Скопировать готовый форматированный текст</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Текст содержит заголовки `#`, списки `*` и выделения для идеальной вставки в Google Docs или Notion.
            </p>
            <button
              onClick={handleCopyFormatted}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
            >
              {copiedHtml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedHtml ? 'Скопировано!' : 'Скопировать текст отчета'}</span>
            </button>
          </div>

          {/* Option 3: Download HTML/Doc File */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 transition">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-purple-400" />
              <span>Способ 3: Скачать .HTML для затягивания в Google Диск</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Скачайте HTML документ и перетащите его на Google Диск — он автоматически откроется как Google Документ.
            </p>
            <button
              onClick={handleDownloadDocxHtml}
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Скачать файл HTML/Doc</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
