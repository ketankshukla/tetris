const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Endpoint to get high scores
app.get('/api/scores', (req, res) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'scores.json'), 'utf8');
    const scores = JSON.parse(data);
    res.json(scores);
  } catch (error) {
    console.error('Error reading scores:', error);
    res.status(500).json({ error: 'Failed to read scores' });
  }
});

// Endpoint to save high scores
app.post('/api/scores', (req, res) => {
  try {
    const scores = req.body;
    fs.writeFileSync(
      path.join(__dirname, 'scores.json'),
      JSON.stringify({ highScores: scores }, null, 2),
      'utf8'
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving scores:', error);
    res.status(500).json({ error: 'Failed to save scores' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Tetris server running at http://localhost:${port}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
