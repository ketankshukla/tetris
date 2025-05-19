// Environment variables check endpoint
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'set (first 10 chars: ' + process.env.DATABASE_URL.substring(0, 10) + '...)' : 'not set',
    allEnvKeys: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASSWORD')),
  };

  return res.status(200).json({
    message: 'Environment check',
    environment: envInfo,
    timestamp: new Date().toISOString()
  });
}
