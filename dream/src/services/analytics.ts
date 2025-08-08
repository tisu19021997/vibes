import { getOrCreateSessionId, getOrCreateUserId } from '@/lib/anon';

async function post(path: string, body: unknown) {
  try {
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // swallow analytics errors
  }
}

export function identifyOnce() {
  const userId = getOrCreateUserId();
  const sessionId = getOrCreateSessionId();
  post('/api/analytics', { type: 'identify', userId, sessionId });
}

export function trackImageGenerated(extra?: Record<string, unknown>) {
  const userId = getOrCreateUserId();
  const sessionId = getOrCreateSessionId();
  post('/api/analytics', { type: 'image_generated', userId, sessionId, ...extra });
}

export function getAnonIds() {
  return { userId: getOrCreateUserId(), sessionId: getOrCreateSessionId() };
}


