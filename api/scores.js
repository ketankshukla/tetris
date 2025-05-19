// This is a serverless function for Vercel
const fs = require('fs');
const path = require('path');

// Helper to read the scores file
const getScores = () => {
  try {
    // In production, we'll need to use a database instead of the file system
    // This is just for local development
    const filePath = path.join(process.cwd(), 'scores.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scores:', error);
    return { highScores: [] };
  }
};

// Helper to write to the scores file
const saveScores = (scores) => {
  try {
    // In production, we'll need to use a database instead of the file system
    // This is just for local development
    const filePath = path.join(process.cwd(), 'scores.json');
    fs.writeFileSync(filePath, JSON.stringify({ highScores: scores }, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving scores:', error);
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
    const scores = getScores();
    res.status(200).json(scores);
    return;
  }

  // POST request - save scores
  if (req.method === 'POST') {
    try {
      const scores = req.body;
      const success = saveScores(scores);
      
      if (success) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ error: 'Failed to save scores' });
      }
    } catch (error) {
      console.error('Error in POST handler:', error);
      res.status(500).json({ error: 'Server error' });
    }
    return;
  }

  // If we get here, method not allowed
  res.status(405).json({ error: 'Method not allowed' });
};
