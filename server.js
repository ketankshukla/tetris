// Simple Express server for Tetris game
const express = require('express');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
const fs = require('fs').promises;
require('dotenv').config(); // Load environment variables from .env file

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
    
    console.log('Initializing database connection...');
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
    
    console.log('Database initialized successfully');
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
    throw error; // Propagate the error to be handled by the caller
  }
}

async function saveScoresToDB(scores) {
  try {
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not found, cannot save scores to database');
      throw new Error('DATABASE_URL not found in environment variables');
    }

    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Saving scores to database...');
    
    // Insert all scores without clearing existing ones
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
          throw insertError;
        }
      }
      
      console.log('All scores saved to database successfully');
    } else {
      console.log('No scores to save');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving scores to database:', error);
    throw error; // Propagate the error to be handled by the caller
  }
}

async function getScores() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    return await getScoresFromDB();
  } catch (error) {
    console.error('Error getting scores:', error);
    throw error; // Propagate the error to be handled by the caller
  }
}

async function saveScores(scores) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    return await saveScoresToDB(scores);
  } catch (error) {
    console.error('Error saving scores:', error);
    throw error; // Propagate the error to be handled by the caller
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
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('DATABASE_URL not found in environment variables');
      return res.status(500).json({
        error: 'Database configuration error',
        message: 'DATABASE_URL not found in environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    // Initialize database if needed
    await initializeDatabase();
    
    try {
      // Get scores from database
      const mappedScores = await getScoresFromDB();
      console.log(`Retrieved ${mappedScores.length} scores from database for /api/simple-scores endpoint`);
      
      return res.status(200).json({ 
        highScores: mappedScores, 
        source: 'database',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Error getting scores from database:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in /api/simple-scores endpoint:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/simple-scores', async (req, res) => {
  try {
    // Validate request body
    if (!req.body || !Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Invalid request body',
        message: 'Request body must be an array of score objects',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('API call: /api/simple-scores (POST)');
    console.log(`Received ${req.body.length} scores`);
    
    // Get DATABASE_URL directly from environment
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error('DATABASE_URL not found in environment variables');
      return res.status(500).json({
        error: 'Database configuration error',
        message: 'DATABASE_URL not found in environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    // Initialize database if needed
    await initializeDatabase();
    
    // Save scores to database
    try {
      await saveScoresToDB(req.body);
      console.log('Scores saved to database successfully');
      
      return res.status(200).json({
        message: 'Scores saved successfully',
        count: req.body.length,
        source: 'database',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Error saving scores to database:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in POST /api/simple-scores endpoint:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add a new endpoint for /api/scores that matches what the client expects
app.get('/api/scores', async (req, res) => {
  try {
    console.log('API call: /api/scores (GET)');
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in environment variables');
      return res.status(500).json({ 
        error: 'Database configuration error', 
        message: 'DATABASE_URL not found in environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    // Initialize database if needed
    await initializeDatabase();
    
    // Get scores from database
    const scores = await getScoresFromDB();
    console.log(`Retrieved ${scores.length} scores from database for /api/scores endpoint`);
    
    // Return the scores in the format expected by the client
    return res.status(200).json({ highScores: scores });
  } catch (error) {
    console.error('Error in /api/scores endpoint:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint to save high scores
app.post('/api/scores', async (req, res) => {
  try {
    // Log the request body for debugging
    console.log('API call: /api/scores (POST)');
    console.log('Received POST request with body:', JSON.stringify(req.body));
    
    // Validate the input
    if (!req.body || !Array.isArray(req.body.highScores)) {
      console.error('Invalid request body format');
      return res.status(400).json({ 
        error: 'Invalid request format', 
        message: 'Expected { highScores: [...] }',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in environment variables');
      return res.status(500).json({ 
        error: 'Database configuration error', 
        message: 'DATABASE_URL not found in environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    // Initialize database if needed
    await initializeDatabase();
    
    try {
      // Save the scores to the database
      await saveScoresToDB(req.body.highScores);
      
      // Get the updated scores to confirm they were saved
      const scores = await getScoresFromDB();
      console.log(`Scores saved successfully, returning ${scores.length} scores`);
      
      return res.status(200).json({ 
        success: true, 
        highScores: scores,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        message: dbError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in POST /api/scores handler:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Add a new endpoint for vercel debugging
app.get('/api/vercel-debug', async (req, res) => {
  try {
    console.log('API call: /api/vercel-debug (GET)');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Check if DATABASE_URL is set
    const dbUrlExists = !!process.env.DATABASE_URL;
    
    // Get database info without exposing credentials
    let dbInfo = null;
    if (dbUrlExists) {
      try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        dbInfo = {
          protocol: dbUrl.protocol,
          host: dbUrl.host,
          pathname: dbUrl.pathname,
          username: dbUrl.username,
          // Don't include password
        };
      } catch (e) {
        dbInfo = { error: 'Invalid DATABASE_URL format' };
      }
    }
    
    // Try to connect to the database and get scores
    let dbConnection = false;
    let scores = [];
    let error = null;
    
    if (dbUrlExists) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        
        // Test connection
        await sql`SELECT 1 as test`;
        dbConnection = true;
        
        // Get scores
        scores = await sql`
          SELECT 
            player_name as name, 
            score, 
            level, 
            lines, 
            date
          FROM high_scores 
          ORDER BY score DESC
        `;
      } catch (err) {
        error = {
          message: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : null
        };
      }
    }
    
    // Return debug info
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'not set',
      databaseConfigured: dbUrlExists,
      databaseInfo: dbInfo,
      databaseConnected: dbConnection,
      scoresCount: scores.length,
      scores: scores,
      error: error
    });
  } catch (error) {
    console.error('Error in /api/vercel-debug:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
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
