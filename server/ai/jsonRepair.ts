import { jsonrepair } from 'jsonrepair';

export function safeParseOrRepairJson(rawText: string): any {
  let s = rawText.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // 1. Direct parse attempt
  try {
    return JSON.parse(s);
  } catch {}

  // 2. Find start of JSON
  const startIdx = s.indexOf('{');
  if (startIdx === -1) {
    console.warn(`[JSON Repair] No "{" found in response! Length: ${s.length}, snippet: "${s.slice(0, 300)}"`);
    throw new Error('Ответ модели не содержит валидный JSON объект');
  }
  s = s.slice(startIdx);

  // 3. Try library-grade jsonrepair
  try {
    const repaired = jsonrepair(s);
    return JSON.parse(repaired);
  } catch {}

  // 4. Remove any trailing junk after final } if present
  const lastBrace = s.lastIndexOf('}');
  if (lastBrace !== -1) {
    const candidate = s.slice(0, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
    try {
      const repaired = jsonrepair(candidate);
      return JSON.parse(repaired);
    } catch {}
  }

  // 5. Stack-based repair for truncated JSON
  return repairTruncatedJson(s);
}

function repairTruncatedJson(s: string, depth = 0): any {
  if (depth > 5) return null;

  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{' || ch === '[') {
        stack.push(ch);
      } else if (ch === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (ch === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  let repaired = s;
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*$/, '');

  for (let i = stack.length - 1; i >= 0; i--) {
    const openChar = stack[i];
    if (openChar === '{') repaired += '}';
    else if (openChar === '[') repaired += ']';
  }

  try {
    return JSON.parse(repaired);
  } catch {
    // If closing didn't work, roll back to last comma and retry
    const lastComma = s.lastIndexOf(',');
    if (lastComma > 0) {
      return repairTruncatedJson(s.slice(0, lastComma), depth + 1);
    }
    return null;
  }
}
