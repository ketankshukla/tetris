// Simple script to test the database connection
require('dotenv').config({ path: './.env' });
const { neon } = require('@neondatabase/serverless');
const path = require('path');
const fs = require('fs');

async function testDatabaseConnection() {
  console.log('=== DATABASE CONNECTION TEST ===');
  
  try {
    // Manual check for .env file
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      console.log('✓ .env file exists at:', envPath);
      // Try to manually load the .env file
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n');
      
      for (const line of envVars) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('='); // Rejoin in case the value contains = characters
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        }
      }
    } else {
      console.log('❌ .env file not found at:', envPath);
    }
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL environment variable is not set.');
      console.log('Make sure you have a .env file with DATABASE_URL or set it in your environment.');
      process.exit(1);
    }
    
    console.log('✓ DATABASE_URL environment variable is set.');
    console.log('Attempting to connect to database...');
    
    // Connect to database
    const sql = neon(process.env.DATABASE_URL);
    
    // Test the connection with a simple query
    const result = await sql`SELECT 1 as connection_test`;
    
    if (result && result[0] && result[0].connection_test === 1) {
      console.log('✓ Successfully connected to the database!');
    }
    
    // Check if high_scores table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'high_scores'
      );
    `;
    
    const tableExists = tableCheck[0].exists;
    
    if (tableExists) {
      console.log('✓ The high_scores table exists in the database.');
      
      // Count records in the table
      const countResult = await sql`SELECT COUNT(*) as count FROM high_scores`;
      const recordCount = countResult[0].count;
      
      console.log(`ℹ️ The high_scores table contains ${recordCount} record(s).`);
      
      if (recordCount > 0) {
        // Show a sample record
        const sampleRecord = await sql`SELECT * FROM high_scores LIMIT 1`;
        console.log('ℹ️ Sample record:');
        console.log(sampleRecord[0]);
      }
    } else {
      console.log('❌ The high_scores table does not exist in the database.');
      console.log('You may need to create it using the SQL in the RESET_PROJECT_GUIDE.md');
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('\nPossible issues:');
    console.log('1. The DATABASE_URL might be incorrect');
    console.log('2. Your IP might not be allowed in the database firewall settings');
    console.log('3. The database server might be down or unreachable');
    console.log('4. Network issues or firewall restrictions');
  } finally {
    console.log('\n=== TEST COMPLETED ===');
  }
}

// Run the test
testDatabaseConnection();
