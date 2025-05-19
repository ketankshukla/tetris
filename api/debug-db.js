// This is a debug serverless function for Vercel
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Database connection string from environment variable
const DATABASE_URL = process.env.DATABASE_URL;

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

  // Debug information to return
  const debugInfo = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasDbUrl: !!DATABASE_URL,
      dbUrlFirstChars: DATABASE_URL ? DATABASE_URL.substring(0, 20) + '...' : 'not available'
    },
    database: {
      connected: false,
      error: null,
      scores: []
    }
  };

  try {
    // Test database connection
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL not found');
    }

    const sql = neon(DATABASE_URL);
    
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    debugInfo.database.tableExists = tableCheck[0].exists;
    
    // If table exists, get scores
    if (tableCheck[0].exists) {
      const scores = await sql`
        SELECT * FROM high_scores 
        ORDER BY score DESC 
        LIMIT 100
      `;
      
      debugInfo.database.connected = true;
      debugInfo.database.scores = scores.map(row => ({
        name: row.player_name,
        score: row.score,
        level: row.level,
        lines: row.lines,
        date: row.date
      }));
    } else {
      // Create the table
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
      
      debugInfo.database.connected = true;
      debugInfo.database.tableCreated = true;
    }
    
    return res.status(200).json(debugInfo);
  } catch (error) {
    debugInfo.database.error = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    return res.status(500).json(debugInfo);
  }
};
