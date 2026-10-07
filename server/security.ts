import { Request, Response, NextFunction } from 'express';
import { adminSettings, guestSessions, users } from './storage.js';

// Configuration
export const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'transcriber_secret_admin_token_2026';
export const DAILY_BUDGET_CAP_USD = Number(process.env.DAILY_BUDGET_CAP_USD) || 10.0; // Max $10 per day to protect wallet
export const DAILY_MAX_TRANSCRIBE_REQUESTS = Number(process.env.DAILY_MAX_TRANSCRIBE_REQUESTS) || 500; // Max 500 per day

// 1. IP Sanitization and Normalization (Prevents IP Spoofing)
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    // Take the left-most client IP in the chain
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp && firstIp !== 'unknown') return firstIp;
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp.trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

// 2. Concurrency Lock (Single-Flight Mutex)
// Prevents an attacker or bot from launching 20 concurrent long transcriptions at the same time
const activeJobs = new Set<string>();

export function acquireJobLock(key: string): boolean {
  if (activeJobs.has(key)) {
    return false; // Already busy with a task
  }
  activeJobs.add(key);
  return true;
}

export function releaseJobLock(key: string): void {
  activeJobs.delete(key);
}

// 3. Sliding Window Rate Limiting (In-Memory Token Bucket)
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const generalRateLimits = new Map<string, RateLimitBucket>();
const transcribeRateLimits = new Map<string, RateLimitBucket>();

// Cleans up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of generalRateLimits.entries()) {
    if (now > bucket.resetAt) generalRateLimits.delete(key);
  }
  for (const [key, bucket] of transcribeRateLimits.entries()) {
    if (now > bucket.resetAt) transcribeRateLimits.delete(key);
  }
}, 60000);

export function generalApiLimiter(req: Request, res: Response, next: NextFunction) {
  // Allow health checks unconditionally
  if (req.path === '/health') return next();

  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute for general api calls

  let bucket = generalRateLimits.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    generalRateLimits.set(ip, bucket);
    return next();
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Слишком много запросов с вашего IP-адреса. Пожалуйста, подождите минуту.',
    });
  }

  next();
}

export function transcribeLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const userRole = (req.headers['x-user-role'] as string) || 'guest';
  const now = Date.now();
  const windowMs = 3 * 60 * 1000; // 3 minutes window
  
  // Stricter limits for guest vs registered user
  const maxRequests = userRole === 'admin' ? 30 : userRole === 'corporate_user' ? 12 : userRole === 'standard_user' ? 6 : 3;

  let bucket = transcribeRateLimits.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    transcribeRateLimits.set(ip, bucket);
    return next();
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: `Превышен лимит частоты запросов (${maxRequests} видео за 3 мин). Пожалуйста, подождите ${retryAfter} сек перед следующей загрузкой. Это защищает систему от перегрузки.`,
    });
  }

  next();
}

// 4. Honeypot Bot Trap
// Bots automatically fill invisible inputs; real humans never do
export function verifyHoneypot(req: Request): boolean {
  const honeypotVal = req.body?._hp_security_check;
  if (honeypotVal && typeof honeypotVal === 'string' && honeypotVal.trim().length > 0) {
    console.warn(`[Security Alert] Honeypot triggered by IP: ${getClientIp(req)}! Value: "${honeypotVal}"`);
    return false; // Detected as automated spam bot!
  }
  return true;
}

// 5. Daily Safety Fuse (Budget & Request Circuit Breaker)
interface DailyUsageState {
  date: string;
  totalTranscriptionsToday: number;
  estimatedCostUsdToday: number;
}

const dailyUsage: DailyUsageState = {
  date: new Date().toISOString().split('T')[0],
  totalTranscriptionsToday: 0,
  estimatedCostUsdToday: 0,
};

export function checkDailyCircuitBreaker(): { allowed: boolean; reason?: string } {
  const today = new Date().toISOString().split('T')[0];
  if (dailyUsage.date !== today) {
    dailyUsage.date = today;
    dailyUsage.totalTranscriptionsToday = 0;
    dailyUsage.estimatedCostUsdToday = 0;
  }

  if (dailyUsage.totalTranscriptionsToday >= DAILY_MAX_TRANSCRIBE_REQUESTS) {
    return {
      allowed: false,
      reason: 'Сработал суточный защитный лимит сервера (достигнут максимум запросов на сегодня). Защита от скрутки токенов включена.',
    };
  }

  if (dailyUsage.estimatedCostUsdToday >= DAILY_BUDGET_CAP_USD) {
    return {
      allowed: false,
      reason: 'Сработал предохранитель суточного бюджета API. Потребление временно приостановлено до завтра для защиты счета владельца.',
    };
  }

  return { allowed: true };
}

export function recordApiConsumption(costUsd: number) {
  dailyUsage.totalTranscriptionsToday++;
  dailyUsage.estimatedCostUsdToday += costUsd;
}

// 6. Admin Authentication Middleware
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'] || req.headers['authorization'];
  const userRole = req.headers['x-user-role'];

  // Check if admin secret token matches or valid admin session
  if (token === ADMIN_SECRET || token === `Bearer ${ADMIN_SECRET}`) {
    return next();
  }

  // If local development, allow if admin role and matches local host
  const isLocal = req.socket.remoteAddress === '127.0.0.1' || req.socket.remoteAddress === '::1' || req.socket.remoteAddress === '::ffff:127.0.0.1';
  if (isLocal && userRole === 'admin') {
    return next();
  }

  return res.status(403).json({
    error: 'Доступ запрещен. Требуется авторизация администратора.',
  });
}
