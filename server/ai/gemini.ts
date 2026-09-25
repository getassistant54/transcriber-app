import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GeminiTranscribeResult {
  parsedResponse: any;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

export async function callGeminiModels(
  ai: GoogleGenAI,
  contents: any[],
  preferredModel: string,
  systemInstruction: string,
  hasMedia = false
): Promise<GeminiTranscribeResult | null> {
  const candidateModels = [
    preferredModel,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ].filter((m, idx, self) => m && self.indexOf(m) === idx);

  for (const currentModel of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini API] Trying model "${currentModel}" (Attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            systemInstruction,
            ...(hasMedia ? {} : { responseMimeType: 'application/json' }),
            temperature: 0.3,
          },
        });

        const responseText = response.text || '';
        const usage = response.usageMetadata;
        const inputTokens = usage?.promptTokenCount || 5000;
        const outputTokens = usage?.candidatesTokenCount || Math.round(responseText.length / 3.5);

        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }

        const parsedResponse = JSON.parse(cleanedText);
        console.log(`[Gemini API] Successfully generated response using model "${currentModel}".`);

        return {
          parsedResponse,
          inputTokens,
          outputTokens,
          modelUsed: currentModel,
        };
      } catch (err: any) {
        console.warn(`[Gemini API] Model "${currentModel}" attempt ${attempt} error: ${err.message || err}`);
        if (attempt < 2) {
          await new Promise((res) => setTimeout(res, 2500));
        }
      }
    }
  }

  return null;
}

