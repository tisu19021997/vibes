const { getStore } = require('@netlify/blobs');
const fetchImpl = global.fetch || require('node-fetch');

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'GET, OPTIONS', 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const keyParam = (event.queryStringParameters && event.queryStringParameters.key) || 'users';
    // Raw compatibility kept for old keys, but new implementation uses per-user blobs under users/ and counts/
    const allowed = { users: 'users', counts: 'counts', summary: true, stats: true };
    const isAllowed = Object.prototype.hasOwnProperty.call(allowed, keyParam);
    if (!isAllowed) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Invalid key. Use ?key=users, ?key=counts, or ?key=summary' };
    }

    const STORE_NAME = 'oneiroi-analytics';
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

    async function listKeys(prefix) {
      try {
        const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const token = process.env.NETLIFY_API_TOKEN;
        const store = siteID && token
          ? getStore(STORE_NAME, { siteID, token, fetch: fetchImpl })
          : getStore(STORE_NAME);
        if (typeof store.list !== 'function') throw new Error('list not supported');
        const items = [];
        for await (const entry of store.list({ prefix })) {
          items.push(entry);
        }
        // If bound listing returns nothing, try REST fallback
        if (items.length > 0) return items;
        throw new Error('empty-list');
      } catch (err) {
        const SITE_ID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const TOKEN = process.env.NETLIFY_API_TOKEN;
        if (!SITE_ID || !TOKEN) return [];
        const base = `https://api.netlify.com/api/v1/blobs/${encodeURIComponent(SITE_ID)}/${encodeURIComponent(STORE_NAME)}`;
        try {
          const res = await fetchImpl(`${base}?prefix=${encodeURIComponent(prefix)}`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
          });
          if (!res.ok) return [];
          const data = await res.json();
          // Expecting array of objects with key
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      }
    }

    // Summary/stats view: return aggregated totals
    if (keyParam === 'summary' || keyParam === 'stats') {
      // Prefer legacy aggregates for simplicity and compatibility
      const usersAgg = (await readJson('users.json', {})) || {};
      const countsAgg = (await readJson('image_counts.json', {})) || {};

      let totalUsers = Object.keys(usersAgg).length;
      // If legacy users.json is empty, fallback to folder listing
      if (totalUsers === 0) {
        const userEntries = await listKeys('users/');
        totalUsers = userEntries.length;
      }

      let totalImages = 0;
      if (countsAgg && typeof countsAgg === 'object') {
        for (const value of Object.values(countsAgg)) {
          totalImages += typeof value === 'number' ? value : 0;
        }
      }
      if (totalImages === 0) {
        const countEntries = await listKeys('counts/');
        for (const entry of countEntries) {
          const key = entry.key || entry?.blob?.key || entry?.name || '';
          if (!key) continue;
          const val = await readJson(key, 0);
          totalImages += typeof val === 'number' ? val : 0;
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ totalUsers, totalImages }),
      };
    }

    // Raw view for users or counts: list keys under the prefix and return index
    const prefix = allowed[keyParam];
    if (prefix === 'users' || prefix === 'counts') {
      const entries = await listKeys(`${prefix}/`);
      const index = {};
      for (const entry of entries) {
        const key = entry.key || entry?.blob?.key || entry?.name;
        if (!key) continue;
        index[key] = true;
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(index),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err && err.message ? err.message : 'Unknown error' }),
    };
  }
};

