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
    name: 'database-test.js', 
    description: 'Test database connection and table creation',
    path: path.join(__dirname, 'tools', 'database-test.js')
  },
  { 
    name: 'view-db-records.js', 
    description: 'View all records in the high scores database',
    path: path.join(__dirname, 'tools', 'view-db-records.js')
  },
  { 
    name: 'clean-duplicate-scores.js', 
    description: 'Remove duplicate scores from the database',
    path: path.join(__dirname, 'tools', 'clean-duplicate-scores.js')
  },
  { 
    name: 'add-test-record.js', 
    description: 'Add a test record to the database',
    path: path.join(__dirname, 'tools', 'add-test-record.js')
  },
  { 
    name: 'check-env-format.js', 
    description: 'Check if environment variables are properly formatted',
    path: path.join(__dirname, 'tools', 'check-env-format.js')
  },
  { 
    name: 'check-deployed-env.js', 
    description: 'Check environment variables in deployed environment',
    path: path.join(__dirname, 'tools', 'check-deployed-env.js')
  },
  { 
    name: 'debug-db-records.js', 
    description: 'Debug database records with detailed output',
    path: path.join(__dirname, 'tools', 'debug-db-records.js')
  },
  { 
    name: 'direct-db-test.js', 
    description: 'Direct database connection test with SQL queries',
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
  
  console.log(`\nRunning ${selectedTool.name}...\n`);
  
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
    console.log(`\nTool ${selectedTool.name} completed with exit code ${code}`);
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
