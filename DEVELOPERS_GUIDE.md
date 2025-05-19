# Developer's Guide: Deploying Static Sites with API Routes on Vercel

This guide outlines how to structure a project that combines static content (HTML, CSS, JS) with serverless API routes for deployment on Vercel, based on our experience with the Tetris game project.

## Table of Contents

1. [Project Structure](#project-structure)
2. [API Routes](#api-routes)
3. [Static Content](#static-content)
4. [Configuration Files](#configuration-files)
5. [Database Integration](#database-integration)
6. [Deployment Process](#deployment-process)
7. [Debugging Tips](#debugging-tips)
8. [Common Issues and Solutions](#common-issues-and-solutions)

## Project Structure

For optimal compatibility with Vercel, structure your project as follows:

```
project-root/
├── pages/
│   └── api/
│       ├── scores.js
│       ├── test.js
│       └── other-api-endpoints.js
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── game.js
│   └── other-static-files
├── package.json
├── next.config.js
└── vercel.json (optional)
```

### Key Directories

- **pages/api/**: Contains all serverless API endpoints
- **public/**: Contains all static files (HTML, CSS, JS, images, etc.)

## API Routes

Vercel uses Next.js-style API routes located in the `pages/api` directory. Each file becomes an API endpoint.

### Basic API Structure

```javascript
// pages/api/example.js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle different HTTP methods
  if (req.method === 'GET') {
    // Handle GET request
    return res.status(200).json({ message: 'Success' });
  } else if (req.method === 'POST') {
    // Handle POST request
    const data = req.body;
    return res.status(200).json({ received: data });
  } else {
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
```

### Accessing Environment Variables

In API routes, you can access environment variables directly using `process.env`:

```javascript
const apiKey = process.env.API_KEY;
const databaseUrl = process.env.DATABASE_URL;
```

## Static Content

All static content should be placed in the `public` directory. Files in this directory are served at the root path.

For example:
- `public/index.html` is accessible at `/index.html` or `/`
- `public/styles.css` is accessible at `/styles.css`
- `public/images/logo.png` is accessible at `/images/logo.png`

### Accessing API Routes from Frontend

In your frontend JavaScript, you can access API routes using relative paths:

```javascript
// Fetch data from API
fetch('/api/scores')
  .then(response => response.json())
  .then(data => {
    console.log('Received data:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

## Configuration Files

### package.json

Your `package.json` should include Next.js and any other dependencies:

```json
{
  "name": "your-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.6.1",
    "dotenv": "^16.5.0",
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### next.config.js

Create a `next.config.js` file to configure Next.js:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Next.js to handle static HTML files
  reactStrictMode: true,
  trailingSlash: true,
  // Ensure Next.js doesn't try to process HTML files as React components
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Redirect root to index.html
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
```

### vercel.json (Optional)

For most projects, a minimal `vercel.json` is sufficient:

```json
{
  "version": 2
}
```

This lets Vercel use its default settings, which work well with the Next.js-style project structure.

## Database Integration

### Connecting to Neon Database

For Neon database integration, use the `@neondatabase/serverless` package:

```javascript
const { neon } = require('@neondatabase/serverless');

export default async function handler(req, res) {
  try {
    // Get DATABASE_URL from environment variables
    const DATABASE_URL = process.env.DATABASE_URL;
    
    // Connect to database
    const sql = neon(DATABASE_URL);
    
    // Execute a query
    const result = await sql`SELECT * FROM your_table`;
    
    // Return the result
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
```

### Setting Up Environment Variables

1. Locally: Create a `.env` file in your project root:
   ```
   DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
   ```

2. On Vercel:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the same variables you use locally

## Deployment Process

1. **Prepare Your Project**:
   - Ensure your project structure follows the guidelines above
   - Test locally using `npm run dev`

2. **Push to GitHub**:
   - Commit all changes to your repository
   - Push to GitHub

3. **Deploy on Vercel**:
   - Connect your GitHub repository to Vercel
   - Configure build settings (usually automatic)
   - Set environment variables
   - Deploy

4. **Verify Deployment**:
   - Check that static content is accessible
   - Test API endpoints
   - Verify database connections

## Debugging Tips

### Create a Debug Page

Create a debug page (`public/debug.html`) with tests for:
- Simple API connectivity
- Environment variables
- Database connection
- API endpoints

Example debug test for API:

```javascript
async function testApi() {
  try {
    const response = await fetch('/api/test');
    const data = await response.json();
    console.log('API test result:', data);
    document.getElementById('apiResult').textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('API test error:', error);
    document.getElementById('apiResult').textContent = 'Error: ' + error.message;
  }
}
```

### Check Vercel Logs

- Go to your Vercel dashboard
- Select your project
- Navigate to "Deployments"
- Click on the latest deployment
- Check the "Functions" tab for API logs

## Common Issues and Solutions

### 404 Errors for API Routes

**Problem**: API endpoints return 404 errors.

**Solution**:
- Ensure API files are in the `pages/api` directory
- Check that the file exports a default function
- Verify the API path being used in fetch requests

### Database Connection Issues

**Problem**: Cannot connect to the database.

**Solution**:
- Verify DATABASE_URL is correctly set in Vercel environment variables
- Check for typos in the connection string
- Ensure the database server allows connections from Vercel's IP range
- Test with a direct database connection endpoint

### CORS Errors

**Problem**: Browser blocks API requests due to CORS.

**Solution**:
- Add proper CORS headers to API responses:
  ```javascript
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  ```
- Handle OPTIONS requests for preflight checks

### Environment Variables Not Available

**Problem**: Environment variables are undefined in API routes.

**Solution**:
- Double-check that variables are set in Vercel dashboard
- Ensure variable names match exactly between local and Vercel
- Try redeploying after setting variables

---

This guide covers the key aspects of deploying a static site with API routes on Vercel, based on our experience with the Tetris game project. By following these guidelines, you can avoid common pitfalls and ensure a smooth deployment process.
