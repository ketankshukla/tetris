// Script to clean up duplicate scores in the database
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function cleanDuplicateScores() {
  try {
    console.log('=== CLEANING DUPLICATE SCORES ===');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL environment variable is not set.');
      console.log('Make sure you have a .env file with DATABASE_URL or set it in your environment.');
      process.exit(1);
    }
    
    console.log('✓ DATABASE_URL environment variable is set.');
    console.log('Connecting to database...');
    
    // Connect to database
    const sql = neon(process.env.DATABASE_URL);
    
    // Test the connection
    await sql`SELECT 1 as connection_test`;
    console.log('✓ Successfully connected to the database!');
    
    // Get all scores
    console.log('Retrieving all scores...');
    const allScores = await sql`SELECT * FROM high_scores ORDER BY id`;
    console.log(`Found ${allScores.length} total records in the database.`);
    
    // Find duplicates
    console.log('Identifying duplicate scores...');
    const uniqueScores = new Map();
    const duplicateIds = [];
    
    for (const score of allScores) {
      // Create a unique key for each score based on player_name, score, level, lines, and date
      const scoreKey = `${score.player_name}_${score.score}_${score.level}_${score.lines}_${score.date}`;
      
      if (uniqueScores.has(scoreKey)) {
        // This is a duplicate, add its ID to the list of duplicates to remove
        duplicateIds.push(score.id);
      } else {
        // This is the first occurrence, keep it
        uniqueScores.set(scoreKey, score);
      }
    }
    
    console.log(`Found ${duplicateIds.length} duplicate records to remove.`);
    
    if (duplicateIds.length > 0) {
      // Remove duplicates
      console.log('Removing duplicate records...');
      
      // Delete records with the duplicate IDs one by one
      for (const id of duplicateIds) {
        await sql`DELETE FROM high_scores WHERE id = ${id}`;
      }
      
      console.log(`✓ Successfully removed ${duplicateIds.length} duplicate records.`);
      
      // Get remaining scores
      const remainingScores = await sql`SELECT * FROM high_scores ORDER BY score DESC`;
      console.log(`Database now contains ${remainingScores.length} unique records.`);
      
      // Display the cleaned records
      console.log('\n=== REMAINING HIGH SCORES ===');
      remainingScores.forEach((score, index) => {
        console.log(`${index + 1}. ${score.player_name}: ${score.score} points (Level: ${score.level}, Lines: ${score.lines}, Date: ${score.date})`);
      });
    } else {
      console.log('✓ No duplicate records found. Database is already clean.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n=== CLEANUP COMPLETED ===');
  }
}

// Run the cleanup
cleanDuplicateScores();
