// Debug database connection API endpoint
const { neon } = require('@neondatabase/serverless');

export default async function handler(req, res) {
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
    // Get DATABASE_URL from environment variables
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Check if DATABASE_URL is set
    if (!DATABASE_URL) {
      return res.status(500).json({
        error: 'DATABASE_URL environment variable is not set',
        timestamp: new Date().toISOString()
      });
    }
    
    // Connect to database
    const sql = neon(DATABASE_URL);
    
    // Test database connection with a simple query
    const result = await sql`SELECT NOW() as time`;
    
    // Check if high_scores table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    const tableExists = tableCheck[0].exists;
    
    // Create high_scores table if it doesn't exist
    if (!tableExists) {
      await sql`
        CREATE TABLE high_scores (
          id SERIAL PRIMARY KEY,
          player_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          level INTEGER NOT NULL,
          lines INTEGER NOT NULL,
          date TEXT NOT NULL
        )
      `;
    }
    
    // Get scores from database
    const scores = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC 
      LIMIT 10
    `;
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      databaseTime: result[0].time,
      tableExists: tableExists || 'Created now',
      scores: scores.map(row => ({
        name: row.player_name,
        score: row.score,
        level: row.level,
        lines: row.lines,
        date: row.date
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Return error response
    return res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
