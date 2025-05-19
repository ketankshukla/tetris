require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function clearAllScores() {
  try {
    console.log('Connecting to Neon database...');
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Clearing all scores from the database...');
    await sql`TRUNCATE TABLE high_scores`;
    console.log('All scores have been cleared successfully!');
    
    // Verify the database is empty
    const scores = await sql`SELECT * FROM high_scores`;
    console.log(`Database now contains ${scores.length} scores.`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

clearAllScores();
