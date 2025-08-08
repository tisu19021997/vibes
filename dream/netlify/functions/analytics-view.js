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
    const allowed = { users: 'users.json', counts: 'image_counts.json' };
    const blobKey = allowed[keyParam];
    if (!blobKey) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Invalid key. Use ?key=users or ?key=counts' };
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
        return data || defaultValue;
      } catch (err) {
        const SITE_ID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
        const TOKEN = process.env.NETLIFY_API_TOKEN;
        if (!SITE_ID || !TOKEN) return defaultValue;
        const base = `https://api.netlify.com/api/v1/blobs/${encodeURIComponent(SITE_ID)}/${encodeURIComponent(STORE_NAME)}`;
        try {
          const res = await fetchImpl(`${base}/${encodeURIComponent(key)}`, {
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

    const data = (await readJson(blobKey, {})) || {};

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err && err.message ? err.message : 'Unknown error' }),
    };
  }
};

