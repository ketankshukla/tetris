// Script to check deployed environment variables
const fetch = require('node-fetch');

async function checkDeployedEnv() {
  try {
    console.log('Checking deployed environment...');
    
    // Replace with your actual deployed URL
    const deployedUrl = 'https://tetris-ketankshukla.vercel.app/api/vercel-debug';
    
    console.log(`Fetching from: ${deployedUrl}`);
    const response = await fetch(deployedUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response from deployed site:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check database connection
    if (data.databaseConnected) {
      console.log('\n✅ Database connection on deployed site is working');
      
      if (data.databaseInfo) {
        console.log(`Database host: ${data.databaseInfo.host}`);
        console.log(`Database user: ${data.databaseInfo.username}`);
      }
      
      // Check if there are scores
      if (data.scores && Array.isArray(data.scores)) {
        console.log(`\nFound ${data.scores.length} scores on deployed site:`);
        data.scores.forEach(score => {
          console.log(`${score.name}\t${score.score}\t${score.level}\t${score.lines}\t${score.date}`);
        });
      } else {
        console.log('\nNo scores found on deployed site');
      }
    } else {
      console.log('\n❌ Database connection on deployed site is NOT working');
      if (data.error) {
        console.log('Error:', data.error.message);
      }
    }
  } catch (error) {
    console.error('Error checking deployed environment:', error);
  }
}

// Run the check
checkDeployedEnv().catch(console.error);
