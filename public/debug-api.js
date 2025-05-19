require('dotenv').config();
const fetch = require('node-fetch');
const { neon } = require('@neondatabase/serverless');

// Try different possible deployment URLs
const DEPLOYED_URLS = [
  'https://tetris-game-ketan.vercel.app',
  'https://tetris-ketan.vercel.app',
  'https://tetris.vercel.app',
  'https://tetris-game.vercel.app'
];

async function testLocalAndDeployed() {
  try {
    console.log('=== DATABASE CONNECTION TEST ===');
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test direct database connection
    console.log('\n1. Testing direct database connection...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if we can connect and query
    const dbTest = await sql`SELECT NOW() as time`;
    console.log('Database connection successful:', dbTest[0].time);
    
    // Get current scores in database
    const dbScores = await sql`SELECT * FROM high_scores ORDER BY score DESC`;
    console.log(`Found ${dbScores.length} scores in database:`);
    dbScores.forEach((score, index) => {
      console.log(`${index + 1}. ${score.player_name}: ${score.score} (Level ${score.level}, Lines ${score.lines})`);
    });
    
    // Test local API
    console.log('\n2. Testing local API...');
    try {
      const localResponse = await fetch('http://localhost:4000/api/scores');
      if (!localResponse.ok) {
        throw new Error(`Local API error: ${localResponse.status}`);
      }
      const localData = await localResponse.json();
      console.log('Local API response:', JSON.stringify(localData, null, 2));
    } catch (localError) {
      console.error('Error with local API:', localError.message);
      console.log('Is your local server running? If not, this error is expected.');
    }
    
    // Test all possible deployed URLs
    console.log('\n3. Testing deployed APIs...');
    for (const url of DEPLOYED_URLS) {
      try {
        console.log(`\nTrying URL: ${url}`);
        const deployedResponse = await fetch(`${url}/api/scores`);
        if (!deployedResponse.ok) {
          throw new Error(`Deployed API error: ${deployedResponse.status}`);
        }
        const deployedData = await deployedResponse.json();
        console.log('Deployed API response:', JSON.stringify(deployedData, null, 2));
        console.log('✅ This URL works!');
      } catch (deployedError) {
        console.error('❌ Error with this URL:', deployedError.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLocalAndDeployed();
