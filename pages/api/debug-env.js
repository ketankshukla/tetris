// API route to debug environment variables and connectivity
export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Check for DATABASE_URL
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    // Return debug info
    return res.status(200).json({
      success: true,
      environment: process.env.NODE_ENV || 'not set',
      vercel: process.env.VERCEL === '1',
      databaseConfigured: hasDbUrl,
      // Don't include the actual DATABASE_URL for security reasons
      databaseUrlMasked: hasDbUrl ? '******' : null,
      timestamp: new Date().toISOString(),
      apiEndpoint: '/api/debug-env',
      host: req.headers.host,
      requestUrl: req.url
    });
  } catch (error) {
    console.error('Error in debug-env API:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}
