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
    <p style="margin: 0 0 6px 0; color: #065f46; font-size: 14px;"><strong>Цель и результат:</strong> ${record.analysis.stepByStepGuide.goal}</p>
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

  ${record.analysis.lectureStudyGuide ? `
  <h2>🎓 Учебный конспект & База Знаний (Вебинар)</h2>
  <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 14px 18px; border-radius: 6px; margin: 16px 0;">
    <p style="margin: 0 0 4px 0; color: #5b21b6; font-size: 14px;"><strong>Тема:</strong> ${record.analysis.lectureStudyGuide.subject}</p>
    <p style="margin: 0; color: #6d28d9; font-size: 13px;"><strong>Цель материала:</strong> ${record.analysis.lectureStudyGuide.coreGoal}</p>
  </div>

  ${record.analysis.lectureStudyGuide.glossary && record.analysis.lectureStudyGuide.glossary.length > 0 ? `
  <h3>📖 Глоссарий терминов и понятий</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
    <thead>
      <tr style="background: #ede9fe; color: #4c1d95;">
        <th style="padding: 8px 12px; border: 1px solid #ddd6fe; text-align: left; width: 30%;">Термин</th>
        <th style="padding: 8px 12px; border: 1px solid #ddd6fe; text-align: left;">Определение</th>
        <th style="padding: 8px 12px; border: 1px solid #ddd6fe; text-align: center; width: 12%;">Таймкод</th>
      </tr>
    </thead>
    <tbody>
      ${record.analysis.lectureStudyGuide.glossary.map(g => `
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #6d28d9;">${g.term}</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${g.definition}</td>
        <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; color: #7c3aed;">${g.timestamp || '—'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${record.analysis.lectureStudyGuide.quiz && record.analysis.lectureStudyGuide.quiz.length > 0 ? `
  <h3>🧠 Вопросы для самопроверки (Квиз)</h3>
  <div style="margin-bottom: 16px;">
    ${record.analysis.lectureStudyGuide.quiz.map((q, idx) => `
    <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; font-size: 13px;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #581c87;">Вопрос ${idx + 1}: ${q.question}</p>
      <p style="margin: 0; color: #374151;"><strong>Ответ:</strong> ${q.answer}</p>
    </div>
    `).join('')}
  </div>
  ` : ''}
  ` : ''}

  ${record.analysis.podcastMediaPack ? `
  <h2>🎙 Медиа-пак для блога и соцсетей (Подкаст)</h2>
  <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 14px 18px; border-radius: 6px; margin: 16px 0;">
    <p style="margin: 0; color: #9a3412; font-size: 13px;"><strong>Хук выпуска:</strong> ${record.analysis.podcastMediaPack.episodeHook}</p>
  </div>

  ${record.analysis.podcastMediaPack.readyPostTelegram ? `
  <h3>📱 Готовый пост для Telegram</h3>
  <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 16px;">${record.analysis.podcastMediaPack.readyPostTelegram}</div>
  ` : ''}

  ${record.analysis.podcastMediaPack.quotes && record.analysis.podcastMediaPack.quotes.length > 0 ? `
  <h3>💬 Золотой фонд цитат</h3>
  <div style="margin-bottom: 16px;">
    ${record.analysis.podcastMediaPack.quotes.map(q => `
    <blockquote style="margin: 0 0 10px 0; padding: 8px 16px; border-left: 3px solid #fb923c; background: #fffaf5; font-size: 13px; color: #431407;">
      <p style="margin: 0 0 4px 0; font-style: italic;">«${q.quote}»</p>
      <small style="color: #9a3412; font-weight: bold;">— ${q.speaker} ${q.timestamp ? `[${q.timestamp}]` : ''}</small>
    </blockquote>
    `).join('')}
  </div>
  ` : ''}
  ` : ''}

  ${record.analysis.salesCallAnalysis ? `
  <h2>💼 Разбор звонка / CustDev (Enterprise Аналитика)</h2>
  <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 6px; margin: 16px 0;">
    <p style="margin: 0 0 4px 0; color: #1e40af; font-size: 13px;"><strong>Тип клиента:</strong> ${record.analysis.salesCallAnalysis.clientType} | <strong>Оценка готовности к сделке (Deal Score):</strong> ${record.analysis.salesCallAnalysis.dealScore}/100</p>
    <p style="margin: 0; color: #1e3a8a; font-size: 13px;"><strong>Текущий контекст клиента:</strong> ${record.analysis.salesCallAnalysis.currentSituation}</p>
  </div>

  ${record.analysis.salesCallAnalysis.painPoints && record.analysis.salesCallAnalysis.painPoints.length > 0 ? `
  <h3>🎯 Выявленные боли клиента (Pain Points)</h3>
  <ul>
    ${record.analysis.salesCallAnalysis.painPoints.map(p => `
    <li style="margin-bottom: 6px; font-size: 13px;">
      <strong style="color: ${p.urgency === 'high' ? '#dc2626' : '#2563eb'};">[${p.urgency === 'high' ? 'КРИТИЧНО' : 'УМЕРЕННО'}]</strong> ${p.pain}
      ${p.quote ? `<br><em style="color: #64748b;">«${p.quote}»</em>` : ''}
    </li>
    `).join('')}
  </ul>
  ` : ''}

  ${record.analysis.salesCallAnalysis.objections && record.analysis.salesCallAnalysis.objections.length > 0 ? `
  <h3>🛡 Сомнения и возражения</h3>
  <ul>
    ${record.analysis.salesCallAnalysis.objections.map(o => `
    <li style="margin-bottom: 6px; font-size: 13px;">
      <strong>Возражение:</strong> ${o.objection}<br>
      ${o.rootCause ? `<strong>Истинная причина:</strong> ${o.rootCause}<br>` : ''}
      ${o.howHandledByManager ? `<strong>Отработка менеджером:</strong> ${o.howHandledByManager}` : ''}
    </li>
    `).join('')}
  </ul>
  ` : ''}

  ${record.analysis.salesCallAnalysis.budgetAndDecision ? `
  <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
    <p style="margin: 0 0 4px 0;"><strong>Бюджет / Ожидания:</strong> ${record.analysis.salesCallAnalysis.budgetAndDecision.budgetOrExpectations || 'Не озвучен'}</p>
    <p style="margin: 0 0 4px 0;"><strong>Критерии выбора:</strong> ${record.analysis.salesCallAnalysis.budgetAndDecision.decisionCriteria || 'Стандартные'}</p>
    <p style="margin: 0;"><strong>Лица принимающие решение (ЛПР):</strong> ${record.analysis.salesCallAnalysis.budgetAndDecision.decisionMakers || 'Собеседник'}</p>
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
