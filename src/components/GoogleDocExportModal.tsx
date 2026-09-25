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
  const [copiedDocs, setCopiedDocs] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [downloadDocStatus, setDownloadDocStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [showPreview, setShowPreview] = useState(true);

  if (!isOpen || !record) return null;

  const docTitle = record.title.replace(/^YouTube\s*Видео:\s*/i, '').trim() || record.title;
  const displayLanguage = (!record.language || record.language.includes('?')) ? 'Русский' : record.language;

  // Build clean HTML report formatted strictly for Arial in Google Docs & Microsoft Word
  const buildHtmlReport = () => {
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    <!--
    @page WordSection1 {
      size: 595.3pt 841.9pt; /* A4 */
      margin: 56.7pt 56.7pt 56.7pt 56.7pt;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.WordSection1 {
      page: WordSection1;
    }
    @font-face {
      font-family: "Arial";
      panose-1: 2 11 6 4 2 2 2 2 2 4;
      mso-font-charset: 204;
      mso-generic-font-family: swiss;
      mso-font-pitch: variable;
      mso-font-signature: -536859905 -1073711037 9 0 511 0;
    }
    * {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
      mso-ascii-font-family: Arial !important;
      mso-fareast-font-family: Arial !important;
      mso-hansi-font-family: Arial !important;
      mso-bidi-font-family: Arial !important;
    }
    body, p, li, div, span, td, th {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
      mso-ascii-font-family: Arial !important;
      mso-fareast-font-family: Arial !important;
      mso-hansi-font-family: Arial !important;
      mso-bidi-font-family: Arial !important;
    }
    p.MsoNormal, li.MsoNormal, div.MsoNormal {
      mso-style-unhide: no;
      mso-style-qformat: yes;
      mso-style-parent: "";
      margin: 0cm;
      margin-bottom: 6.0pt;
      mso-pagination: widow-orphan;
      font-size: 11.0pt;
      line-height: 1.5;
      font-family: Arial, sans-serif;
      mso-ascii-font-family: Arial;
      mso-fareast-font-family: Arial;
      mso-hansi-font-family: Arial;
      mso-bidi-font-family: Arial;
      color: #1a1a1a;
    }
    body {
      font-family: Arial, sans-serif !important;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 20px auto;
      padding: 0 15px;
    }
    h1 {
      font-family: Arial, sans-serif !important;
      mso-ascii-font-family: Arial !important;
      mso-hansi-font-family: Arial !important;
      mso-bidi-font-family: Arial !important;
      color: #1e3a8a;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 8px;
      font-size: 18pt;
      margin-top: 14pt;
      margin-bottom: 12pt;
      font-weight: bold;
    }
    h2 {
      font-family: Arial, sans-serif !important;
      mso-ascii-font-family: Arial !important;
      mso-hansi-font-family: Arial !important;
      mso-bidi-font-family: Arial !important;
      color: #1d4ed8;
      margin-top: 20pt;
      margin-bottom: 8pt;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
      font-size: 13pt;
      font-weight: bold;
    }
    p, li {
      font-family: Arial, sans-serif !important;
      mso-ascii-font-family: Arial !important;
      mso-hansi-font-family: Arial !important;
      font-size: 11pt;
      line-height: 1.6;
    }
    .meta {
      font-family: Arial, sans-serif !important;
      background-color: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 10pt;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    .summary-box {
      font-family: Arial, sans-serif !important;
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 14px;
      border-radius: 4px;
      margin: 16px 0;
    }
    }
    .task-item {
      font-family: Arial, sans-serif !important;
      margin-bottom: 6px;
      padding: 6px 10px;
      background: #f9fafb;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      font-size: 10.5pt;
    }
    .chapter-time {
      font-family: Arial, sans-serif !important;
      color: #2563eb;
      font-weight: bold;
    }
    .segment-time {
      font-family: Arial, sans-serif !important;
      color: #64748b;
      font-size: 10pt;
    }
    .speaker-name {
      font-family: Arial, sans-serif !important;
      font-weight: bold;
      color: #1e40af;
    }
  </style>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a;">
  <div class="WordSection1" style="font-family: Arial, Helvetica, sans-serif;">
    <h1 style="font-family: Arial, Helvetica, sans-serif; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; font-size: 18pt;">
      ${docTitle}
    </h1>
    
    <div class="meta" style="font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 10pt; border: 1px solid #e2e8f0;">
      <p style="font-family: Arial, Helvetica, sans-serif; margin: 0 0 6px 0;"><strong>Источник:</strong> <a href="${record.sourceUrl}">${record.sourceUrl}</a> (${record.platform.toUpperCase()})</p>
      <p style="font-family: Arial, Helvetica, sans-serif; margin: 0;"><strong>Дата создания:</strong> ${new Date(record.createdAt).toLocaleDateString('ru-RU')} | <strong>Длительность:</strong> ~${Math.round(record.durationSeconds / 60)} мин | <strong>Язык:</strong> ${displayLanguage}</p>
    </div>

    <h2 style="font-family: Arial, Helvetica, sans-serif; color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 13pt;">
      Краткое содержание (Саммари)
    </h2>
    <div class="summary-box" style="font-family: Arial, Helvetica, sans-serif; background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 4px; margin: 16px 0;">
      <p style="font-family: Arial, Helvetica, sans-serif; margin: 0; line-height: 1.6;">${record.analysis.summary.replace(/\n/g, '<br>')}</p>
    </div>

    ${record.analysis.stepByStepGuide ? `
    <h2 style="font-family: Arial, Helvetica, sans-serif; color: #047857; margin-top: 24px; border-bottom: 2px solid #10b981; padding-bottom: 4px; font-size: 14pt;">
      📘 Пошаговая инструкция / Регламент (SOP)
    </h2>
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; border-radius: 4px; margin: 14px 0;">
      <p style="margin: 0 0 6px 0; color: #065f46; font-size: 11pt;"><b>🎯 Цель и результат:</b> ${record.analysis.stepByStepGuide.goal}</p>
      ${record.analysis.stepByStepGuide.prerequisites && record.analysis.stepByStepGuide.prerequisites.length > 0 ? `
      <p style="margin: 6px 0 2px 0; font-size: 10pt; color: #047857;"><b>Предварительные требования / Доступы:</b></p>
      <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 10pt; color: #065f46;">
        ${record.analysis.stepByStepGuide.prerequisites.map(p => `<li>${p}</li>`).join('')}
      </ul>
      ` : ''}
    </div>

    <div style="font-family: Arial, Helvetica, sans-serif; margin: 16px 0;">
      ${record.analysis.stepByStepGuide.steps.map(s => `
      <div style="margin-bottom: 10px; padding: 10px 14px; background: #ffffff; border: 1px solid #d1fae5; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-size: 11pt; font-weight: bold; color: #065f46;">
          Шаг ${s.stepNumber}. ${s.title} ${s.timestamp ? `<span style="color: #059669; font-weight: normal;">[${s.timestamp}]</span>` : ''}
        </p>
        <p style="margin: 0 0 4px 0; font-size: 10.5pt; line-height: 1.5;"><b>Действие:</b> ${s.action}</p>
        ${s.screenDetails ? `<p style="margin: 0 0 4px 0; color: #4b5563; font-size: 9.5pt;"><i>Экран: ${s.screenDetails}</i></p>` : ''}
        ${s.notesOrWarnings ? `<p style="margin: 2px 0 0 0; color: #b45309; font-size: 9.5pt;"><b>⚠️ Внимание:</b> ${s.notesOrWarnings}</p>` : ''}
      </div>
      `).join('')}
    </div>

    ${record.analysis.stepByStepGuide.checklist && record.analysis.stepByStepGuide.checklist.length > 0 ? `
    <div style="background-color: #f8fafc; border: 1px dashed #94a3b8; padding: 10px 14px; border-radius: 4px; margin: 14px 0; font-size: 10pt;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #334155;">✅ Чек-лист проверки результата:</p>
      <ul style="margin: 0; padding-left: 20px; color: #475569;">
        ${record.analysis.stepByStepGuide.checklist.map(c => `<li>☑️ ${c}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    ` : ''}

    <h2 style="font-family: Arial, Helvetica, sans-serif; color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 13pt;">
      Главные выводы
    </h2>
    <ul style="font-family: Arial, Helvetica, sans-serif; padding-left: 20px; line-height: 1.6;">
      ${record.analysis.mainTakeaways.map((t) => `<li style="font-family: Arial, Helvetica, sans-serif; margin-bottom: 4px;">${t}</li>`).join('')}
    </ul>

    <h2 style="font-family: Arial, Helvetica, sans-serif; color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 13pt;">
      Поручения и задачи (Action Items)
    </h2>
    <div style="font-family: Arial, Helvetica, sans-serif;">
      ${record.analysis.actionItems
        .map(
          (a) => `
        <div class="task-item" style="font-family: Arial, Helvetica, sans-serif; margin-bottom: 6px; padding: 6px 10px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb;">
          <b>[${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}]</b> ${a.task}
          ${a.assignee ? `<i>(Ответственный: ${a.assignee})</i>` : ''}
        </div>`
        )
        .join('')}
    </div>

    <h2 style="font-family: Arial, Helvetica, sans-serif; color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 13pt;">
      Главы и таймкоды
    </h2>
    <ul style="font-family: Arial, Helvetica, sans-serif; padding-left: 20px; line-height: 1.6;">
      ${record.analysis.chapters
        .map(
          (c) => `
        <li style="font-family: Arial, Helvetica, sans-serif; margin-bottom: 6px;">
          <span style="font-family: Arial, Helvetica, sans-serif; color: #2563eb; font-weight: bold;">[${c.timestamp}]</span> <b>${c.title}</b> — ${c.summary}
        </li>`
        )
        .join('')}
    </ul>

    <h2 style="font-family: Arial, Helvetica, sans-serif; color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 13pt;">
      Стенограмма диалога
    </h2>
    <div style="font-family: Arial, Helvetica, sans-serif;">
      ${
        record.segments && record.segments.length > 0
          ? record.segments
              .map(
                (s) => `
            <p style="font-family: Arial, Helvetica, sans-serif; margin-bottom: 8px; line-height: 1.6;">
              <span style="font-family: Arial, Helvetica, sans-serif; color: #64748b; font-size: 10pt;">[${s.startTime}]</span> <span style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; color: #1e40af;">${s.speaker}:</span> ${s.text}
            </p>`
              )
              .join('')
          : `<pre style="font-family: Arial, Helvetica, sans-serif; white-space: pre-wrap; line-height: 1.6;">${record.verbatimTranscript}</pre>`
      }
    </div>
  </div>
</body>
</html>`;
  };

  const formattedDocMarkdown = `
# ${docTitle}
Источник: ${record.sourceUrl} (${record.platform.toUpperCase()})
Дата: ${new Date(record.createdAt).toLocaleDateString('ru-RU')} | Длительность: ~${Math.round(record.durationSeconds / 60)} мин | Язык: ${displayLanguage}

---

## Краткое содержание (Саммари)
${record.analysis.summary}
${
  record.analysis.stepByStepGuide
    ? `
---

## 📘 Пошаговая инструкция / Регламент (SOP)
**🎯 Цель и результат:** ${record.analysis.stepByStepGuide.goal}

${record.analysis.stepByStepGuide.prerequisites && record.analysis.stepByStepGuide.prerequisites.length > 0 ? `### Предварительные требования:\n${record.analysis.stepByStepGuide.prerequisites.map((p) => `* ${p}`).join('\n')}\n` : ''}### Пошаговые действия:
${record.analysis.stepByStepGuide.steps.map((s) => `#### Шаг ${s.stepNumber}. ${s.title} ${s.timestamp ? `[${s.timestamp}]` : ''}\n* **Действие:** ${s.action}${s.screenDetails ? `\n* **Экран/Интерфейс:** ${s.screenDetails}` : ''}${s.notesOrWarnings ? `\n* **⚠️ Важно:** ${s.notesOrWarnings}` : ''}`).join('\n\n')}

${record.analysis.stepByStepGuide.checklist && record.analysis.stepByStepGuide.checklist.length > 0 ? `### Чек-лист проверки результата:\n${record.analysis.stepByStepGuide.checklist.map((c) => `- [ ] ${c}`).join('\n')}\n` : ''}`
    : ''
}
---

## Главные выводы
${record.analysis.mainTakeaways.map((t) => '* ' + t).join('\n')}

---

## Поручения и Задачи (Action Items)
${record.analysis.actionItems.map((a) => `* [${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}] ${a.task} ${a.assignee ? `(Ответственный: ${a.assignee})` : ''}`).join('\n')}

---

## Главы и таймкоды
${record.analysis.chapters.map((c) => `* [${c.timestamp}] ${c.title}: ${c.summary}`).join('\n')}

---

## Стенограмма диалога
${
  record.segments && record.segments.length > 0
    ? record.segments.map((s) => `[${s.startTime}] ${s.speaker}: ${s.text}`).join('\n\n')
    : record.verbatimTranscript
}
  `.trim();

  // Bulletproof HTML + Text clipboard copy with fallback hierarchy
  const copyHtmlAndTextToClipboard = async (html: string, text: string) => {
    let success = false;

    // 1. Modern ClipboardItem with formatted HTML + plain text
    if (navigator?.clipboard?.write && window.ClipboardItem) {
      try {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([text], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          }),
        ]);
        success = true;
      } catch (err) {
        console.warn('HTML ClipboardItem copy failed, falling back:', err);
      }
    }

    // 2. navigator.clipboard.writeText
    if (!success && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (err) {
        console.warn('writeText copy failed, falling back:', err);
      }
    }

    // 3. document.execCommand('copy') fallback
    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (err) {
        console.error('execCommand fallback failed:', err);
      }
    }
  };

  // Primary Action: Copy Rich HTML to Clipboard & Open Google Docs in 1 click
  const handleCopyAndOpenGoogleDocs = async () => {
    // 1. Immediately show beautiful green confirmation
    setCopiedDocs(true);
    setTimeout(() => setCopiedDocs(false), 9000);

    // 2. Open Google Docs synchronously on click
    try {
      window.open(
        `https://docs.google.com/document/create?title=${encodeURIComponent(docTitle)}`,
        '_blank'
      );
    } catch (e) {
      console.warn('Popup opened with fallback:', e);
    }

    // 3. Copy rich HTML report to clipboard
    try {
      const htmlText = buildHtmlReport();
      await copyHtmlAndTextToClipboard(htmlText, formattedDocMarkdown);
    } catch (e) {
      console.warn('Copy report warning:', e);
    }
  };

  const handleCopyOnly = async () => {
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 4000);

    try {
      const htmlText = buildHtmlReport();
      await copyHtmlAndTextToClipboard(htmlText, formattedDocMarkdown);
    } catch (e) {
      console.warn('Copy text warning:', e);
    }
  };

  const handleDownloadDoc = () => {
    if (downloadDocStatus === 'downloading') return;
    setDownloadDocStatus('downloading');

    try {
      const htmlContent = buildHtmlReport();
      const htmlBlob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(htmlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.replace(/[^a-zA-Z0-9а-яА-Я_-]/gi, '_')}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setDownloadDocStatus('downloaded');
      setTimeout(() => setDownloadDocStatus('idle'), 4500);
    } catch (e) {
      console.error('Download doc failed:', e);
      setDownloadDocStatus('idle');
    }
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
            <h2 className="text-xl font-bold text-white">Экспорт в Google Документы &amp; Word</h2>
            <p className="text-xs text-slate-400">Саммари, выводы, задачи и полная стенограмма в шрифте Arial</p>
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
                Нажмите кнопку: мы <strong>скопируем готовый отчет со шрифтом Arial в буфер обмена</strong> и откроем новый Google Документ. Вам останется нажать <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-white font-mono text-[11px]">Ctrl+V</kbd>.
              </p>
            </div>

            <button
              onClick={handleCopyAndOpenGoogleDocs}
              className={`px-5 py-3 rounded-xl text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition active:scale-95 whitespace-nowrap ${
                copiedDocs
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30'
              }`}
            >
              {copiedDocs ? (
                <>
                  <Check className="w-4 h-4 text-white" />
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

          {/* Prominent Green Notification */}
          {copiedDocs && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-start sm:items-center gap-3 shadow-lg shadow-emerald-950/40">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-xs sm:text-sm">Текст отчета успешно скопирован в буфер обмена!</p>
                <p className="text-[11px] sm:text-xs text-emerald-300/90 mt-0.5">
                  Новый Google Документ открывается в соседней вкладке. Нажмите в нем <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-500/50 text-white font-mono font-bold text-[11px]">Ctrl + V</kbd> — все стили и шрифт Arial применятся автоматически.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Alternative Options */}
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCopyOnly}
              className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                copiedText
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  {copiedText ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{copiedText ? 'Текст скопирован!' : 'Скопировать текст в буфер'}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Вставить в Word, Telegram или Notion</p>
              </div>
              <span className="text-xs text-slate-400">
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </span>
            </button>

            <button
              onClick={handleDownloadDoc}
              disabled={downloadDocStatus === 'downloading'}
              className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                downloadDocStatus === 'downloaded'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : downloadDocStatus === 'downloading'
                  ? 'bg-slate-900 border-blue-500/50 cursor-wait'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  {downloadDocStatus === 'downloaded' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>
                    {downloadDocStatus === 'downloaded'
                      ? 'Файл Word скачан!'
                      : downloadDocStatus === 'downloading'
                      ? 'Формируем файл...'
                      : 'Скачать файл Word (.doc)'}
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {downloadDocStatus === 'downloaded'
                    ? 'Проверьте загрузки браузера'
                    : 'В чистом шрифте Arial для Word или Google Диска'}
                </p>
              </div>
              {downloadDocStatus === 'downloaded' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* Feedback alerts for alternative options */}
          {downloadDocStatus === 'downloaded' && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Файл <strong>.doc</strong> успешно сформирован и загружен! Проверьте папку «Загрузки».</span>
            </div>
          )}

          {copiedText && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Текст отчета скопирован! Теперь вы можете вставить его через <strong>Ctrl + V</strong> в любую программу.</span>
            </div>
          )}
        </div>

        {/* Text Preview Box */}
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
            Файл оптимизирован для Microsoft Word и Google Docs: шрифт <strong>Arial</strong> зафиксирован на всех уровнях заголовков и текста, а кодировка настроена на корректное отображение кириллицы.
          </p>
        </div>

      </div>
    </div>
  );
};
