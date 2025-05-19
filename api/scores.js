// This is a serverless function for Vercel
const fs = require('fs').promises;
const path = require('path');

// In-memory cache for scores when file system is not available
let scoresCache = { highScores: [] };

// Helper to read the scores file
const getScores = async () => {
  try {
    // In production on Vercel, we can't rely on the file system for persistence
    // So we'll use the in-memory cache if file operations fail
    const filePath = path.join(process.cwd(), 'scores.json');
    
    try {
      // Try to read the file
      const data = await fs.readFile(filePath, 'utf8');
      const scores = JSON.parse(data);
      // Update cache
      scoresCache = scores;
      console.log('Successfully read scores from file');
      return scores;
    } catch (fileError) {
      console.log('Could not read from file, using in-memory cache', fileError.message);
      
      // If file doesn't exist, try to create it with the current cache
      try {
        await fs.writeFile(filePath, JSON.stringify(scoresCache, null, 2), 'utf8');
        console.log('Created new scores file');
      } catch (writeError) {
        console.log('Could not create scores file', writeError.message);
      }
      
      return scoresCache;
    }
  } catch (error) {
    console.error('Error in getScores:', error);
    return scoresCache;
  }
};

// Helper to write to the scores file
const saveScores = async (scores) => {
  try {
    // Update in-memory cache first
    scoresCache.highScores = scores;
    
    // Then try to write to file
    const filePath = path.join(process.cwd(), 'scores.json');
    try {
      await fs.writeFile(filePath, JSON.stringify({ highScores: scores }, null, 2), 'utf8');
      console.log('Successfully saved scores to file');
      return true;
    } catch (fileError) {
      console.log('Could not write to file, using in-memory cache only', fileError.message);
      return true; // Return true anyway since we updated the cache
    }
  } catch (error) {
    console.error('Error in saveScores:', error);
    return false;
  }
};

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

  // GET request - return scores
  if (req.method === 'GET') {
    try {
      const scores = await getScores();
      res.status(200).json(scores);
    } catch (error) {
      console.error('Error in GET handler:', error);
      res.status(500).json({ error: 'Server error', message: error.message });
    }
    return;
  }

  // POST request - save scores
  if (req.method === 'POST') {
    try {
      const scores = req.body;
      const success = await saveScores(scores);
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to save scores' });
      }
    } catch (error) {
      console.error('Error in POST handler:', error);
      res.status(500).json({ error: 'Server error', message: error.message });
    }
    return;
  }

  // If we get here, method not allowed
  res.status(405).json({ error: 'Method not allowed' });
};
