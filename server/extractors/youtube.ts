import { YoutubeTranscript } from 'youtube-transcript';

export async function extractYouTubeTranscript(url: string): Promise<string | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    if (!transcript || transcript.length === 0) return null;

    return transcript
      .map((item) => {
        const totalSec = Math.floor(item.offset / 1000);
        const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');
        return `[${mm}:${ss}] ${item.text}`;
      })
      .join('\n');
  } catch (err) {
    console.warn(`[YouTube] Could not fetch real transcript for ${url}:`, err);
    return null;
  }
}
