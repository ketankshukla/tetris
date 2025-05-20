require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function debugDatabaseRecords() {
  try {
    console.log('Connecting to Neon database...');
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return;
    }
    
    const sql = neon(DATABASE_URL);
    console.log('Connected to database.');
    
    // Get table structure
    console.log('\nGetting table structure...');
    const tableStructure = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'high_scores'
    `;
    
    console.log('\nTable structure:');
    tableStructure.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type})`);
    });
    
    // Get all records with all fields
    console.log('\nGetting all records with all fields...');
    const allRecords = await sql`
      SELECT * FROM high_scores
    `;
    
    console.log('\nAll records (raw data):');
    console.log(JSON.stringify(allRecords, null, 2));
    
    // Get records with specific mapping
    console.log('\nGetting records with specific mapping...');
    const scores = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC
    `;
    
    console.log('\nMapped records:');
    scores.forEach((row, index) => {
      console.log(`${index + 1}. ${row.player_name}: ${row.score} points (Level: ${row.level}, Lines: ${row.lines}, Date: ${row.date ? row.date.toString() : 'N/A'})`);
    });
    
    // Test specific query formats
    console.log('\nTesting different query formats...');
    
    // Format 1: Using player_name
    const format1 = await sql`
      SELECT player_name, score, level, lines, date 
      FROM high_scores 
      ORDER BY score DESC
    `;
    
    console.log('\nFormat 1 (using player_name):');
    format1.forEach((row, index) => {
      console.log(`${index + 1}. ${row.player_name}: ${row.score} points`);
    });
    
    // Format 2: Using name alias
    const format2 = await sql`
      SELECT player_name as name, score, level, lines, date 
      FROM high_scores 
      ORDER BY score DESC
    `;
    
    console.log('\nFormat 2 (using name alias):');
    format2.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}: ${row.score} points`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugDatabaseRecords();
