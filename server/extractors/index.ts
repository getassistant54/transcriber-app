import { VideoPlatform, SpeakerSegment } from '../../src/types.js';
import { extractKinescopeData } from './kinescope.js';
import { isZoomUrl, extractZoomData } from './zoom.js';

export interface VideoLinkInfo {
  platform: VideoPlatform;
  title: string;
  simulatedDuration: number;
  subtitlesText?: string;
  segments?: SpeakerSegment[];
  hasNativeTranscript?: boolean;
}

export async function parseVideoLinkInfo(url: string, passcode?: string): Promise<VideoLinkInfo> {
  const cleanUrl = url.trim().toLowerCase();

  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
    return {
      platform: 'youtube',
      title: videoId ? `YouTube: ${videoId}` : 'YouTube Видео',
      simulatedDuration: 1800, // 30 mins
    };
  } else if (cleanUrl.includes('rutube.ru')) {
    const videoIdMatch = url.match(/\/video\/(?:private\/)?([a-zA-Z0-9_-]+)/);
    let title = 'Rutube Видео';
    let simulatedDuration = 180;
    if (videoIdMatch) {
      const vid = videoIdMatch[1];
      const queryParams = url.includes('?') ? '?' + url.split('?')[1] : '';
      try {
        const rRes = await fetch(`https://rutube.ru/api/video/${vid}/${queryParams}`, { signal: AbortSignal.timeout(4000) });
        if (rRes.ok) {
          const rData: any = await rRes.json();
          if (rData.title) title = `Rutube: ${rData.title}`;
          if (rData.duration) simulatedDuration = rData.duration;
        }
      } catch (e) {}
    }
    return { platform: 'rutube', title, simulatedDuration };
  } else if (cleanUrl.includes('disk.yandex') || cleanUrl.includes('yadi.sk')) {
    let title = 'Яндекс Диск: Облачная аудио/видеозапись';
    let simulatedDuration = 2700; // 45 mins
    try {
      const ydRes = await fetch(`https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(3000) });
      if (ydRes.ok) {
        const ydData: any = await ydRes.json();
        if (ydData.name) title = `Яндекс Диск: ${ydData.name}`;
      }
    } catch (e) {}
    return { platform: 'yandex_disk', title, simulatedDuration };
  } else if (cleanUrl.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return {
      platform: 'google_drive',
      title: fileIdMatch ? `Google Drive: Запись (${fileIdMatch[1].slice(0, 8)}...)` : 'Google Drive: Запись',
      simulatedDuration: 1500, // 25 mins
    };
  } else if (cleanUrl.includes('kinescope.io')) {
    const kData = await extractKinescopeData(url);
    return {
      platform: 'kinescope',
      title: kData.title,
      simulatedDuration: kData.simulatedDuration,
      subtitlesText: kData.subtitlesText,
    };
  } else if (isZoomUrl(url)) {
    const zData = await extractZoomData(url, passcode);
    return {
      platform: 'zoom',
      title: zData.title,
      simulatedDuration: zData.durationSeconds,
      subtitlesText: zData.verbatimTranscript,
      segments: zData.segments,
      hasNativeTranscript: zData.hasNativeTranscript,
    };
  } else {
    return {
      platform: 'direct_url',
      title: 'Медиафайл по прямой ссылке',
      simulatedDuration: 1200,
    };
  }
}
