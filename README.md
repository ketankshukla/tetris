# Python Web Tetris

A web-based Tetris game built with Python using PyScript/Pyodide. This implementation runs Python code directly in the browser without requiring a backend server.

## Features

- Classic Tetris gameplay with keyboard controls
- Score tracking and level progression
- Next piece preview
- Responsive design for different screen sizes
- Deployable to Vercel as a static site

## How to Run Locally

You can test this game locally by serving the files with a simple HTTP server. Using Python's built-in server:

```powershell
cd tetris
python -m http.server 8000
```

Then open your browser and navigate to: http://localhost:8000

## Deployment to Vercel

To deploy to Vercel:

1. Push this project to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Vercel
3. Vercel will automatically detect the static site configuration
4. Your game will be deployed and accessible via a Vercel URL

## Game Controls

- **←, →**: Move piece left/right
- **↑**: Rotate piece
- **↓**: Soft drop (move down faster)
- **Space**: Hard drop (instantly drop piece)
- **P**: Pause/resume game

## Technical Details

This game uses:
- **PyScript/Pyodide**: For running Python in the browser
- **HTML5 Canvas**: For rendering the game
- **JavaScript interop**: For handling browser events and animation frames

No server-side code is required, making it perfect for static hosting platforms like Vercel.
