const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Database connection string from environment variable
const DATABASE_URL = process.env.DATABASE_URL;

// Helper to initialize the database
const initializeDatabase = async () => {
  if (!DATABASE_URL) {
    console.log('DATABASE_URL not found, skipping database initialization');
    return false;
  }

  try {
    const sql = neon(DATABASE_URL);
    
    // First check if the table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    // If table exists, check if we need to update it
    if (tableCheck[0].exists) {
      try {
        // Check if original_index column exists
        const columnCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'high_scores' AND column_name = 'original_index'
          );
        `;
        
        // Add the column if it doesn't exist
        if (!columnCheck[0].exists) {
          console.log('Adding original_index column to high_scores table');
          await sql`ALTER TABLE high_scores ADD COLUMN original_index INTEGER;`;
        }
      } catch (error) {
        console.error('Error checking/updating table structure:', error);
      }
    } else {
      // Create the table if it doesn't exist
      await sql`
        CREATE TABLE high_scores (
          id SERIAL PRIMARY KEY,
          player_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          level INTEGER NOT NULL,
          lines INTEGER NOT NULL,
          date TEXT NOT NULL,
          original_index INTEGER
        )
      `;
      console.log('Created high_scores table');
    }
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

// Helper to read scores from database
const getScoresFromDB = async () => {
  if (!DATABASE_URL) {
    console.log('DATABASE_URL not found, cannot get scores from database');
    return null;
  }

  try {
    const sql = neon(DATABASE_URL);
    
    // Get all scores ordered by score (descending)
    const scores = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC 
      LIMIT 100
    `;
    
    console.log('Raw scores from DB:', scores);
    
    // Transform to the expected format
    return {
      highScores: scores.map(row => ({
        name: row.player_name,
        score: row.score,
        level: row.level,
        lines: row.lines,
        date: row.date,
        originalIndex: row.original_index
      }))
    };
  } catch (error) {
    console.error('Error getting scores from database:', error);
    return null;
  }
};

// Helper to save scores to database
const saveScoresToDB = async (scores) => {
  if (!DATABASE_URL) {
    console.log('DATABASE_URL not found, cannot save scores to database');
    return false;
  }

  try {
    const sql = neon(DATABASE_URL);
    
    // Clear existing scores
    await sql`TRUNCATE TABLE high_scores`;
    
    // Insert all scores
    if (scores.length > 0) {
      console.log('Preparing to insert scores:', JSON.stringify(scores));
      
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
      
      console.log('Scores saved to database successfully');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving scores to database:', error);
    return false;
  }
};

// Helper to read the scores
const getScores = async () => {
  try {
    // Try to get scores from database first
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      const dbScores = await getScoresFromDB();
      if (dbScores) {
        console.log('Successfully read scores from database:', JSON.stringify(dbScores));
        return dbScores;
      }
    }
    
    // Fall back to file system for local development
    const filePath = path.join(process.cwd(), 'scores.json');
    
    try {
      // Try to read the file
      const data = await fs.readFile(filePath, 'utf8');
      console.log('Successfully read scores from file:', data);
      return JSON.parse(data);
    } catch (fileError) {
      console.log('Could not read from file:', fileError.message);
      
      // If file doesn't exist, create it with empty scores
      const defaultScores = { highScores: [] };
      try {
        await fs.writeFile(filePath, JSON.stringify(defaultScores, null, 2), 'utf8');
        console.log('Created new scores file');
        return defaultScores;
      } catch (writeError) {
        console.log('Could not create scores file:', writeError.message);
        return { highScores: [] };
      }
    }
  } catch (error) {
    console.error('Error in getScores:', error);
    return { highScores: [] };
  }
};

// Helper to save scores
const saveScores = async (scores) => {
  try {
    // Ensure scores is an array
    if (!Array.isArray(scores)) {
      console.error('Invalid scores format, expected array');
      return false;
    }
    
    // Log the incoming scores for debugging
    console.log('Received scores to save:', JSON.stringify(scores));
    
    // Create the data structure
    const data = { highScores: scores };
    
    // Try to save to database first
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      const dbSaveSuccess = await saveScoresToDB(scores);
      if (dbSaveSuccess) {
        console.log('Successfully saved scores to database');
        return true;
      }
    }
    
    // Fall back to file system for local development
    const filePath = path.join(process.cwd(), 'scores.json');
    
    try {
      // Write to file
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Successfully saved scores to file:', JSON.stringify(data));
      return true;
    } catch (fileError) {
      console.error('Could not write to file:', fileError.message);
      return false;
    }
  } catch (error) {
    console.error('Error in saveScores:', error);
    return false;
  }
};

// Endpoint to get high scores
app.get('/api/scores', async (req, res) => {
  try {
    console.log('Received GET request for scores');
    const scores = await getScores();
    console.log('Returning scores:', JSON.stringify(scores));
    res.status(200).json(scores);
  } catch (error) {
    console.error('Error in GET handler:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Endpoint to save high scores
app.post('/api/scores', async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('Received POST request with body:', JSON.stringify(req.body));
    
    // Validate the input
    if (!req.body || !Array.isArray(req.body)) {
      console.error('Invalid request body format');
      res.status(400).json({ error: 'Invalid request format. Expected array of scores.' });
      return;
    }
    
    const success = await saveScores(req.body);
    
    if (success) {
      // Get the scores again to confirm they were saved
      const scores = await getScores();
      console.log('Scores saved successfully, returning:', JSON.stringify(scores));
      res.status(200).json({ success: true, scores });
    } else {
      console.error('Failed to save scores');
      res.status(500).json({ error: 'Failed to save scores' });
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// For local development
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Tetris server running at http://localhost:${port}`);
});

// Export the Express API for Vercel
module.exports = app;
