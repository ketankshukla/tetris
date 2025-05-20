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
        date TEXT NOT NULL
      )
    `;
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

async function getScoresFromDB() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Get scores from database
    const scores = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC 
      LIMIT 10
    `;
    
    return scores.map(row => ({
      name: row.player_name,
      score: row.score,
      level: row.level,
      lines: row.lines,
      date: row.date
    }));
  } catch (error) {
    console.error('Error getting scores from database:', error);
    return null;
  }
}

async function saveScoresToDB(scores) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
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
    
    return true;
  } catch (error) {
    console.error('Error saving scores to database:', error);
    return false;
  }
}

async function getScoresFromFile() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'scores.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scores from file:', error);
    return [];
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
    
    // Create table if it doesn't exist
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
});

// Debug database connection
app.get('/api/debug-db', async (req, res) => {
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
});

// Simple scores API
app.get('/api/simple-scores', async (req, res) => {
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
  } catch (error) {
    console.error('Error in scores API:', error);
    
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
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
  } catch (error) {
    console.error('Error in scores API:', error);
    
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// Endpoint to get high scores
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await getScores();
    res.status(200).json({ scores });
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

// Catch-all route to serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local development
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Tetris server running at http://localhost:${port}`);
});

// Export the Express API for Vercel
module.exports = app;
