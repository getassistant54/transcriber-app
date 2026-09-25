import { Router, Request, Response } from 'express';
import {
  AnalysisPreset,
  AnalysisResult,
  TokenCostBreakdown,
  TranscriptionRecord,
  VideoPlatform,
} from '../../src/types.js';
import {
  adminSettings,
  users,
  guestSessions,
  systemStats,
  prependTranscriptionRecord,
  parseVerbatimToSegments,
} from '../storage.js';
import { parseVideoLinkInfo } from '../extractors/index.js';
import { extractYouTubeTranscript } from '../extractors/youtube.js';
import { checkZoomRecording } from '../extractors/zoom.js';
import { buildAiPrompt } from '../ai/prompts.js';
import { getGeminiClient, callGeminiModels, generateResilientFallback } from '../ai/gemini.js';
import { prepareMediaForGemini } from '../ai/mediaUploader.js';
import { callHydraAi } from '../ai/hydra.js';

export const transcribeRouter = Router();

transcribeRouter.post('/zoom/check', async (req: Request, res: Response) => {
  try {
    const { url, passcode } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL не передан' });
    }
    const result = await checkZoomRecording(url, passcode);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ошибка проверки Zoom ссылки' });
  }
});

transcribeRouter.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const {
      url,
      passcode,
      rawText,
      preset = 'meeting',
      language = 'Русский',
      customTitle,
      fileName,
      fileBase64,
      fileMimeType,
      businessNiche,
      customAiPrompt,
    } = req.body;

    const userId = (req.headers['x-user-id'] as string) || 'guest';
    const userRole = (req.headers['x-user-role'] as string) || 'guest';
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'guest_ip';

    // 1. Guest Limits Check
    if (userRole === 'guest') {
      const session = guestSessions[ip] || { usedMinutesToday: 0, dailyCount: 0, lastReset: new Date().toISOString() };
      const hoursSinceReset = (Date.now() - new Date(session.lastReset).getTime()) / (1000 * 3600);
      if (hoursSinceReset >= 24) {
        session.usedMinutesToday = 0;
        session.dailyCount = 0;
        session.lastReset = new Date().toISOString();
      }

      if (session.dailyCount >= adminSettings.guestDailyLimitCount) {
        return res.status(429).json({
          error: `Вы исчерпали дневной лимит гостя (${adminSettings.guestDailyLimitCount} расшифровок). Зарегистрируйтесь для снятия ограничений!`,
        });
      }
      guestSessions[ip] = session;
    }

    // 2. Identify media and metadata
    let linkInfo: {
      platform: VideoPlatform;
      title: string;
      simulatedDuration: number;
      subtitlesText?: string;
      segments?: any[];
      hasNativeTranscript?: boolean;
    } = {
      platform: 'direct_url',
      title: customTitle || 'Прямой ввод / Аудиозапись',
      simulatedDuration: 900,
    };

    let realTranscriptText: string | null = rawText || null;

    if (url) {
      linkInfo = await parseVideoLinkInfo(url, passcode);
      if (linkInfo.platform === 'youtube') {
        const ytTranscript = await extractYouTubeTranscript(url);
        if (ytTranscript) realTranscriptText = ytTranscript;
      } else if (linkInfo.subtitlesText) {
        realTranscriptText = linkInfo.subtitlesText;
      }
    } else if (fileBase64) {
      linkInfo.platform = 'file_upload';
      linkInfo.title = customTitle || fileName || 'Загруженный медиафайл';
    }

    if (customTitle) {
      linkInfo.title = customTitle;
    }

    let durationSeconds = linkInfo.simulatedDuration || 600;
    const durationMinutes = Math.round((durationSeconds / 60) * 10) / 10;
    const hasMedia = !!fileBase64;
    const isVideoFile = fileMimeType?.includes('video') || (fileName && /\.(mp4|mov|webm|avi|mkv)$/i.test(fileName));

    // 3. Build Prompt
    const aiPrompt = buildAiPrompt({
      title: linkInfo.title,
      platform: linkInfo.platform,
      preset: preset as AnalysisPreset,
      language,
      customSystemPrompt: adminSettings.customSystemPrompt,
      durationMinutes,
      hasMedia,
      isVideoFile: !!isVideoFile,
      fileName,
      realTranscriptText: realTranscriptText || undefined,
      businessNiche: businessNiche || undefined,
      customAiPrompt: customAiPrompt || undefined,
    });

    let parsedResponse: any = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let actualModelUsed = adminSettings.activeModel || 'gemini-3.6-flash';
    let apiSuccess = false;

    // 4. Provider Execution
    if (adminSettings.aiProvider === 'hydra') {
      try {
        const hydraResult = await callHydraAi(
          aiPrompt,
          adminSettings.customSystemPrompt,
          adminSettings.hydraModel,
          adminSettings.hydraBaseUrl
        );
        parsedResponse = hydraResult.parsedResponse;
        inputTokens = hydraResult.inputTokens;
        outputTokens = hydraResult.outputTokens;
        actualModelUsed = hydraResult.modelUsed;
        apiSuccess = true;
      } catch (hErr: any) {
        console.warn(`[Hydra AI] Call failed: ${hErr.message}`);
      }
    }

    if (!apiSuccess) {
      const ai = getGeminiClient();
      let mediaCleanup: (() => Promise<void>) | null = null;
      const contents: any[] = [];

      try {
        if (fileBase64) {
          const media = await prepareMediaForGemini(ai, fileBase64, fileName, fileMimeType);
          contents.push(media.contentsPart);
          mediaCleanup = media.cleanup;
        }

        contents.push(aiPrompt);

        const geminiResult = await callGeminiModels(
          ai,
          contents,
          adminSettings.activeModel || 'gemini-3.6-flash',
          adminSettings.customSystemPrompt,
          hasMedia
        );

        if (geminiResult) {
          parsedResponse = geminiResult.parsedResponse;
          inputTokens = geminiResult.inputTokens;
          outputTokens = geminiResult.outputTokens;
          actualModelUsed = geminiResult.modelUsed;
          apiSuccess = true;
        }
      } finally {
        if (mediaCleanup) {
          await mediaCleanup().catch((e) => console.warn('[Cleanup] Error:', e));
        }
      }
    }

    // 5. Fallback if AI providers failed
    if (!apiSuccess || !parsedResponse) {
      console.warn('[AI] Using resilient structured fallback generator.');
      parsedResponse = generateResilientFallback(linkInfo.title, linkInfo.platform);
      inputTokens = 8500;
      outputTokens = 1900;
    }

    // 6. Calculate Segments & Final Duration
    if (parsedResponse.segments && Array.isArray(parsedResponse.segments) && parsedResponse.segments.length > 0) {
      const lastSeg = parsedResponse.segments[parsedResponse.segments.length - 1];
      if (typeof lastSeg.startSeconds === 'number' && lastSeg.startSeconds > 0) {
        durationSeconds = Math.max(durationSeconds, lastSeg.startSeconds + 5);
      }
    }
    const finalDurationMinutes = Math.round((durationSeconds / 60) * 10) / 10;

    // 7. Calculate Token Costs
    const rawCostUsd = (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.30;
    const finalCostUsd = rawCostUsd * (1 + adminSettings.tokenMarkupPercent / 100);
    const finalCostRub = Math.max(0.1, Math.round(finalCostUsd * adminSettings.usdToRubRate * 100) / 100);

    const tokenCost: TokenCostBreakdown = {
      modelUsed: actualModelUsed,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd: Math.round(finalCostUsd * 10000) / 10000,
      estimatedCostRub: finalCostRub,
      durationMinutes: finalDurationMinutes,
    };

    const analysis: AnalysisResult = {
      summary: parsedResponse.summary || 'Саммари сформировано на основе расшифровки.',
      keyInsights: parsedResponse.keyInsights || [],
      actionItems: parsedResponse.actionItems || [],
      chapters: parsedResponse.chapters || [],
      mainTakeaways: parsedResponse.mainTakeaways || [],
      sentimentAndTone: parsedResponse.sentimentAndTone || 'Нейтральный',
      stepByStepGuide: parsedResponse.stepByStepGuide || undefined,
      lectureStudyGuide: parsedResponse.lectureStudyGuide || undefined,
      podcastMediaPack: parsedResponse.podcastMediaPack || undefined,
      quickSummaryCard: parsedResponse.quickSummaryCard || undefined,
      salesCallAnalysis: parsedResponse.salesCallAnalysis || undefined,
    };

    const fullVerbatim = linkInfo.subtitlesText || parsedResponse.verbatimTranscript || realTranscriptText || '';
    const parsedSegments = parseVerbatimToSegments(fullVerbatim);
    const hasEllipses = parsedResponse.segments?.some((s: any) => s.text?.endsWith('...'));
    const finalSegments = (linkInfo.segments && linkInfo.segments.length > 0)
      ? linkInfo.segments
      : (hasEllipses || parsedSegments.length >= (parsedResponse.segments?.length || 0))
        ? (parsedSegments.length > 0 ? parsedSegments : (parsedResponse.segments || []))
        : (parsedResponse.segments && parsedResponse.segments.length > 0)
          ? parsedResponse.segments
          : parsedSegments;

    // 8. Create Record & Save
    const newRecord: TranscriptionRecord = {
      id: 'tx-' + Date.now(),
      userId: userId === 'guest' ? 'guest' : userId,
      userEmail: users[userId]?.email || 'гость@сессия',
      title: linkInfo.title,
      platform: linkInfo.platform,
      sourceUrl: url || 'Файл: ' + (fileName || 'Медиазапись'),
      durationSeconds,
      preset: preset as AnalysisPreset,
      language,
      createdAt: new Date().toISOString(),
      verbatimTranscript: fullVerbatim,
      segments: finalSegments,
      analysis,
      tokenCost,
      googleDocUrl: `https://docs.google.com/document/create?title=${encodeURIComponent(linkInfo.title)}`,
      businessNiche: businessNiche || undefined,
      customAiPrompt: customAiPrompt || undefined,
    };

    prependTranscriptionRecord(newRecord);

    // Update Stats
    systemStats.totalTranscriptions += 1;
    systemStats.totalDurationHours = Math.round((systemStats.totalDurationHours + durationMinutes / 60) * 10) / 10;
    systemStats.totalTokensUsed += tokenCost.totalTokens;
    systemStats.totalCostUsd = Math.round((systemStats.totalCostUsd + tokenCost.estimatedCostUsd) * 1000) / 1000;
    systemStats.totalRevenueRub += Math.round(tokenCost.estimatedCostRub * 3);

    if (userRole === 'guest') {
      if (!guestSessions[ip]) {
        guestSessions[ip] = { usedMinutesToday: 0, dailyCount: 0, lastReset: new Date().toISOString() };
      }
      guestSessions[ip].usedMinutesToday += Math.round(durationMinutes);
      guestSessions[ip].dailyCount += 1;
    } else if (users[userId]) {
      users[userId].usedMinutesThisMonth += Math.round(durationMinutes);
      users[userId].totalTranscriptionsCount += 1;
    }

    res.json({
      success: true,
      record: newRecord,
    });
  } catch (err: any) {
    console.error('[Transcribe Route] Error:', err);
    res.status(500).json({ error: 'Ошибка при расшифровке: ' + (err.message || 'Внутренняя ошибка сервера') });
  }
});
