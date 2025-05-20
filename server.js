// Simple Express server for Tetris game
const express = require('express');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
const fs = require('fs').promises;

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Database functions
async function initializeDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in environment variables');
      return false;
    }

    const sql = neon(process.env.DATABASE_URL);
    
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
    
    // Update schema if needed
    await updateDatabaseSchema();
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

async function updateDatabaseSchema() {
  try {
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not found, skipping schema update');
      return false;
    }

    const sql = neon(process.env.DATABASE_URL);
    
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
      console.log('Column added successfully');
    } else {
      console.log('original_index column already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating database schema:', error);
    return false;
  }
}

async function getScoresFromDB() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Get scores from database
    const scores = await sql`
      SELECT 
        player_name as name, 
        score, 
        level, 
        lines, 
        date,
        original_index
      FROM high_scores 
      ORDER BY score DESC 
      LIMIT 100
    `;
    
    console.log(`Retrieved ${scores.length} scores from database`);
    if (scores.length > 0) {
      console.log('First score:', JSON.stringify(scores[0]));
    }
    
    // Map scores to the expected format
    return scores.map(row => ({
      name: row.name,
      score: row.score,
      level: row.level,
      lines: row.lines,
      date: row.date ? row.date.toString() : 'N/A',
      originalIndex: row.original_index
    }));
  } catch (error) {
    console.error('Error getting scores from database:', error);
    return null;
  }
}

async function saveScoresToDB(scores) {
  try {
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not found, cannot save scores to database');
      return false;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Saving scores to database...');
    
    // Clear existing scores
    await sql`TRUNCATE TABLE high_scores`;
    console.log('Cleared existing scores');
    
    // Insert all scores
    if (scores && scores.length > 0) {
      console.log(`Inserting ${scores.length} scores`);
      
      for (let i = 0; i < scores.length; i++) {
        const score = scores[i];
        try {
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
        } catch (insertError) {
          console.error('Error inserting score:', insertError);
        }
      }
      
      console.log('All scores saved to database successfully');
    } else {
      console.log('No scores to save');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving scores to database:', error);
    return false;
  }
}

async function getScoresFromFile() {
  try {
    // Check if scores.json exists
    try {
      await fs.access(path.join(__dirname, 'scores.json'));
    } catch (error) {
      // Create scores.json with default data if it doesn't exist
      const defaultScores = {
        highScores: [
          {
            name: "Test Player",
            score: 1000,
            level: 10,
            lines: 100,
            date: new Date().toLocaleString()
          }
        ]
      };
      await fs.writeFile(
        path.join(__dirname, 'scores.json'),
        JSON.stringify(defaultScores, null, 2),
        'utf8'
      );
      console.log('Created default scores.json file');
    }
    
    // Read scores from file
    const data = await fs.readFile(path.join(__dirname, 'scores.json'), 'utf8');
    const parsedData = JSON.parse(data);
    
    // Check if the data has the expected structure
    if (parsedData.highScores && Array.isArray(parsedData.highScores)) {
      return parsedData.highScores;
    } else if (Array.isArray(parsedData)) {
      return parsedData;
    } else {
      console.log('Unexpected data structure in scores.json, creating default');
      return [
        {
          name: "Test Player",
          score: 1000,
          level: 10,
          lines: 100,
          date: new Date().toLocaleString()
        }
      ];
    }
  } catch (error) {
    console.error('Error reading scores from file:', error);
    return [
      {
        name: "Default Player",
        score: 500,
        level: 5,
        lines: 50,
        date: new Date().toLocaleString()
      }
    ];
  }
}

async function saveScoresToFile(scores) {
  try {
    await fs.writeFile(
      path.join(__dirname, 'scores.json'),
      JSON.stringify(scores, null, 2),
      'utf8'
    );
    return true;
  } catch (error) {
    console.error('Error saving scores to file:', error);
    return false;
  }
}

async function getScores() {
  try {
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      const dbScores = await getScoresFromDB();
      if (dbScores) {
        return dbScores;
      }
    }
    
    // Fallback to file
    return await getScoresFromFile();
  } catch (error) {
    console.error('Error getting scores:', error);
    return [];
  }
}

async function saveScores(scores) {
  try {
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      const dbSaveSuccess = await saveScoresToDB(scores);
      if (dbSaveSuccess) {
        return true;
      }
    }
    
    // Fallback to file
    return await saveScoresToFile(scores);
  } catch (error) {
    console.error('Error saving scores:', error);
    return false;
  }
}

// API Routes
// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// Environment variables check endpoint
app.get('/api/env-check', (req, res) => {
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'set (first 10 chars: ' + process.env.DATABASE_URL.substring(0, 10) + '...)' : 'not set',
    allEnvKeys: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASSWORD')),
  };

  res.status(200).json({
    message: 'Environment check',
    environment: envInfo,
    timestamp: new Date().toISOString()
  });
});

