import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

export interface UploadedMediaResult {
  contentsPart: any;
  cleanup: () => Promise<void>;
  sizeMb: number;
}

export async function prepareMediaForGemini(
  ai: GoogleGenAI,
  fileBase64: string,
  fileName?: string,
  fileMimeType?: string
): Promise<UploadedMediaResult> {
  const cleanBase64 = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
  const fileBuffer = Buffer.from(cleanBase64, 'base64');
  const sizeMb = fileBuffer.length / (1024 * 1024);

  const fileExt = fileName?.split('.').pop()?.toLowerCase();
  const isVideoFile = fileMimeType?.includes('video') || (fileName && /\.(mp4|mov|webm|avi|mkv)$/i.test(fileName));

  let effectiveMimeType = fileMimeType;
  if (!effectiveMimeType || effectiveMimeType === 'application/octet-stream') {
    if (fileExt === 'mp4') effectiveMimeType = 'video/mp4';
    else if (fileExt === 'mov') effectiveMimeType = 'video/quicktime';
    else if (fileExt === 'webm') effectiveMimeType = 'video/webm';
    else if (fileExt === 'm4a') effectiveMimeType = 'audio/m4a';
    else if (fileExt === 'mp3') effectiveMimeType = 'audio/mp3';
    else if (fileExt === 'wav') effectiveMimeType = 'audio/wav';
    else effectiveMimeType = isVideoFile ? 'video/mp4' : 'audio/mp3';
  }

  console.log(`[Media] Processing file "${fileName || 'unnamed'}", mime: ${effectiveMimeType}, size: ${sizeMb.toFixed(2)} MB`);

  // If video file OR larger than 15MB, use Google Files API
  if (isVideoFile || sizeMb > 15) {
    const actualExt = fileExt || (isVideoFile ? 'mp4' : 'mp3');
    const scratchDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    const tempFilePath = path.join(scratchDir, `upload_${Date.now()}.${actualExt}`);
    fs.writeFileSync(tempFilePath, fileBuffer);

    console.log(`[Gemini Files API] Uploading media to Google Cloud: ${tempFilePath} (${sizeMb.toFixed(2)} MB)...`);
    let uploadedFile: any = null;
    try {
      uploadedFile = await ai.files.upload({
        file: tempFilePath,
        config: { mimeType: effectiveMimeType },
      });

      console.log(`[Gemini Files API] Uploaded: ${uploadedFile.name}, state: ${uploadedFile.state}`);

      let pollCount = 0;
      while (uploadedFile.state === 'PROCESSING' && pollCount < 60) {
        console.log(`[Gemini Files API] Indexing media... waiting 3s (attempt ${pollCount + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        uploadedFile = await ai.files.get({ name: uploadedFile.name });
        pollCount++;
      }

      if (uploadedFile.state === 'FAILED') {
        throw new Error('Google Gemini не смог обработать медиафайл (статус FAILED). Проверьте формат видеокодека.');
      }

      const cleanup = async () => {
        if (uploadedFile?.name) {
          ai.files.delete({ name: uploadedFile.name }).catch((err) => {
            console.warn('[Gemini Files API] Delete error:', err);
          });
        }
        if (fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (e) {
            console.warn('[Storage] Unlink error:', e);
          }
        }
      };

      return {
        contentsPart: {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType || effectiveMimeType,
          },
        },
        cleanup,
        sizeMb,
      };
    } catch (err) {
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
      }
      throw err;
    }
  } else {
    // Smaller audio (< 15MB) passes inlineData directly
    return {
      contentsPart: {
        inlineData: {
          mimeType: effectiveMimeType || 'audio/mp3',
          data: cleanBase64,
        },
      },
      cleanup: async () => {},
      sizeMb,
    };
  }
}
