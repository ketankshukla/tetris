// Direct database connection test
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
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

  try {
    // Get DATABASE_URL directly from environment
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Check if DATABASE_URL is set
    if (!DATABASE_URL) {
      return res.status(500).json({
        error: 'DATABASE_URL not found in environment variables',
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
    
    // Log the first few characters of the connection string for debugging
    console.log('Database connection string starts with:', DATABASE_URL.substring(0, 20) + '...');
    
    // Connect to database using the direct connection string
    const sql = neon(DATABASE_URL);
    
    // Execute a simple query to test connection
    const result = await sql`SELECT NOW() as time`;
    
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    const tableExists = tableCheck[0].exists;
    
    // If table exists, get scores
    let scores = [];
    if (tableExists) {
      scores = await sql`
        SELECT * FROM high_scores 
        ORDER BY score DESC 
        LIMIT 10
      `;
    }
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      time: result[0].time,
      tableExists,
      scores: scores.map(row => ({
        name: row.player_name,
        score: row.score,
        level: row.level,
        lines: row.lines
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Log the full error for debugging
    console.error('Database connection error:', error);
    
    // Return error response
    return res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};