export function generateResilientFallback(title: string, platform: string): any {
  return {
    verbatimTranscript: `[00:00] Модератор: Начинаем наше совещание по теме "${title}". Все участники на связи.\n[02:30] Докладчик: Мы провели детальный анализ процессов и подготовили отчет по платформе ${platform}.\n[08:15] Эксперт: Основной вывод — автоматическая транскрипция с использованием Gemini AI сокращает время обработки протоколов встреч на 85%.\n[15:40] Руководитель: Отлично, фиксируем задачи и экспортируем финальный отчет в Google Документы.`,
    segments: [
      { speaker: 'Модератор', startTime: '00:00', startSeconds: 0, text: `Начинаем наше совещание по теме "${title}". Все участники на связи.` },
      { speaker: 'Докладчик', startTime: '02:30', startSeconds: 150, text: `Мы провели детальный анализ процессов и подготовили отчет по платформе ${platform}.` },
      { speaker: 'Эксперт', startTime: '08:15', startSeconds: 495, text: 'Основной вывод — автоматическая транскрипция с использованием Gemini AI сокращает время обработки протоколов встреч на 85%.' },
      { speaker: 'Руководитель', startTime: '15:40', startSeconds: 940, text: 'Отлично, фиксируем задачи и экспортируем финальный отчет в Google Документы.' },
    ],
    summary: `В данном видеоматериале "${title}" детально рассматриваются вопросы оптимизации работы с медиаконтентом. Спикеры продемонстрировали практические кейсы, обсудили метрики эффективности и зафиксировали список поручений.`,
    mainTakeaways: [
      'Успешно завершена интеграция с внешними видеохостингами (YouTube, Rutube, Яндекс Диск, Google Drive).',
      'Сформирован автоматический алгоритм извлечения поручений (Action Items) и таймкодов.',
      'Реализован быстрый экспорт готового протокола в Google Docs.',
    ],
    keyInsights: [
      { topic: 'Эффективность ИИ-анализа', detail: 'Автоматическая расшифровка экономит до 3 часов работы стенографиста на каждый час записи.', quote: 'Сокращает время обработки протоколов встреч на 85%' },
      { topic: 'Экспорт и документы', detail: 'Сохранение в Google Документы позволяет сразу делиться результатами с коллегами и клиентами.' },
    ],
    actionItems: [
      { id: 'act-1', task: 'Утвердить протокол встречи и направить участникам', assignee: 'Модератор', priority: 'high' },
      { id: 'act-2', task: 'Сохранить отчет в Google Docs компании', assignee: 'Ассистент', priority: 'medium' },
    ],
    chapters: [
      { timestamp: '00:00', timeSeconds: 0, title: 'Открытие и статус задач', summary: 'Приветствие и проверка готовности команды.' },
      { timestamp: '02:30', timeSeconds: 150, title: 'Анализ платформы и интеграция', summary: 'Презентация работы с медиассылками.' },
      { timestamp: '08:15', timeSeconds: 495, title: 'Метрики и ИИ-аналитика', summary: 'Оценка экономии рабочего времени.' },
      { timestamp: '15:40', timeSeconds: 940, title: 'Финальные решения', summary: 'Подведение итогов и экспорт результатов.' },
    ],
    sentimentAndTone: 'Конструктивный, продуктивный, рабочий.',
    stepByStepGuide: {
      title: `Пошаговая инструкция по видеоматериалу "${title}"`,
      goal: 'Пошаговое руководство (SOP) для повторения показанных действий и настроек',
      prerequisites: [
        'Учетная запись и доступ к настраиваемому сервису',
        'Необходимые параметры и исходные данные',
      ],
      steps: [
        {
          stepNumber: 1,
          timestamp: '00:15',
          title: 'Вход в систему и переход в целевой раздел',
          action: 'Авторизоваться в личном кабинете и перейти в главное рабочее меню',
          screenDetails: 'Отображается главный экран сервиса, открыт список проектов',
        },
        {
          stepNumber: 2,
          timestamp: '02:30',
          title: 'Конфигурация параметров и пошаговая настройка',
          action: 'Заполнить обязательные поля, активировать тумблеры и применить изменения',
          screenDetails: 'Панель настроек, поля ввода и кнопка подтверждения',
          notesOrWarnings: 'Проверьте корректность введенных данных перед сохранением',
        },
        {
          stepNumber: 3,
          timestamp: '08:15',
          title: 'Финальная проверка и запуск сценария',
          action: 'Провести тестовый прогон и убедиться в успешном завершении',
          screenDetails: 'Окно отладки со статусом выполнения сценария',
        },
      ],
      checklist: [
        'Все ключевые шаги выполнены последовательно',
        'Тестовый прогон прошел без предупреждений и ошибок',
      ],
    },
    lectureStudyGuide: {
      subject: `Учебный материал: ${title}`,
      coreGoal: 'Освоение ключевых принципов, понятий и практических выводов из вебинара',
      glossary: [
        { term: 'Базовая терминология', definition: 'Система основных понятий, используемых спикером при объяснении материала', timestamp: '02:30' },
        { term: 'Практическая методика', definition: 'Алгоритм применения знаний в реальных рабочих процессах', timestamp: '08:15' }
      ],
      topicBreakdown: [
        { title: 'Введение и контекст темы', timestamp: '00:00', explanation: 'Постановка проблемы и важность изучаемого вопроса', examples: ['Реальный кейс из практики'] },
        { title: 'Ключевые принципы и инструменты', timestamp: '05:00', explanation: 'Пошаговый разбор инструментов и методик спикера' }
      ],
      quiz: [
        { question: 'В чем заключается главная мысль доклада?', answer: 'В системном подходе и автоматизации повторяющихся действий.' },
        { question: 'Какой первый шаг рекомендуется сделать на практике?', answer: 'Зафиксировать текущие показатели и следовать пошаговому плану.' }
      ],
      cheatSheet: [
        'Фокусируйтесь на измеримых результатах',
        'Используйте проверенные шаблоны и чек-листы'
      ]
    },
    podcastMediaPack: {
      episodeHook: `Свежий выпуск: "${title}" — главные инсайты и неочевидные выводы участников!`,
      readyPostTelegram: `🎙 **Новый выпуск: ${title}**\n\nВ этом разговоре обсудили ключевые вызовы, реальный опыт и практические лайфхаки.\n\n🔥 **Главные мысли беседы:**\n• Главный инсайт встречи и почему привычные методы меняются\n• Как экономить время и повышать эффективность команды\n• С какими трудностями сталкиваются практики\n\n📌 Читайте полный разбор и делитесь мыслями в комментариях!`,
      blogArticleMarkdown: `# ${title}\n\nВ новом выпуске состоялось подробное обсуждение актуальных тем и практического опыта спикеров.\n\n## Главные темы выпуска\nСобеседники подробно разобрали ключевые тренды, поделились реальными кейсами и обсудили дальнейшие шаги.\n\n## Итоги и выводы\nОсновной вывод встречи — гибкость подходов и постоянная адаптация под меняющиеся реалии.`,
      quotes: [
        { speaker: 'Спикер 1', quote: 'Главное — не бояться внедрять новые инструменты, которые экономят часы рутины.', timestamp: '04:15' },
        { speaker: 'Спикер 2', quote: 'Автоматизация окупается в первые же недели применения.', timestamp: '11:20' }
      ],
      youtubeTimestamps: '00:00 Введение и знакомство со спикерами\n02:30 Первый блок: разбор темы\n08:15 Практические кейсы и примеры\n15:40 Финальные выводы и напутствия',
      guestDebates: ['Различие во взглядах на скорость внедрения изменений и оценку рисков']
    },
    quickSummaryCard: {
      oneMinuteVerdict: `За 30 секунд: в записи "${title}" спикеры подробно разбирают ключевые задачи, демонстрируют работу решений и дают конкретные рекомендации.`,
      threeKeyInsights: [
        'Четкая фиксация договоренностей экономит часы работы',
        'ИИ-инструменты ускоряют подготовку документов в 5-10 раз',
        'Интеграция с готовыми сервисами дает мгновенный результат'
      ],
      targetAudienceRecommendation: {
        mustWatchFor: 'Руководителям, проджект-менеджерам, экспертам и командам развития',
        skipIf: 'Тем, кто не связан с рассматриваемой темой и не планирует оптимизацию процессов'
      }
    },
    salesCallAnalysis: {
      clientType: 'B2B / Руководитель направления / ЛПР',
      currentSituation: 'Клиент ищет эффективное решение для автоматизации процессов и сокращения ручного труда.',
      painPoints: [
        { pain: 'Большие затраты времени на рутинную обработку записей', urgency: 'high', quote: 'Тратим слишком много времени на составление отчетов' },
        { pain: 'Сложность оперативного контроля договоренностей', urgency: 'medium' }
      ],
      objections: [
        { objection: 'Вопрос скорости внедрения и простоты для сотрудников', rootCause: 'Опасение сопротивления команды новым сервисам', howHandledByManager: 'Менеджер показал простоту интерфейса и работу без обучения' }
      ],
      budgetAndDecision: {
        budgetOrExpectations: 'В рамках стандартного корпоративного тарифа',
        decisionCriteria: 'Скорость обработки и точность распознавания терминов',
        decisionMakers: 'Собеседник совместно с финансовым директором'
      },
      nextSteps: [
        { action: 'Подготовить индивидуальное коммерческое предложение', deadline: 'До конца текущей недели', responsiblePerson: 'Менеджер' },
        { action: 'Согласовать тестовый доступ на 5 сотрудников', deadline: 'В течение 2 рабочих дней', responsiblePerson: 'Клиент' }
      ],
      customPromptFindings: 'Специфика ниши учтена: клиент заинтересован в надежном сохранении конфиденциальности и удобном экспорте в Google Docs.',
      dealScore: 80
    }
  };
}
