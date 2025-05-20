# Tetris Game Development Guide

This guide provides detailed information for developers working on the Tetris game project. It covers the project structure, key components, and development workflows.

## Project Structure

```
tetris/
├── .env                  # Environment variables (DATABASE_URL)
├── server.js             # Express server and API endpoints
├── package.json          # Node.js dependencies and scripts
├── vercel.json           # Vercel deployment configuration
├── tools.js              # Tools menu for running utility scripts
├── tools/                # Utility scripts for development and debugging
│   ├── view-db-records.js    # Utility to view database records
│   ├── database-test.js      # Database connection test utility
│   ├── clean-duplicate-scores.js # Utility to clean duplicate scores
│   ├── add-test-record.js    # Add test records to database
│   ├── check-env-format.js   # Check environment variable format
│   ├── check-deployed-env.js # Check deployed environment variables
│   ├── debug-db-records.js   # Debug database records
│   └── direct-db-test.js     # Direct database test utility
├── pages/                # Next.js API routes (for Vercel)
│   └── api/
│       ├── scores.js     # API endpoint for high scores
│       └── debug-env.js  # Debug endpoint for environment info
└── public/               # Static files served by Express
    ├── index.html        # Main game HTML
    ├── game.js           # Game logic
    ├── styles.css        # Game styles
    └── debug.html        # Debug interface
```

## Key Components

### 1. Game Logic (public/game.js)

The core Tetris game is implemented in `game.js`. Key features include:

- Game board representation and rendering
- Tetromino (piece) movement and collision detection
- Score calculation and level progression
- Game state management (start, pause, game over)

### 2. Server (server.js)

The Express server handles:

- Serving static files from the `public` directory
- API endpoints for high score management
- Database initialization and connection

### 3. Database Integration

The game uses a Neon PostgreSQL database to store high scores. Key files:

- `server.js`: Contains the `saveScoresToDB` and `getScoresFromDB` functions
- `tools/view-db-records.js`: Utility to view the current high scores in the database
- `tools/database-test.js`: Test database connectivity
- `tools/clean-duplicate-scores.js`: Utility to remove duplicate scores

### 4. High Score System

The high score system consists of:

- Client-side score tracking and submission (in `index.html`)
- Server-side validation and storage (in `server.js`)
- Database schema with duplicate prevention

## Development Workflow

### Local Development

1. **Setup Environment**:
   ```bash
   # Clone the repository
   git clone https://github.com/ketankshukla/tetris.git
   cd tetris
   
   # Install dependencies
   npm install
   
   # Create .env file with your database connection string
   echo "DATABASE_URL=your_connection_string" > .env
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access the Game**:
   Open your browser and navigate to `http://localhost:3001`

### Using the Tools Menu

The project includes a convenient tools menu that allows you to run various utility scripts:

1. **Run the Tools Menu**:
   ```bash
   node tools.js
   ```

2. **Select a Tool**:
   The menu will display a list of available tools with descriptions. Enter the number of the tool you want to run.

3. **Available Tools**:
   - Database connection test
   - View database records
   - Clean duplicate scores
   - Add test records
   - Check environment variables
   - And more...

### Database Management

You can use the tools menu to run these database utilities:

1. **View Database Records**:
   ```bash
   # Using the tools menu
   node tools.js
   # Select option for view-db-records.js
   
   # Or run directly
   node tools/view-db-records.js
   ```

2. **Test Database Connection**:
   ```bash
   # Using the tools menu
   node tools.js
   # Select option for database-test.js
   
   # Or run directly
   node tools/database-test.js
   ```

3. **Clean Duplicate Scores**:
   ```bash
   # Using the tools menu
   node tools.js
   # Select option for clean-duplicate-scores.js
   
   # Or run directly
   node tools/clean-duplicate-scores.js
   ```

## API Endpoints

### GET /api/scores
Returns all high scores from the database.

**Response Format**:
```json
{
  "highScores": [
    {
      "name": "Player1",
      "score": 1000,
      "level": 5,
      "lines": 20,
      "date": "2025-05-19T19:30:08.000Z"
    },
    ...
  ],
  "timestamp": "2025-05-19T19:43:10.000Z"
}
```

### POST /api/scores
Saves high scores to the database.

**Request Format**:
```json
{
  "highScores": [
    {
      "name": "Player1",
      "score": 1000,
      "level": 5,
      "lines": 20,
      "date": "2025-05-19T19:30:08.000Z"
    },
    ...
  ]
}
```

**Response Format**:
```json
{
  "success": true,
  "highScores": [...],
  "timestamp": "2025-05-19T19:43:10.000Z"
}
```

## Database Schema

The `high_scores` table has the following structure:

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

## Deployment

The project is configured for deployment to Vercel:

1. **Vercel Configuration**:
   The `vercel.json` file configures the deployment:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/server.js" },
       { "src": "/(.*)", "dest": "/server.js" }
     ]
   }
   ```

2. **Environment Variables**:
   Make sure to set the `DATABASE_URL` environment variable in your Vercel project settings.

3. **Deployment Process**:
   ```bash
   # Commit your changes
   git add .
   git commit -m "Your commit message"
   
   # Push to GitHub
   git push
   ```

   Vercel will automatically deploy the updated code.

## Common Issues and Solutions

### 1. Database Connection Issues

**Symptoms**: Server fails to start or high scores don't save/load.

**Solutions**:
- Verify your DATABASE_URL is correct in the .env file
- Run `node tools/database-test.js` to test the connection
- Check if your IP is allowed in the Neon database settings

### 2. Duplicate High Scores

**Symptoms**: Multiple identical entries appear in the high scores list.

**Solutions**:
- The server now checks for duplicates before inserting new scores
- Run `node tools/clean-duplicate-scores.js` to clean existing duplicates

### 3. API Endpoint Issues

**Symptoms**: High scores don't save or load in production.

**Solutions**:
- Use the debug.html page to test API endpoints
- Check browser console for network errors
- Verify that the client is using `window.location.origin` for API URLs

## Best Practices

1. **Code Organization**:
   - Keep game logic separate from UI code
   - Use meaningful variable and function names
   - Add comments for complex logic

2. **Database Operations**:
   - Always handle database errors gracefully
   - Use parameterized queries to prevent SQL injection
   - Implement duplicate checking for all database operations

3. **API Design**:
   - Use consistent response formats
   - Include proper error handling
   - Set appropriate CORS headers

4. **Deployment**:
   - Test locally before deploying
   - Use environment variables for configuration
   - Keep deployment configuration up to date
