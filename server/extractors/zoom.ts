import https from 'https';
import querystring from 'querystring';
import { SpeakerSegment } from '../../src/types.js';

export interface ZoomCheckResult {
  isZoom: boolean;
  requiresPassword: boolean;
  meetingId?: string;
  topic?: string;
  durationSeconds?: number;
  hasNativeTranscript?: boolean;
  hasAiAnalyze?: boolean;
  transcriptCount?: number;
  error?: string;
}

export interface ZoomExtractedData {
  title: string;
  durationSeconds: number;
  hasNativeTranscript: boolean;
  hasAiAnalyze: boolean;
  verbatimTranscript?: string;
  segments?: SpeakerSegment[];
  streamUrl?: string;
  cookies?: Record<string, string>;
}

export function isZoomUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  return (lower.includes('zoom.us/rec/share/') || lower.includes('zoom.us/rec/play/') || lower.includes('zoom.us/recording/share/'));
}

export function extractPasscodeFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const pwd = parsed.searchParams.get('pwd');
    if (pwd) return pwd.trim();
  } catch (e) {}
  return undefined;
}

class ZoomSession {
  private cookies: Record<string, string> = {};

  private updateCookies(setCookieHeader?: string | string[]) {
    if (!setCookieHeader) return;
    const arr = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    for (const c of arr) {
      const parts = c.split(';')[0].split('=');
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      this.cookies[name] = val;
    }
  }

  public getCookieString(): string {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  public getCookies(): Record<string, string> {
    return { ...this.cookies };
  }

  public request(options: https.RequestOptions, postData: string | null = null): Promise<{ statusCode: number; headers: Record<string, any>; data: string }> {
    return new Promise((resolve, reject) => {
      const reqHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Cookie: this.getCookieString(),
        ...options.headers,
      };

      const req = https.request({
        ...options,
        headers: reqHeaders,
      }, (res) => {
        this.updateCookies(res.headers['set-cookie']);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            data,
          });
        });
      });

      req.on('error', reject);
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}

function parseTsToSeconds(ts: string): number {
  if (!ts) return 0;
  const parts = ts.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return Math.floor(hours * 3600 + minutes * 60 + seconds);
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return Math.floor(minutes * 60 + seconds);
  }
  return 0;
}

function formatSecondsToDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${mm}:${ss}`;
}

function parseJsObject(snippet: string): any {
  return new Function('return (' + snippet + ');')();
}

export async function checkZoomRecording(url: string, passcode?: string): Promise<ZoomCheckResult> {
  if (!isZoomUrl(url)) {
    return { isZoom: false, requiresPassword: false };
  }

  const effectivePasscode = passcode?.trim() || extractPasscodeFromUrl(url);
  const session = new ZoomSession();
  const urlObj = new URL(url);
  const host = urlObj.host;

  try {
    // 1. Fetch initial page
    const res1 = await session.request({
      hostname: host,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
    });

    const match1 = res1.data.match(/window\.__data__\s*=\s*(\{[\s\S]*?\});/);
    if (!match1) {
      return { isZoom: true, requiresPassword: false, error: 'Не удалось разобрать данные страницы Zoom' };
    }

    const windowData = parseJsObject(match1[1]);
    const meetingId = windowData.meetingId;
    if (!meetingId) {
      // It might be a direct /rec/play URL
      if (windowData.fileId) {
        return await fetchPlayInfo(session, host, windowData.fileId, url);
      }
      return { isZoom: true, requiresPassword: false, error: 'Идентификатор встречи не найден' };
    }

    // 2. Check share-info
    const shareInfoRes = await session.request({
      hostname: host,
      path: `/nws/recording/1.0/play/share-info/${encodeURIComponent(meetingId)}?accessLevel=meeting`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Referer': url,
      },
    });

    const shareInfo = JSON.parse(shareInfoRes.data);
    const isNeedPassword = shareInfo.result?.componentName === 'need-password';

    if (isNeedPassword) {
      if (!effectivePasscode) {
        return {
          isZoom: true,
          requiresPassword: true,
          meetingId,
        };
      }

      // Validate passcode
      const ctxBody = querystring.stringify({
        meetingId,
        fileId: windowData.fileId || '',
        useWhichPasswd: shareInfo.result?.useWhichPasswd || 'meeting',
        sharelevel: windowData.sharelevel || 'meeting',
        iet: '',
      });

      const ctxRes = await session.request({
        hostname: host,
        path: '/nws/recording/1.0/validate-context',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': url,
          'Accept': 'application/json',
        },
      }, ctxBody);

      const ctxData = JSON.parse(ctxRes.data);
      const encryptMeetId = ctxData.result?.encryptMeetId || meetingId;

      const validateBody = querystring.stringify({
        id: encryptMeetId,
        passwd: effectivePasscode,
        action: '',
        recaptcha: '',
      });

      const validateRes = await session.request({
        hostname: host,
        path: '/nws/recording/1.0/validate-meeting-passwd',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': url,
          'Accept': 'application/json',
        },
      }, validateBody);

      const valData = JSON.parse(validateRes.data);
      if (valData.errorCode !== 0 || valData.status === false) {
        return {
          isZoom: true,
          requiresPassword: true,
          meetingId,
          error: valData.errorMessage || 'Неверный код доступа (пароль)',
        };
      }

      // Now query share-info again to get unlocked play path
      const unlockedShareRes = await session.request({
        hostname: host,
        path: `/nws/recording/1.0/play/share-info/${encodeURIComponent(meetingId)}?accessLevel=meeting`,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Referer': url,
        },
      });

      const unlockedData = JSON.parse(unlockedShareRes.data);
      const playPath = unlockedData.result?.redirectUrl;
      if (!playPath) {
        return { isZoom: true, requiresPassword: false, error: 'Не получен путь к записи' };
      }

      // Fetch play page to get fileId
      const playPageRes = await session.request({
        hostname: host,
        path: playPath,
        method: 'GET',
        headers: { 'Referer': url },
      });

      const playMatch = playPageRes.data.match(/window\.__data__\s*=\s*(\{[\s\S]*?\});/);
      if (!playMatch) {
        return { isZoom: true, requiresPassword: false, error: 'Не удалось загрузить данные плеера' };
      }
      const playData = parseJsObject(playMatch[1]);
      return await fetchPlayInfo(session, host, playData.fileId, `https://${host}${playPath}`);
    } else {
      // Unprotected recording
      const playPath = shareInfo.result?.redirectUrl;
      if (playPath) {
        const playPageRes = await session.request({
          hostname: host,
          path: playPath,
          method: 'GET',
          headers: { 'Referer': url },
        });
        const playMatch = playPageRes.data.match(/window\.__data__\s*=\s*(\{[\s\S]*?\});/);
        if (playMatch) {
          const playData = parseJsObject(playMatch[1]);
          return await fetchPlayInfo(session, host, playData.fileId, `https://${host}${playPath}`);
        }
      }
      return {
        isZoom: true,
        requiresPassword: false,
        meetingId,
        topic: shareInfo.result?.topic || 'Zoom Запись',
      };
    }
  } catch (err: any) {
    console.error('[Zoom] check error:', err);
    return { isZoom: true, requiresPassword: false, error: err.message || 'Ошибка проверки Zoom записи' };
  }
}

