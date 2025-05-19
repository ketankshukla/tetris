// This is a serverless function for Vercel
const fs = require('fs').promises;
const path = require('path');

// Helper to read the scores file
const getScores = async () => {
  try {
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

// Helper to write to the scores file
const saveScores = async (scores) => {
  try {
    const filePath = path.join(process.cwd(), 'scores.json');
    
    // Ensure scores is an array
    if (!Array.isArray(scores)) {
      console.error('Invalid scores format, expected array');
      return false;
    }
    
    // Create the data structure
    const data = { highScores: scores };
    
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
      console.log('Received GET request for scores');
      const scores = await getScores();
      console.log('Returning scores:', JSON.stringify(scores));
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
    return;
  }

  // If we get here, method not allowed
  res.status(405).json({ error: 'Method not allowed' });
};
