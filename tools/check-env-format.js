// Script to check .env file format without revealing contents
const fs = require('fs');
const path = require('path');

try {
  // Read the .env file
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  console.log('✓ .env file exists and can be read');
  
  // Check if the file has content
  if (envContent.trim() === '') {
    console.log('❌ .env file is empty');
    process.exit(1);
  }
  
  // Check for DATABASE_URL
  if (!envContent.includes('DATABASE_URL=')) {
    console.log('❌ DATABASE_URL is not defined in .env file');
    console.log('Format should be: DATABASE_URL=postgresql://username:password@endpoint/database');
    process.exit(1);
  }
  
  // Check if DATABASE_URL has a value
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (!match || !match[1] || match[1].trim() === '') {
    console.log('❌ DATABASE_URL is defined but has no value');
    console.log('Format should be: DATABASE_URL=postgresql://username:password@endpoint/database');
    process.exit(1);
  }
  
  // Check if it looks like a valid PostgreSQL connection string
  const connectionString = match[1].trim();
  if (!connectionString.startsWith('postgresql://')) {
    console.log('⚠️ DATABASE_URL does not start with postgresql://');
    console.log('This might be an issue if you\'re using Neon database');
  }
  
  console.log('✓ DATABASE_URL is defined and has a value');
  console.log('✓ .env file format appears to be correct');
  
  // Print masked connection string for verification
  const maskedString = connectionString
    .replace(/\/\/[^:]+:([^@]+)@/, '//****:****@')
    .replace(/\/[^\/]+$/, '/****');
  
  console.log(`ℹ️ Your connection string format (masked): ${maskedString}`);
  
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
}
