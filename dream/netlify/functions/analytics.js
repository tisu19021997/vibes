// Minimal anonymous analytics using Netlify Blobs
// Tracks unique users (by anon userId) and per-user image counts
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
    const usersKey = 'users.json';
    const countsKey = 'image_counts.json';

    async function readJson(key, defaultValue) {
      try {
        const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const token = process.env.NETLIFY_API_TOKEN;
        const store = siteID && token
          ? getStore(STORE_NAME, { siteID, token, fetch: fetchImpl })
          : getStore(STORE_NAME);
        const data = await store.get(key, { type: 'json' });
        return data || defaultValue;
      } catch (err) {
        const SITE_ID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const TOKEN = process.env.NETLIFY_API_TOKEN;
        if (!SITE_ID || !TOKEN) return defaultValue;
        const base = `https://api.netlify.com/api/v1/blobs/${encodeURIComponent(SITE_ID)}/${encodeURIComponent(STORE_NAME)}`;
        try {
          const res = await fetchImpl(`${base}/${encodeURIComponent(key)}`);
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
        await fetchImpl(`${base}/${encodeURIComponent(key)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
          body: JSON.stringify(value),
        });
      }
    }

    const users = await readJson(usersKey, {});
    const counts = await readJson(countsKey, {});

    if (type === 'identify') {
      if (!users[userId]) {
        users[userId] = { firstSeen: nowIso, sessions: {} };
      }
      if (sessionId) {
        users[userId].sessions[sessionId] = nowIso;
      }
      await writeJson(usersKey, users);
    } else if (type === 'image_generated') {
      counts[userId] = (counts[userId] || 0) + 1;
      await writeJson(countsKey, counts);
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


