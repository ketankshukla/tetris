require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function viewScores() {
  try {
    console.log('Connecting to Neon database...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Get all scores ordered by score (descending)
    const scores = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC
    `;
    
    if (scores.length === 0) {
      console.log('No scores found in the database.');
    } else {
      console.log(`Found ${scores.length} scores in the database:`);
      console.log('---------------------------------------------');
      console.log('| RANK | PLAYER NAME        | SCORE  | LEVEL | LINES | DATE                |');
      console.log('---------------------------------------------');
      
      scores.forEach((score, index) => {
        const dateStr = score.date ? score.date.toString() : 'N/A';
        console.log(
          `| ${(index + 1).toString().padEnd(4)} | ${score.player_name.toString().padEnd(18)} | ${score.score.toString().padEnd(6)} | ${score.level.toString().padEnd(5)} | ${score.lines.toString().padEnd(5)} | ${dateStr.padEnd(20)} |`
        );
      });
      
      console.log('---------------------------------------------');
    }
    
    // Ask if user wants to clear test data
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Do you want to clear the test data? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          await sql`DELETE FROM high_scores WHERE player_name = 'Test Player'`;
          console.log('Test data cleared successfully.');
        } catch (error) {
          console.error('Error clearing test data:', error);
        }
      }
      readline.close();
    });
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

viewScores();
