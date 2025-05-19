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
      ORDER BY score DESC
    `;
    
    // Display the records
    console.log('\n===== HIGH SCORES =====');
    console.log('Total records:', scores.length);
    console.log('----------------------');
    
    if (scores.length === 0) {
      console.log('No high scores found in the database.');
    } else {
      // Format and display each record
      scores.forEach((score, index) => {
        console.log(`${index + 1}. ${score.player_name}: ${score.score} points (Level: ${score.level}, Lines: ${score.lines}, Date: ${score.date})`);
      });
    }
    
    console.log('======================\n');
    
    // Display table structure
    console.log('Table structure:');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'high_scores'
    `;
    
    columns.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

// Run the function
viewDatabaseRecords();
