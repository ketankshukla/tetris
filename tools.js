/**
 * Tetris Tools Menu
 * 
 * This script provides a menu to run various utility tools for the Tetris project.
 */

const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define the tools with descriptions
const tools = [
  { 
    name: 'Test Database Connection', 
    description: 'Check if the database connection is working properly',
    path: path.join(__dirname, 'tools', 'database-test.js')
  },
  { 
    name: 'View High Scores', 
    description: 'Display all high scores stored in the database',
    path: path.join(__dirname, 'tools', 'view-db-records.js')
  },
  { 
    name: 'Remove Duplicate Scores', 
    description: 'Find and delete duplicate high score entries',
    path: path.join(__dirname, 'tools', 'clean-duplicate-scores.js')
  },
  { 
    name: 'Add Test Score', 
    description: 'Insert a sample high score record for testing',
    path: path.join(__dirname, 'tools', 'add-test-record.js')
  },
  { 
    name: 'Remove Test Scores', 
    description: 'Delete all test/sample high score records',
    path: path.join(__dirname, 'tools', 'remove-test-records.js')
  },
  { 
    name: 'Check Environment Variables', 
    description: 'Verify that environment variables are correctly formatted',
    path: path.join(__dirname, 'tools', 'check-env-format.js')
  },
  { 
    name: 'Check Deployed Environment', 
    description: 'Inspect environment variables in the production deployment',
    path: path.join(__dirname, 'tools', 'check-deployed-env.js')
  },
  { 
    name: 'Debug Database Records', 
    description: 'Show detailed information about database records',
    path: path.join(__dirname, 'tools', 'debug-db-records.js')
  },
  { 
    name: 'Direct Database Test', 
    description: 'Run direct SQL queries to test database functionality',
    path: path.join(__dirname, 'tools', 'direct-db-test.js')
  }
];

// Function to display the menu
function displayMenu() {
  console.log('\n=== Tetris Tools Menu ===\n');
  
  tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name} - ${tool.description}`);
  });
  
  console.log('\n0. Exit\n');
  
  rl.question('Select a tool to run (0-' + tools.length + '): ', handleSelection);
}

// Function to handle user selection
function handleSelection(selection) {
  const selectedIndex = parseInt(selection, 10);
  
  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex > tools.length) {
    console.log('\nInvalid selection. Please try again.');
    displayMenu();
    return;
  }
  
  if (selectedIndex === 0) {
    console.log('\nExiting Tetris Tools Menu. Goodbye!');
    rl.close();
    return;
  }
  
  const selectedTool = tools[selectedIndex - 1];
  
  console.log(`\nRunning: ${selectedTool.name}...\n`);
  
  // Check if the file exists
  if (!fs.existsSync(selectedTool.path)) {
    console.log(`Error: Tool file not found: ${selectedTool.path}`);
    askToReturnToMenu();
    return;
  }
  
  // Run the selected tool
  const child = spawn('node', [selectedTool.path], { 
    stdio: 'inherit',
    env: process.env
  });
  
  child.on('close', (code) => {
    console.log(`\nTool completed with exit code ${code}`);
    askToReturnToMenu();
  });
  
  child.on('error', (err) => {
    console.log(`\nError running tool: ${err.message}`);
    askToReturnToMenu();
  });
}

// Function to ask if user wants to return to menu
function askToReturnToMenu() {
  rl.question('\nReturn to menu? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      displayMenu();
    } else {
      console.log('\nExiting Tetris Tools Menu. Goodbye!');
      rl.close();
    }
  });
}

// Start the menu
console.log('Welcome to the Tetris Tools Menu!');
displayMenu();
