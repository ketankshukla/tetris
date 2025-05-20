/**
 * Remove Test Records
 * 
 * This utility removes test records from the high scores database.
 * It identifies test records based on common test names and patterns.
 */

require('dotenv').config();
const postgres = require('postgres');

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not defined.');
  console.error('Please create a .env file with your DATABASE_URL.');
  process.exit(1);
}

// Initialize the SQL client
let sql;
try {
  sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
  console.log('Database connection established.');
} catch (error) {
  console.error('Failed to connect to the database:', error.message);
  process.exit(1);
}

// Common test names and patterns to identify test records
const testPatterns = [
  'test',
  'Test',
  'TEST',
  'sample',
  'Sample',
  'SAMPLE',
  'demo',
  'Demo',
  'DEMO',
  'example',
  'Example',
  'EXAMPLE',
  'dummy',
  'Dummy',
  'DUMMY',
  'temp',
  'Temp',
  'TEMP'
];

async function removeTestRecords() {
  try {
    console.log('Checking for test records...');
    
    // Create a SQL pattern for LIKE queries
    const likePatterns = testPatterns.map(pattern => `player_name LIKE '%${pattern}%'`).join(' OR ');
    
    // First, get the count of records that will be removed
    const countResult = await sql`
      SELECT COUNT(*) FROM high_scores
      WHERE ${sql.unsafe(likePatterns)}
    `;
    
    const count = parseInt(countResult[0].count, 10);
    
    if (count === 0) {
      console.log('No test records found in the database.');
      return;
    }
    
    console.log(`Found ${count} test records to remove.`);
    
    // Get the records that will be removed (for display)
    const recordsToRemove = await sql`
      SELECT id, player_name, score, level, lines, date
      FROM high_scores
      WHERE ${sql.unsafe(likePatterns)}
      ORDER BY score DESC
    `;
    
    console.log('\nTest records to be removed:');
    console.log('----------------------------');
    recordsToRemove.forEach((record, index) => {
      console.log(`${index + 1}. ${record.player_name} - Score: ${record.score}, Level: ${record.level}, Lines: ${record.lines}, Date: ${record.date}`);
    });
    
    // Ask for confirmation before proceeding
    console.log('\nAre you sure you want to remove these test records? (y/n)');
    
    // Since we're in a Node.js script, we need to handle user input
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Remove the test records
        const result = await sql`
          DELETE FROM high_scores
          WHERE ${sql.unsafe(likePatterns)}
        `;
        
        console.log(`\nSuccessfully removed ${count} test records from the database.`);
      } else {
        console.log('\nOperation cancelled. No records were removed.');
      }
      
      // Close the database connection and readline interface
      await sql.end();
      rl.close();
    });
  } catch (error) {
    console.error('Error removing test records:', error.message);
    if (sql) {
      await sql.end();
    }
    process.exit(1);
  }
}

// Run the function
removeTestRecords();
