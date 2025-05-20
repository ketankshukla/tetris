// Simplified scores API
const { neon } = require('@neondatabase/serverless');

export default async function handler(req, res) {
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
      console.error('DATABASE_URL not found in environment variables');
      return res.status(500).json({
        error: 'DATABASE_URL not found in environment variables'
      });
    }
    
    console.log('API route: /api/scores - Method:', req.method);
    
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
        date TEXT NOT NULL,
        original_index INTEGER
      )
    `;
    
    // GET request - return scores
    if (req.method === 'GET') {
      console.log('Processing GET request for scores');
      
      // Get scores from database
      const scores = await sql`
        SELECT * FROM high_scores 
        ORDER BY score DESC 
        LIMIT 100
      `;
      
      console.log(`Retrieved ${scores.length} scores from database`);
      
      // Return scores
      return res.status(200).json({
        highScores: scores.map(row => ({
          name: row.player_name,
          score: row.score,
          level: row.level,
          lines: row.lines,
          date: row.date,
          originalIndex: row.original_index
        }))
      });
    }
    
    // POST request - save scores
    if (req.method === 'POST') {
      console.log('Processing POST request for scores');
      
      // Validate request body
      let highScores = [];
      if (req.body && Array.isArray(req.body)) {
        console.log('Received scores in array format');
        highScores = req.body;
      } else if (req.body && Array.isArray(req.body.highScores)) {
        console.log('Received scores in {highScores: [...]} format');
        highScores = req.body.highScores;
      } else {
        console.error('Invalid request body format:', req.body);
        return res.status(400).json({
          error: 'Invalid request format',
          message: 'Expected array of scores or { highScores: [...] }'
        });
      }
      
      console.log(`Processing ${highScores.length} scores`);
      
      // Save each score, checking for duplicates
      for (let i = 0; i < highScores.length; i++) {
        const score = highScores[i];
        
        // Check if this score already exists in the database
        const existingScores = await sql`
          SELECT * FROM high_scores 
          WHERE player_name = ${score.name} 
          AND score = ${score.score} 
          AND level = ${score.level} 
          AND lines = ${score.lines} 
          AND date = ${score.date}
        `;
        
        if (existingScores.length === 0) {
          console.log(`Inserting new score for ${score.name}: ${score.score}`);
          await sql`
            INSERT INTO high_scores (
              player_name, 
              score, 
              level, 
              lines, 
              date,
              original_index
            ) VALUES (
              ${score.name}, 
              ${score.score}, 
              ${score.level}, 
              ${score.lines}, 
              ${score.date},
              ${score.originalIndex !== undefined ? score.originalIndex : i}
            )
          `;
        } else {
          console.log(`Score for ${score.name}: ${score.score} already exists, skipping`);
        }
      }
      
      // Get updated scores
      const updatedScores = await sql`
        SELECT * FROM high_scores 
        ORDER BY score DESC 
        LIMIT 100
      `;
      
      console.log(`Returning ${updatedScores.length} scores after update`);
      
      // Return success response
      return res.status(200).json({
        success: true,
        highScores: updatedScores.map(row => ({
          name: row.player_name,
          score: row.score,
          level: row.level,
          lines: row.lines,
          date: row.date,
          originalIndex: row.original_index
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
}
