import { createHash } from 'node:crypto';

/** Clasifica un user-agent en mobile/desktop/tablet/bot. */
export function detectDevice(ua: string | null): string | null {
  if (!ua) return null;
  if (/bot|crawl|spider|curl|wget|python|headless/i.test(ua)) return 'bot';
  if (/ipad|tablet|silk/i.test(ua)) return 'tablet';
  if (/android|iphone|ipod|mobile|opera mini/i.test(ua)) return 'mobile';
  return 'desktop';
}

/** SHA-256 truncado de la IP (privacidad: nunca se guarda la IP cruda). */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/** Normaliza el header Accept-Language a locale corto (es, en-US, …). */
export function parseLocale(acceptLanguage: string | null | undefined): string | null {
  if (!acceptLanguage) return null;
  const first = acceptLanguage.split(',')[0]?.trim();
  return first ? first.slice(0, 20) : null;
}