async function fetchPlayInfo(session: ZoomSession, host: string, fileId: string, referer: string): Promise<ZoomCheckResult> {
  const infoRes = await session.request({
    hostname: host,
    path: `/nws/recording/1.0/play/info/${encodeURIComponent(fileId)}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Referer': referer,
    },
  });

  const infoObj = JSON.parse(infoRes.data);
  if (!infoObj.result) {
    return { isZoom: true, requiresPassword: false, error: 'Не удалось получить метаданные записи' };
  }

  const r = infoObj.result;
  const topic = r.meet?.topic || 'Zoom Запись';
  const durationSeconds = r.duration || 1800;
  const transcriptList = r.transcriptList || [];
  const hasNativeTranscript = !!(r.hasTranscript && transcriptList.length > 0);
  const hasAiAnalyze = !!(r.hasAiAnalyzeResult || r.canPlaySmartRecording);

  return {
    isZoom: true,
    requiresPassword: false,
    topic,
    durationSeconds,
    hasNativeTranscript,
    hasAiAnalyze,
    transcriptCount: transcriptList.length,
  };
}

export async function extractZoomData(url: string, passcode?: string): Promise<ZoomExtractedData> {
  const effectivePasscode = passcode?.trim() || extractPasscodeFromUrl(url);
  const session = new ZoomSession();
  const urlObj = new URL(url);
  const host = urlObj.host;

  // 1. Initial page
  const res1 = await session.request({
    hostname: host,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
  });

  const match1 = res1.data.match(/window\.__data__\s*=\s*(\{[\s\S]*?\});/);
  if (!match1) {
    throw new Error('Не удалось прочитать параметры страницы Zoom');
  }
  const windowData = parseJsObject(match1[1]);
  const meetingId = windowData.meetingId;

  let fileId = windowData.fileId;
  let playPath = '';

  if (meetingId) {
    // 2. Share-info
    const shareInfoRes = await session.request({
      hostname: host,
      path: `/nws/recording/1.0/play/share-info/${encodeURIComponent(meetingId)}?accessLevel=meeting`,
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Referer': url },
    });
    const shareInfo = JSON.parse(shareInfoRes.data);

    if (shareInfo.result?.componentName === 'need-password') {
      if (!effectivePasscode) {
        throw new Error('Запись Zoom защищена паролем. Укажите код доступа (passcode).');
      }

      // Context
      const ctxBody = querystring.stringify({
        meetingId,
        fileId: windowData.fileId || '',
        useWhichPasswd: shareInfo.result?.useWhichPasswd || 'meeting',
        sharelevel: windowData.sharelevel || 'meeting',
        iet: '',
      });
      const ctxRes = await session.request({
        hostname: host,
        path: '/nws/recording/1.0/validate-context',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': url },
      }, ctxBody);
      const ctxData = JSON.parse(ctxRes.data);
      const encryptMeetId = ctxData.result?.encryptMeetId || meetingId;

      // Passcode validation
      const validateBody = querystring.stringify({
        id: encryptMeetId,
        passwd: effectivePasscode,
        action: '',
        recaptcha: '',
      });
      const validateRes = await session.request({
        hostname: host,
        path: '/nws/recording/1.0/validate-meeting-passwd',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': url },
      }, validateBody);
      const valData = JSON.parse(validateRes.data);
      if (valData.errorCode !== 0 || valData.status === false) {
        throw new Error(valData.errorMessage || 'Неверный код доступа Zoom');
      }

      // Unlocked share-info
      const unlockedShareRes = await session.request({
        hostname: host,
        path: `/nws/recording/1.0/play/share-info/${encodeURIComponent(meetingId)}?accessLevel=meeting`,
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Referer': url },
      });
      const unlockedData = JSON.parse(unlockedShareRes.data);
      playPath = unlockedData.result?.redirectUrl;
    } else {
      playPath = shareInfo.result?.redirectUrl;
    }

    if (playPath) {
      const playPageRes = await session.request({
        hostname: host,
        path: playPath,
        method: 'GET',
        headers: { 'Referer': url },
      });
      const playMatch = playPageRes.data.match(/window\.__data__\s*=\s*(\{[\s\S]*?\});/);
      if (playMatch) {
        const playData = parseJsObject(playMatch[1]);
        fileId = playData.fileId;
      }
    }
  }

  if (!fileId) {
    throw new Error('Не удалось определить fileId для Zoom записи');
  }

  // 3. Get full play info
  const infoRes = await session.request({
    hostname: host,
    path: `/nws/recording/1.0/play/info/${encodeURIComponent(fileId)}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Referer': playPath ? `https://${host}${playPath}` : url,
    },
  });

  const infoObj = JSON.parse(infoRes.data);
  if (!infoObj.result) {
    throw new Error('Zoom не вернул результат плеера');
  }

  const r = infoObj.result;
  const topic = r.meet?.topic || 'Zoom Запись';
  const durationSeconds = r.duration || 1800;
  const transcriptList: Array<{ ts: string; end_ts?: string; username?: string; text: string }> = r.transcriptList || [];
  const hasNativeTranscript = !!(r.hasTranscript && transcriptList.length > 0);
  const hasAiAnalyze = !!(r.hasAiAnalyzeResult || r.canPlaySmartRecording);
  const streamUrl = r.viewMp4Url || r.mp4Url;

  if (hasNativeTranscript) {
    const verbatimLines: string[] = [];
    const segments: SpeakerSegment[] = [];

    for (const item of transcriptList) {
      const speaker = (item.username || 'Участник').trim();
      const startSec = parseTsToSeconds(item.ts);
      const displayTime = formatSecondsToDisplay(startSec);
      const text = (item.text || '').trim();
      if (!text) continue;

      verbatimLines.push(`[${displayTime}] ${speaker}: ${text}`);
      segments.push({
        speaker,
        startTime: displayTime,
        startSeconds: startSec,
        text,
      });
    }

    return {
      title: topic,
      durationSeconds,
      hasNativeTranscript: true,
      hasAiAnalyze,
      verbatimTranscript: verbatimLines.join('\n\n'),
      segments,
      streamUrl,
      cookies: session.getCookies(),
    };
  }

  return {
    title: topic,
    durationSeconds,
    hasNativeTranscript: false,
    hasAiAnalyze,
    streamUrl,
    cookies: session.getCookies(),
  };
}
