// This is a serverless function for Vercel
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Database connection string from environment variable
const DATABASE_URL = process.env.DATABASE_URL;

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check if we have a database URL
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not found');
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  try {
    const sql = neon(DATABASE_URL);
    
    // GET request - return scores
    if (req.method === 'GET') {
      console.log('Received GET request for scores');
      
      try {
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
        
        // Get scores from database
        const dbScores = await sql`
          SELECT * FROM high_scores 
          ORDER BY score DESC 
          LIMIT 100
        `;
        
        console.log('Raw scores from DB:', dbScores);
        
        // Transform to the expected format
        const scores = {
          highScores: dbScores.map(row => ({
            name: row.player_name,
            score: row.score,
            level: row.level,
            lines: row.lines,
            date: row.date
          }))
        };
        
        console.log('Returning scores:', JSON.stringify(scores));
        return res.status(200).json(scores);
      } catch (error) {
        console.error('Error getting scores:', error);
        return res.status(500).json({ error: 'Failed to get scores', details: error.message });
      }
    }
    
    // POST request - save scores
    if (req.method === 'POST') {
      console.log('Received POST request');
      
      try {
        // Validate the input
        if (!req.body || !Array.isArray(req.body)) {
          console.error('Invalid request body format');
          return res.status(400).json({ error: 'Invalid request format. Expected array of scores.' });
        }
        
        const scores = req.body;
        console.log('Scores to save:', JSON.stringify(scores));
        
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
        
        // Clear existing scores
        await sql`TRUNCATE TABLE high_scores`;
        
        // Insert all scores
        if (scores.length > 0) {
          for (const score of scores) {
            try {
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
            } catch (insertError) {
              console.error('Error inserting score:', insertError);
            }
          }
        }
        
        // Get the updated scores
        const dbScores = await sql`
          SELECT * FROM high_scores 
          ORDER BY score DESC 
          LIMIT 100
        `;
        
        const updatedScores = {
          highScores: dbScores.map(row => ({
            name: row.player_name,
            score: row.score,
            level: row.level,
            lines: row.lines,
            date: row.date
          }))
        };
        
        console.log('Scores saved successfully');
        return res.status(200).json({ success: true, scores: updatedScores });
      } catch (error) {
        console.error('Error saving scores:', error);
        return res.status(500).json({ error: 'Failed to save scores', details: error.message });
      }
    }
    
    // If we get here, method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
