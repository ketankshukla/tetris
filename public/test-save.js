require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function testSaveScore() {
  try {
    console.log('Connecting to Neon database...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Test score
    const testScore = {
      name: "Test User",
      score: 500,
      level: 3,
      lines: 10,
      date: new Date().toLocaleString()
    };
    
    console.log('Saving test score:', testScore);
    
    // Clear existing scores
    await sql`TRUNCATE TABLE high_scores`;
    
    // Insert test score
    await sql`
      INSERT INTO high_scores (
        player_name, 
        score, 
        level, 
        lines, 
        date
      ) VALUES (
        ${testScore.name}, 
        ${testScore.score}, 
        ${testScore.level}, 
        ${testScore.lines}, 
        ${testScore.date}
      )
    `;
    
    console.log('Test score saved successfully!');
    
    // Verify score was saved
    const scores = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC
    `;
    
    console.log('Scores in database:', scores);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSaveScore();
