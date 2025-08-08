// Streams image bytes from FLUX delivery host to the client to bypass CORS
exports.handler = async (event) => {
  try {
    const url = event.queryStringParameters && event.queryStringParameters.url;
    if (!url) {
      return { statusCode: 400, body: 'Missing url parameter' };
    }

    const parsed = new URL(url);
    const host = parsed.host.toLowerCase();
    const isAllowed = host === 'bfl.ai' || host.endsWith('.bfl.ai');
    if (!isAllowed) {
      return { statusCode: 400, body: 'Invalid host for image proxy' };
    }

    const upstream = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'image/png,image/jpeg,image/*' },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return { statusCode: upstream.status, body: text || 'Failed to fetch image' };
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await upstream.arrayBuffer();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      body: Buffer.from(arrayBuffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: `Proxy error: ${err && err.message ? err.message : 'Unknown error'}` };
  }
};


