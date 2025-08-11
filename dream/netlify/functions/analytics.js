// Minimal anonymous analytics using Netlify Blobs
// FIX: write per-user blobs to avoid last-write-wins on a single JSON file
// - Users stored at: users/<userId>.json
// - Image counts stored at: counts/<userId>.json
const { getStore } = require('@netlify/blobs');
const fetchImpl = global.fetch || require('node-fetch');

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST, OPTIONS', 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { type, userId, sessionId } = payload;
    if (!type || !userId) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Missing type or userId' };
    }

    // Try bound store first, fallback to REST if not configured
    const STORE_NAME = 'oneiroi-analytics';
    const nowIso = new Date().toISOString();

    async function readJson(key, defaultValue) {
      try {
        const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const token = process.env.NETLIFY_API_TOKEN;
        const store = siteID && token
          ? getStore(STORE_NAME, { siteID, token, fetch: fetchImpl })
          : getStore(STORE_NAME);
        const data = await store.get(key, { type: 'json' });
        return data ?? defaultValue;
      } catch (err) {
        const SITE_ID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const TOKEN = process.env.NETLIFY_API_TOKEN;
        if (!SITE_ID || !TOKEN) return defaultValue;
        const base = `https://api.netlify.com/api/v1/blobs/${encodeURIComponent(SITE_ID)}/${encodeURIComponent(STORE_NAME)}`;
        try {
          // Use encodeURI so slashes in keys become path segments (folders)
          const res = await fetchImpl(`${base}/${encodeURI(key)}`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
          });
          if (!res.ok) return defaultValue;
          const text = await res.text();
          return text ? JSON.parse(text) : defaultValue;
        } catch {
          return defaultValue;
        }
      }
    }

    async function writeJson(key, value) {
      try {
        const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const token = process.env.NETLIFY_API_TOKEN;
        const store = siteID && token
          ? getStore(STORE_NAME, { siteID, token, fetch: fetchImpl })
          : getStore(STORE_NAME);
        await store.setJSON(key, value);
      } catch (err) {
        const SITE_ID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const TOKEN = process.env.NETLIFY_API_TOKEN;
        if (!SITE_ID || !TOKEN) return;
        const base = `https://api.netlify.com/api/v1/blobs/${encodeURIComponent(SITE_ID)}/${encodeURIComponent(STORE_NAME)}`;
        // Use encodeURI so slashes in keys become path segments (folders)
        await fetchImpl(`${base}/${encodeURI(key)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
          body: JSON.stringify(value),
        });
      }
    }

    if (type === 'identify') {
      // Store per user: users/<userId>.json
      const userKey = `users/${encodeURIComponent(userId)}.json`;
      const existingUser = (await readJson(userKey, null)) || null;
      const firstSeen = existingUser && existingUser.firstSeen ? existingUser.firstSeen : nowIso;
      const sessions = (existingUser && existingUser.sessions) || {};
      if (sessionId) {
        sessions[sessionId] = nowIso;
      }
      await writeJson(userKey, { firstSeen, sessions });

      // Also update legacy aggregate users.json as a simple fallback (best-effort merge)
      const usersAggKey = 'users.json';
      const usersAgg = (await readJson(usersAggKey, {})) || {};
      usersAgg[userId] = { firstSeen, sessions };
      await writeJson(usersAggKey, usersAgg);
    } else if (type === 'image_generated') {
      // Store per user count: counts/<userId>.json
      const countKey = `counts/${encodeURIComponent(userId)}.json`;
      const current = await readJson(countKey, 0);
      const next = (typeof current === 'number' ? current : 0) + 1;
      await writeJson(countKey, next);

      // Also update legacy image_counts.json aggregate
      const countsAggKey = 'image_counts.json';
      const countsAgg = (await readJson(countsAggKey, {})) || {};
      countsAgg[userId] = (typeof countsAgg[userId] === 'number' ? countsAgg[userId] : 0) + 1;
      await writeJson(countsAggKey, countsAgg);
    } else {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Unknown type' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err && err.message ? err.message : 'Unknown error' }),
    };
  }
};


