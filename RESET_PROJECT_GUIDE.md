# Complete Reset Guide for Tetris Project

This guide will walk you through completely resetting your Tetris project with a fresh database setup to fix the high score system issues.

## Step 1: Backup Your Current Project (Optional)

If you want to keep a backup of your current project:

```bash
# Create a backup folder
mkdir -p ~/tetris-backup
# Copy your current project files
cp -r E:/projects/tetris/* ~/tetris-backup/
```

## Step 2: Delete Your Current Project

```bash
# Navigate to your projects directory
cd E:/projects
# Delete the tetris folder
rm -rf tetris
```

## Step 3: Clone the Project from GitHub

```bash
# Navigate to your projects directory
cd E:/projects
# Clone the repository
git clone https://github.com/ketankshukla/tetris.git
# Navigate to the project directory
cd tetris
```

## Step 4: Create a New Neon Database

1. Go to [Neon Database](https://console.neon.tech/)
2. Log in to your account
3. Click "Create New Project"
4. Name your project "tetris-database" (or any name you prefer)
5. Select the closest region to you
6. Click "Create Project"

## Step 5: Set Up the Database Schema

1. In the Neon console, navigate to your new project
2. Go to the "SQL Editor" tab
3. Execute the following SQL to create the high_scores table:

```sql
CREATE TABLE IF NOT EXISTS high_scores (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  lines INTEGER NOT NULL,
  date TEXT NOT NULL,
  original_index INTEGER
);
```

## Step 6: Get Your Database Connection String

1. In the Neon console, go to the "Connection Details" tab
2. Find the "Connection String" section
3. Click "Show password" to reveal the full connection string
4. Copy the connection string (it should look like `postgresql://username:password@endpoint/database`)

## Step 7: Update Your Local Environment Variables

```bash
# Create a new .env file
cd E:/projects/tetris
echo "DATABASE_URL=your_connection_string_here" > .env
```

Replace `your_connection_string_here` with the connection string you copied from Neon.

## Step 8: Update Your Vercel Environment Variables

1. Go to [Vercel](https://vercel.com/)
2. Log in to your account
3. Navigate to your Tetris project
4. Go to the "Settings" tab
5. Click on "Environment Variables"
6. Find the existing `DATABASE_URL` variable and click "Edit"
7. Replace the value with your new connection string
8. Click "Save"

## Step 9: Test Your Local Setup

```bash
# Navigate to your project directory
cd E:/projects/tetris
# Install dependencies (if needed)
npm install
# Run the database test script
node database-test.js
# Start the server
npm run dev
```

## Step 10: Deploy to Vercel

```bash
# Navigate to your project directory
cd E:/projects/tetris
# Commit your changes
git add .
git commit -m "Reset project with fresh database"
# Push to GitHub
git push
```

This will trigger a new deployment on Vercel.

## Step 11: Verify Everything Works

1. Wait for the Vercel deployment to complete
2. Visit your deployed site (e.g., https://tetris-ketankshukla.vercel.app/)
3. Play a game and add a high score
4. Refresh the page to verify the score is still there
5. Check the database using the view-db-records.js script:

```bash
cd E:/projects/tetris
node view-db-records.js
```

## Troubleshooting

If you encounter any issues:

1. **Database Connection Issues**:
   - Verify your DATABASE_URL is correct in both your local .env file and Vercel environment variables
   - Make sure your IP address is allowed in Neon's connection settings

2. **API Endpoint Issues**:
   - Check the browser console for any error messages
   - Verify that the client is using `window.location.origin` for API URLs

3. **Deployment Issues**:
   - Check the Vercel deployment logs for any errors
   - Make sure your vercel.json file is correctly configured

## Key Points to Remember

1. The client-side code expects high scores in this format: `{ highScores: [...] }`
2. The database table has a field called `player_name` but the frontend expects it as `name`
3. API URLs should be constructed using `window.location.origin` to work both locally and on the deployed site
4. Dates should be stored in ISO format for consistency
