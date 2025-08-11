// Uploads a data URL or base64 image to Cloudinary and returns the secure URL
// Requires env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (or CLOUDINARY_URL)
const cloudinary = require('cloudinary').v2;

// Configure from environment (Netlify env variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
    const { dataUrl, folder = 'oneiroi/dreams', publicId, context, metadata } = JSON.parse(event.body || '{}');

    if (!dataUrl || typeof dataUrl !== 'string') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing or invalid dataUrl' }),
      };
    }

    // Upload the data URL directly; Cloudinary supports data URI uploads
    const mergedContext = {
      ...(context && typeof context === 'object' ? context : {}),
      ...(metadata && typeof metadata === 'object' ? metadata : {}),
    };

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder,
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      // Ensure PNG output consistent with generator
      format: 'png',
      // Tag with optional context for analytics (userId/sessionId)
      context: Object.keys(mergedContext).length ? mergedContext : undefined,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        context: result.context,
        // Some metadata may be exposed via context.custom in Cloudinary
        metadata: result.metadata,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err && err.message ? err.message : 'Unknown error' }),
    };
  }
};


