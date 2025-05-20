// Script to view records in the Neon database
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function viewDatabaseRecords() {
  try {
    console.log('Connecting to Neon database...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL environment variable is not set.');
      console.log('Make sure you have a .env file with DATABASE_URL or set it in your environment.');
      process.exit(1);
    }
    
    // Connect to database
    const sql = neon(process.env.DATABASE_URL);
    console.log('Connected to database.');
    
    // Check if high_scores table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    const tableExists = tableCheck[0].exists;
    
    if (!tableExists) {
      console.log('The high_scores table does not exist in the database.');
      process.exit(0);
    }
    
    // Get all records from high_scores table
    console.log('Retrieving high scores...');
    const scores = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC, id ASC
    `;
    
    // Display the records
    console.log('\n===== HIGH SCORES =====');
    console.log('Total records:', scores.length);
    console.log('----------------------');
    
    if (scores.length === 0) {
      console.log('No high scores found in the database.');
    } else {
      // Format and display each record in the same format as the high scores table
      scores.forEach((score) => {
        // Format the date to match the display format in the high scores table
        const date = new Date(score.date);
        const formattedDate = date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        
        console.log(`${score.player_name}\t${score.score}\t${score.level}\t${score.lines}\t${formattedDate}`);
      });
    }
    
    console.log('======================\n');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

// Run the function
viewDatabaseRecords();
