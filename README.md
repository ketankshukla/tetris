# Tetris Game

A modern web-based Tetris game built with JavaScript, HTML5, and Node.js. Features a complete high score system with database integration.

## Features

- Classic Tetris gameplay with keyboard controls
- High score system with persistent storage using Neon PostgreSQL
- Responsive design for different screen sizes
- Server-side score validation and storage
- Deployable to Vercel

## Live Demo

Play the game online: [Tetris Game](https://tetris.ketanshukla.com)

## How to Run Locally

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Neon PostgreSQL database

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ketankshukla/tetris.git
   cd tetris
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with your database connection string:
   ```
   DATABASE_URL=postgresql://username:password@endpoint/database
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to: http://localhost:3001

## Game Controls

- **Left/Right Arrow Keys**: Move piece left/right
- **Up Arrow Key**: Rotate piece
- **Down Arrow Key**: Soft drop (move down faster)
- **Space**: Hard drop (instantly drop piece)
- **P**: Pause/resume game

## Technical Details

This game uses:
- **HTML5 Canvas**: For rendering the game
- **JavaScript**: For game logic and UI
- **Express.js**: For the backend server
- **Neon PostgreSQL**: For storing high scores
- **Vercel**: For deployment

## Deployment

This project is configured for easy deployment to Vercel. See the [RESET_PROJECT_GUIDE.md](./RESET_PROJECT_GUIDE.md) for detailed deployment instructions.

## Development

For detailed development instructions, see the [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md).

## Troubleshooting

If you encounter issues with high scores or database connectivity, use the included debug tools:
- `debug.html`: Web-based debugging interface
- `view-db-records.js`: Command-line tool to view database records
- `database-test.js`: Test database connectivity

## License

MIT