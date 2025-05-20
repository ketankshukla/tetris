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
    
    // First, check if the high_scores table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    if (!tableExists[0].exists) {
      console.log('The high_scores table does not exist. Creating it now...');
      await sql`
        CREATE TABLE IF NOT EXISTS high_scores (
          id SERIAL PRIMARY KEY,
          player_name TEXT NOT NULL,
          score INTEGER NOT NULL,
          level INTEGER NOT NULL,
          lines INTEGER NOT NULL,
          date TEXT NOT NULL,
          original_index INTEGER
        );
      `;
      console.log('Created high_scores table.');
      console.log('No test records to remove since the table was just created.');
      await sql.end();
      return;
    }
    
    // Create a SQL pattern for LIKE queries
    const likeConditions = testPatterns.map(pattern => `player_name ILIKE '%${pattern}%'`);
    const whereClause = likeConditions.join(' OR ');
    
    // First, get the count of records that will be removed
    const countResult = await sql.unsafe(`
      SELECT COUNT(*) FROM high_scores
      WHERE ${whereClause}
    `);
    
    const count = parseInt(countResult[0].count, 10);
    
    if (count === 0) {
      console.log('No test records found in the database.');
      await sql.end();
      return;
    }
    
    console.log(`Found ${count} test records to remove.`);
    
    // Get the records that will be removed (for display)
    const recordsToRemove = await sql.unsafe(`
      SELECT id, player_name, score, level, lines, date
      FROM high_scores
      WHERE ${whereClause}
      ORDER BY score DESC
    `);
    
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
        const result = await sql.unsafe(`
          DELETE FROM high_scores
          WHERE ${whereClause}
        `);
        
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
