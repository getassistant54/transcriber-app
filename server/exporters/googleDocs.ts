import { TranscriptionRecord } from '../../src/types.js';

export function generateGoogleDocHtml(record: TranscriptionRecord): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${record.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; font-size: 20px; }
    h2 { color: #1d4ed8; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 16px; }
    .meta { background-color: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
    .summary-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .task-item { margin-bottom: 8px; padding: 8px 12px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; font-size: 13px; }
    .priority-high { color: #dc2626; font-weight: bold; }
    .chapter { font-weight: bold; color: #1e40af; }
    .transcript { white-space: pre-wrap; background: #fafafa; padding: 16px; border: 1px solid #eaeaea; border-radius: 6px; font-size: 13px; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${record.title}</h1>
  <div class="meta">
    <p style="margin: 0 0 4px 0;"><strong>Источник:</strong> ${record.sourceUrl} (${record.platform.toUpperCase()})</p>
    <p style="margin: 0 0 4px 0;"><strong>Дата расшифровки:</strong> ${new Date(record.createdAt).toLocaleString('ru-RU')}</p>
    <p style="margin: 0;"><strong>Длительность:</strong> ~${Math.round(record.durationSeconds / 60)} мин | <strong>Язык:</strong> ${record.language}</p>
  </div>

  <h2>📌 Краткое содержание (Executive Summary)</h2>
  <div class="summary-box">
    <p style="margin: 0;">${record.analysis.summary}</p>
  </div>

  ${record.analysis.stepByStepGuide ? `
  <h2>📘 Пошаговая инструкция / Регламент (SOP)</h2>
  <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin: 16px 0;">
    <p style="margin: 0 0 6px 0; color: #065f46; font-size: 14px;"><strong>Цель (ЦКП):</strong> ${record.analysis.stepByStepGuide.goal}</p>
    ${record.analysis.stepByStepGuide.prerequisites && record.analysis.stepByStepGuide.prerequisites.length > 0 ? `
    <p style="margin: 6px 0 2px 0; font-size: 12px; color: #047857;"><strong>Предварительные требования / Доступы:</strong></p>
    <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 12px; color: #065f46;">
      ${record.analysis.stepByStepGuide.prerequisites.map(p => `<li>${p}</li>`).join('')}
    </ul>
    ` : ''}
  </div>

  <div style="margin: 16px 0;">
    ${record.analysis.stepByStepGuide.steps.map(s => `
    <div style="margin-bottom: 12px; padding: 12px 16px; background: #ffffff; border: 1px solid #d1fae5; border-radius: 6px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #065f46;">
        Шаг ${s.stepNumber}. ${s.title} ${s.timestamp ? `<span style="color: #059669; font-weight: normal;">[${s.timestamp}]</span>` : ''}
      </p>
      <p style="margin: 0 0 4px 0; font-size: 13px; line-height: 1.5;"><strong>Действие:</strong> ${s.action}</p>
      ${s.screenDetails ? `<p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;"><em>Экран/Интерфейс: ${s.screenDetails}</em></p>` : ''}
      ${s.notesOrWarnings ? `<p style="margin: 4px 0 0 0; color: #b45309; font-size: 12px;"><strong>⚠️ Нюанс / Предостережение:</strong> ${s.notesOrWarnings}</p>` : ''}
    </div>
    `).join('')}
  </div>

  ${record.analysis.stepByStepGuide.checklist && record.analysis.stepByStepGuide.checklist.length > 0 ? `
  <div style="background-color: #f8fafc; border: 1px dashed #94a3b8; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #334155; font-size: 12px;">✅ Чек-лист проверки результата:</p>
    <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569;">
      ${record.analysis.stepByStepGuide.checklist.map(c => `<li>☑️ ${c}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  ` : ''}

  <h2>💡 Ключевые выводы и идеи</h2>
  <ul>
    ${record.analysis.mainTakeaways.map((t) => `<li>${t}</li>`).join('')}
  </ul>

  <h2>✅ Поручения и Задачи (Action Items)</h2>
  <div>
    ${record.analysis.actionItems
      .map(
        (a) => `
      <div class="task-item">
        <strong>[${a.priority === 'high' ? 'ВЫСОКИЙ' : 'ОБЫЧНЫЙ'}]</strong> ${a.task} ${a.assignee ? `<em>(Ответственный: ${a.assignee})</em>` : ''}
      </div>`
      )
      .join('')}
  </div>

  <h2>🕒 Хронология и Главы (Timestamps)</h2>
  <ul>
    ${record.analysis.chapters.map((c) => `<li><span class="chapter">[${c.timestamp}] ${c.title}:</span> ${c.summary}</li>`).join('')}
  </ul>

  <h2>📝 Полный текст расшифровки</h2>
  <div class="transcript">${record.verbatimTranscript}</div>
</body>
</html>`;
}
