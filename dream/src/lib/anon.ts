import { APP_CONFIG } from '@/config/app';

function generateId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(random)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}_${hex}`;
}

export function getOrCreateUserId(): string {
  const key = (APP_CONFIG.storage as any).userId || 'oneiroi_user_id';
  try {
    let userId = localStorage.getItem(key);
    if (!userId) {
      userId = generateId('u');
      localStorage.setItem(key, userId);
      // Also stamp firstSeen
      localStorage.setItem(`${key}_firstSeen`, new Date().toISOString());
    }
    return userId;
  } catch {
    // Fallback to ephemeral id if storage fails
    return generateId('u');
  }
}

export function getOrCreateSessionId(): string {
  const key = 'oneiroi_session_id';
  try {
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = generateId('s');
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  } catch {
    return generateId('s');
  }
}