// Direct database connection test
app.get('/api/direct-db', async (req, res) => {
  try {
    console.log('API call: /api/direct-db (GET)');
    
    // Get DATABASE_URL directly from environment
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Check if DATABASE_URL is set
    if (!DATABASE_URL) {
      console.error('DATABASE_URL not found in environment variables');
      return res.status(500).json({
        error: 'DATABASE_URL not found in environment variables',
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Database URL is set, connecting to database...');
    
    // Connect to database using the direct connection string
    const sql = neon(DATABASE_URL);
    
    // Execute a simple query to test connection
    console.log('Testing database connection...');
    const result = await sql`SELECT NOW() as time`;
    console.log('Database connection successful, time:', result[0].time);
    
    // Check if table exists
    console.log('Checking if high_scores table exists...');
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    const tableExists = tableCheck[0].exists;
    console.log('Table exists:', tableExists);
    
    // Create table if it doesn't exist
    if (!tableExists) {
      console.log('Creating high_scores table...');
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
      console.log('Table created successfully');
    }
    
    // Check if original_index column exists
    console.log('Checking if original_index column exists...');
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'high_scores' AND column_name = 'original_index'
      );
    `;
    
    const columnExists = columnCheck[0].exists;
    console.log('original_index column exists:', columnExists);
    
    // Add the column if it doesn't exist
    if (!columnExists) {
      console.log('Adding original_index column to high_scores table...');
      await sql`ALTER TABLE high_scores ADD COLUMN original_index INTEGER;`;
      console.log('Column added successfully');
    }
    
    // Get scores from database
    console.log('Executing query to get high scores...');
    const scores = await sql`
      SELECT 
        player_name as name, 
        score, 
        level, 
        lines, 
        date,
        original_index
      FROM high_scores 
      ORDER BY score DESC 
      LIMIT 10
    `;
    
    console.log(`Query executed, found ${scores.length} scores`);
    console.log('First score (if any):', scores.length > 0 ? JSON.stringify(scores[0]) : 'No scores found');
    
    // Map the scores to the expected format
    const mappedScores = scores.map((row, index) => ({
      name: row.name,
      score: row.score,
      level: row.level,
      lines: row.lines,
      date: row.date ? row.date.toString() : 'N/A',
      originalIndex: row.original_index !== null ? row.original_index : index
    }));
    
    console.log('Mapped scores:', JSON.stringify(mappedScores));
    
    // Return success response
    console.log('Sending response...');
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      databaseTime: result[0].time,
      tableExists: tableExists || 'Created now',
      columnExists: columnExists || 'Added now',
      scores: mappedScores,
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
});

// Debug database connection
app.get('/api/debug-db', async (req, res) => {
  try {
    console.log('API call: /api/debug-db (GET)');
    
    // Get DATABASE_URL from environment variables
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Check if DATABASE_URL is set
    if (!DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return res.status(500).json({
        error: 'DATABASE_URL environment variable is not set',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Database URL is set, connecting to database...');
    
    // Connect to database
    const sql = neon(DATABASE_URL);
    
    // Test database connection with a simple query
    console.log('Testing database connection...');
    const result = await sql`SELECT NOW() as time`;
    console.log('Database connection successful, time:', result[0].time);
    
    // Get scores from database
    console.log('Executing query to get high scores...');
    const scores = await sql`
      SELECT player_name as name, score, level, lines, date 
      FROM high_scores 
      ORDER BY score DESC 
      LIMIT 10
    `;
    
    console.log(`Query executed, found ${scores.length} scores`);
    console.log('First score (if any):', scores.length > 0 ? JSON.stringify(scores[0]) : 'No scores found');
    
    // Map the scores to the expected format
    const mappedScores = scores.map(row => ({
      name: row.name,
      score: row.score,
      level: row.level,
      lines: row.lines,
      date: row.date ? row.date.toString() : 'N/A'
    }));
    
    console.log('Mapped scores:', JSON.stringify(mappedScores));
    
    // Return success response
    console.log('Sending response...');
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      databaseTime: result[0].time,
      scores: mappedScores,
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
});

// Simple scores API
app.get('/api/simple-scores', async (req, res) => {
  try {
    console.log('API call: /api/simple-scores (GET)');
    
    // Get DATABASE_URL directly from environment
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Check if DATABASE_URL is set
    if (!DATABASE_URL) {
      console.log('DATABASE_URL not found, using file-based scores');
      const fileScores = await getScoresFromFile();
      
      console.log(`Found ${fileScores.length} scores in file`);
      console.log('First score (if any):', fileScores.length > 0 ? JSON.stringify(fileScores[0]) : 'No scores found');
      
      return res.status(200).json({
        highScores: fileScores.map((score, index) => ({
          ...score,
          originalIndex: score.originalIndex !== undefined ? score.originalIndex : index
        })),
        source: 'file'
      });
    }
    
    console.log('Database URL is set, connecting to database...');
    
    // Connect to database
    const sql = neon(DATABASE_URL);
    
    // Get scores from database
    console.log('Executing query to get high scores...');
    const scores = await sql`
      SELECT 
        player_name as name, 
        score, 
        level, 
        lines, 
        date,
        original_index
      FROM high_scores 
      ORDER BY score DESC 
      LIMIT 100
    `;
    
    console.log(`Query executed, found ${scores.length} scores`);
    console.log('First score (if any):', scores.length > 0 ? JSON.stringify(scores[0]) : 'No scores found');
    
    // Map scores to the expected format
    const mappedScores = scores.map((row, index) => ({
      name: row.name,
      score: row.score,
      level: row.level,
      lines: row.lines,
      date: row.date ? row.date.toString() : 'N/A',
      originalIndex: row.original_index !== null ? row.original_index : index
    }));
    
    console.log('Mapped scores:', JSON.stringify(mappedScores));
    
    // Return scores
    console.log('Sending response...');
    return res.status(200).json({
      highScores: mappedScores,
      source: 'database'
    });
  } catch (error) {
    console.error('Error in scores API:', error);
    
    // Try to get scores from file as fallback
    try {
      const fileScores = await getScoresFromFile();
      return res.status(200).json({
        highScores: fileScores.map((score, index) => ({
          ...score,
          originalIndex: score.originalIndex !== undefined ? score.originalIndex : index
        })),
        source: 'file (fallback)',
        error: error.message
      });
    } catch (fallbackError) {
      return res.status(500).json({
        error: 'Server error',
        message: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
});

app.post('/api/simple-scores', async (req, res) => {
  try {
    // Validate request body
    if (!req.body || !Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Invalid request format. Expected array of scores.'
      });
    }
    
    const scores = req.body;
    
    // Get DATABASE_URL directly from environment
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Check if DATABASE_URL is set
    if (!DATABASE_URL) {
      console.log('DATABASE_URL not found, using file-based scores');
      const fileSaveSuccess = await saveScoresToFile(scores);
      
      if (fileSaveSuccess) {
        return res.status(200).json({
          success: true,
          source: 'file'
        });
      } else {
        return res.status(500).json({
          error: 'Failed to save scores to file'
        });
      }
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
        date TEXT NOT NULL,
        original_index INTEGER
      )
    `;
    
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
            date,
            original_index
          ) VALUES (
            ${score.name}, 
            ${score.score}, 
            ${score.level}, 
            ${score.lines}, 
            ${score.date},
            ${score.originalIndex !== undefined ? score.originalIndex : null}
          )
        `;
      }
    }
    
    // Get updated scores
    const updatedScores = await sql`
      SELECT player_name as name, score, level, lines, date 
      FROM high_scores 
      ORDER BY score DESC 
      LIMIT 100
    `;
    
    // Return success response
    return res.status(200).json({
      success: true,
      highScores: updatedScores.map(row => ({
        name: row.name,
        score: row.score,
        level: row.level,
        lines: row.lines,
        date: row.date ? row.date.toString() : 'N/A'
      })),
      source: 'database'
    });
  } catch (error) {
    console.error('Error in scores API:', error);
    
    // Try to save scores to file as fallback
    try {
      const fileSaveSuccess = await saveScoresToFile(req.body);
      if (fileSaveSuccess) {
        return res.status(200).json({
          success: true,
          source: 'file (fallback)',
          error: error.message
        });
      } else {
        return res.status(500).json({
          error: 'Server error',
          message: error.message,
          fallbackError: 'Failed to save scores to file'
        });
      }
    } catch (fallbackError) {
      return res.status(500).json({
        error: 'Server error',
        message: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
});

// Add a new endpoint for /api/scores that matches what the client expects
app.get('/api/scores', async (req, res) => {
  try {
    console.log('API call: /api/scores (GET)');
    
    let scores = [];
    let source = 'unknown';
    
    // Try to get scores from database first
    if (process.env.DATABASE_URL) {
      try {
        const dbScores = await getScoresFromDB();
        if (dbScores && dbScores.length > 0) {
          scores = dbScores;
          source = 'database';
          console.log(`Retrieved ${scores.length} scores from database`);
        }
      } catch (dbError) {
        console.error('Error getting scores from database:', dbError);
      }
    }
    
    // Fall back to file if database failed or returned no scores
    if (scores.length === 0) {
      try {
        const fileScores = await getScoresFromFile();
        if (fileScores && fileScores.length > 0) {
          scores = fileScores.map((score, index) => ({
            name: score.name,
            score: score.score,
            level: score.level,
            lines: score.lines,
            date: score.date,
            originalIndex: score.originalIndex !== undefined ? score.originalIndex : index
          }));
          source = 'file';
          console.log(`Retrieved ${scores.length} scores from file`);
        }
      } catch (fileError) {
        console.error('Error getting scores from file:', fileError);
      }
    }
    
    // Return the scores in the format expected by the client
    return res.status(200).json({ scores: { highScores: scores } });
  } catch (error) {
    console.error('Error in /api/scores endpoint:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
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

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local development
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Tetris server running at http://localhost:${port}`);
});

// Export the Express API for Vercel
module.exports = app;
