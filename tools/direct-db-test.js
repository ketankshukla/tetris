// Direct database test without relying on dotenv
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

async function directDatabaseTest() {
  console.log('=== DIRECT DATABASE CONNECTION TEST ===');
  
  try {
    // Directly read the .env file
    const envPath = path.join(__dirname, '.env');
    console.log('Reading .env file from:', envPath);
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('Successfully read .env file');
    
    // Extract DATABASE_URL
    let databaseUrl = null;
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim().startsWith('DATABASE_URL=')) {
        databaseUrl = line.substring('DATABASE_URL='.length).trim();
        break;
      }
    }
    
    if (!databaseUrl) {
      console.error('❌ Could not find DATABASE_URL in .env file');
      process.exit(1);
    }
    
    console.log('✓ Found DATABASE_URL in .env file');
    console.log('Attempting to connect to database...');
    
    // Connect to database using the directly extracted URL
    const sql = neon(databaseUrl);
    
    // Test the connection with a simple query
    const result = await sql`SELECT 1 as connection_test`;
    
    if (result && result[0] && result[0].connection_test === 1) {
      console.log('✓ Successfully connected to the database!');
      
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
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
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
directDatabaseTest();
