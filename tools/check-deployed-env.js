// Script to check deployed environment variables
const fetch = require('node-fetch');

async function checkDeployedEnv() {
  try {
    console.log('Checking deployed environment...');
    
    // Use the custom domain as the primary URL
    const deployedUrls = [
      'https://tetris.ketanshukla.com/api/vercel-debug',
      'https://tetris.ketanshukla.com/api/env',
      'https://tetris.ketanshukla.com/api/debug'
    ];
    
    let success = false;
    
    for (const deployedUrl of deployedUrls) {
      try {
        console.log(`Trying URL: ${deployedUrl}`);
        const response = await fetch(deployedUrl);
        
        if (!response.ok) {
          console.log(`Got status ${response.status} from ${deployedUrl}`);
          continue;
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
        
        success = true;
        break;
      } catch (error) {
        console.log(`Error with ${deployedUrl}: ${error.message}`);
      }
    }
    
    if (!success) {
      console.log('\n❌ Could not connect to any of the deployed environment endpoints.');
      console.log('\nPossible reasons:');
      console.log('1. The custom domain might not be properly configured');
      console.log('2. The API endpoint might require authentication');
      console.log('3. The server might be down or experiencing issues');
      console.log('4. The API endpoints might have different paths than expected');
      
      console.log('\nSuggestions:');
      console.log('1. Verify that the custom domain is properly set up in Vercel');
      console.log('2. Check that the API endpoints are correctly implemented');
      console.log('3. Try accessing the site directly in a browser to see if it\'s online');
    }
  } catch (error) {
    console.error('Error checking deployed environment:', error);
  }
}

// Run the check
checkDeployedEnv().catch(console.error);
