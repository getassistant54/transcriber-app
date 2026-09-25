export function parseVttToTranscript(vtt: string): { durationSeconds: number; formattedText: string } {
  const lines = vtt.split(/\r?\n/);
  const items: { time: string; sec: number; text: string }[] = [];
  let currentTimestamp: string | null = null;
  let currentSec = 0;
  let currentText: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const timeMatch = line.match(/(?:(\d{1,2}):)?(\d{2}):(\d{2})\.\d{3}\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})\.\d{3}/);
    if (timeMatch) {
      if (currentTimestamp && currentText.length > 0) {
        items.push({ time: currentTimestamp, sec: currentSec, text: currentText.join(' ') });
      }
      const h = parseInt(timeMatch[1] || '0', 10);
      const m = parseInt(timeMatch[2], 10);
      const s = parseInt(timeMatch[3], 10);
      currentSec = h * 3600 + m * 60 + s;
      const mm = String(h * 60 + m).padStart(2, '0');
      const ss = String(s).padStart(2, '0');
      currentTimestamp = `${mm}:${ss}`;
      currentText = [];
    } else if (line && !line.startsWith('WEBVTT') && !line.match(/^\d+$/)) {
      currentText.push(line);
    }
  }
  if (currentTimestamp && currentText.length > 0) {
    items.push({ time: currentTimestamp, sec: currentSec, text: currentText.join(' ') });
  }

  const durationSeconds = items.length > 0 ? items[items.length - 1].sec + 5 : 180;
  const formattedText = items.map((item) => `[${item.time}] ${item.text}`).join('\n');
  return { durationSeconds, formattedText };
}

export async function extractKinescopeData(url: string): Promise<{ title: string; simulatedDuration: number; subtitlesText: string }> {
  const kMatch = url.match(/kinescope\.io\/(?:embed\/)?([a-zA-Z0-9_-]+)/);
  let title = 'Kinescope Видео';
  let simulatedDuration = 180;
  let subtitlesText = '';

  if (kMatch) {
    const vid = kMatch[1];
    const pageUrl = `https://kinescope.io/${vid}`;
    try {
      const kRes = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://kinescope.io/',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (kRes.ok) {
        const html = await kRes.text();
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();

        const vttMatch = html.match(/https?:\/\/[^\s"'<>]+\.vtt[^\s"'<>]*/);
        if (vttMatch) {
          const vttUrl = vttMatch[0];
          const vttRes = await fetch(vttUrl, {
            headers: { 'Referer': 'https://kinescope.io/' },
            signal: AbortSignal.timeout(5000),
          });
          if (vttRes.ok) {
            const vttText = await vttRes.text();
            const parsed = parseVttToTranscript(vttText);
            subtitlesText = parsed.formattedText;
            simulatedDuration = parsed.durationSeconds;
            console.log(`[Kinescope] Успешно загружены субтитры для "${title}", длительность: ${simulatedDuration} сек.`);
          }
        }
      }
    } catch (e) {
      console.warn('[Kinescope] Error fetching page/subtitles:', e);
    }
  }

  return { title, simulatedDuration, subtitlesText };
}
