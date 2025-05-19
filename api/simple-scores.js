// Simplified scores API
const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get DATABASE_URL directly from environment
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Check if DATABASE_URL is set
    if (!DATABASE_URL) {
      return res.status(500).json({
        error: 'DATABASE_URL not found in environment variables'
      });
    }
    
    // Connect to database
    const sql = neon(DATABASE_URL);
    
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS high_scores (
        id SERIAL PRIMARY KEY,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        level INTEGER NOT NULL,
        lines INTEGER NOT NULL,
        date TEXT NOT NULL
      )
    `;
    
    // GET request - return scores
    if (req.method === 'GET') {
      // Get scores from database
      const scores = await sql`
        SELECT * FROM high_scores 
        ORDER BY score DESC 
        LIMIT 100
      `;
      
      // Return scores
      return res.status(200).json({
        highScores: scores.map(row => ({
          name: row.player_name,
          score: row.score,
          level: row.level,
          lines: row.lines,
          date: row.date
        }))
      });
    }
    
    // POST request - save scores
    if (req.method === 'POST') {
      // Validate request body
      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({
          error: 'Invalid request format. Expected array of scores.'
        });
      }
      
      const scores = req.body;
      
      // Clear existing scores
      await sql`TRUNCATE TABLE high_scores`;
      
      // Insert new scores
      if (scores.length > 0) {
        for (const score of scores) {
          await sql`
            INSERT INTO high_scores (
              player_name, 
              score, 
              level, 
              lines, 
              date
            ) VALUES (
              ${score.name}, 
              ${score.score}, 
              ${score.level}, 
              ${score.lines}, 
              ${score.date}
            )
          `;
        }
      }
      
      // Get updated scores
      const updatedScores = await sql`
        SELECT * FROM high_scores 
        ORDER BY score DESC 
        LIMIT 100
      `;
      
      // Return success response
      return res.status(200).json({
        success: true,
        highScores: updatedScores.map(row => ({
          name: row.player_name,
          score: row.score,
          level: row.level,
          lines: row.lines,
          date: row.date
        }))
      });
    }
    
    // Method not allowed
    return res.status(405).json({
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('Error in scores API:', error);
    
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};
