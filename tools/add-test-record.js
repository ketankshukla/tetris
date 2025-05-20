require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function addTestRecord() {
  try {
    console.log('Connecting to Neon database...');
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return;
    }
    
    const sql = neon(DATABASE_URL);
    console.log('Connected to database.');
    
    // Create a test record
    const testRecord = {
      player_name: 'Test Player',
      score: 1000,
      level: 10,
      lines: 100,
      date: new Date().toISOString()
    };
    
    console.log('Adding test record:', testRecord);
    
    // Insert the test record
    await sql`
      INSERT INTO high_scores (
        player_name, 
        score, 
        level, 
        lines, 
        date
      ) VALUES (
        ${testRecord.player_name}, 
        ${testRecord.score}, 
        ${testRecord.level}, 
        ${testRecord.lines}, 
        ${testRecord.date}
      )
    `;
    
    console.log('Test record added successfully.');
    
    // Verify the record was added
    const records = await sql`
      SELECT * FROM high_scores 
      ORDER BY score DESC
    `;
    
    console.log('\nAll records in database:');
    records.forEach((record, index) => {
      console.log(`${index + 1}. ${record.player_name}: ${record.score} points (Level: ${record.level}, Lines: ${record.lines}, Date: ${record.date})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestRecord();
