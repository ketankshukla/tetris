// Wait for the page to load
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const loadingMessage = document.getElementById('loading-message');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const canvas = document.getElementById('tetris-canvas');
    const nextCanvas = document.getElementById('next-piece-canvas');
    
    // Game variables
    let game = null;
    let pyodide = null;
    let gameRunning = false;
    
    // Disable the start button until Pyodide is loaded
    startButton.disabled = true;
    
    // Initialize Pyodide
    async function initPyodide() {
        try {
            console.log("Loading Pyodide...");
            pyodide = await loadPyodide();
            console.log("Pyodide loaded successfully");
            
            // Load the game code
            await loadGameCode();
        } catch (error) {
            console.error("Error loading Pyodide:", error);
            loadingMessage.textContent = "Error loading game engine. Please check console for details.";
        }
    }
    
    // Load the Tetris game code
    async function loadGameCode() {
        try {
            // Instead of fetching the Python code, we'll embed it directly
            // This avoids CORS issues when running locally
            const pythonCode = `
import js

# Tetris game constants
COLS = 10
ROWS = 20
BLOCK_SIZE = 30
COLORS = [
    "#000000",  # Empty space (black)
    "#00FFFF",  # I piece (cyan)
    "#0000FF",  # J piece (blue)
    "#FFA500",  # L piece (orange)
    "#FFFF00",  # O piece (yellow)
    "#00FF00",  # S piece (green)
    "#800080",  # T piece (purple)
    "#FF0000",  # Z piece (red)
]

# Tetromino shapes
SHAPES = [
    [],  # Empty placeholder for indexing
    [[1, 1, 1, 1]],  # I
    [[1, 0, 0], [1, 1, 1]],  # J
    [[0, 0, 1], [1, 1, 1]],  # L
    [[1, 1], [1, 1]],  # O
    [[0, 1, 1], [1, 1, 0]],  # S
    [[0, 1, 0], [1, 1, 1]],  # T
    [[1, 1, 0], [0, 1, 1]],  # Z
]

class TetrisGame:
    def __init__(self, document):
        # Store document reference
        self.document = document
        
        # Game board setup
        self.board = [[0 for _ in range(COLS)] for _ in range(ROWS)]
        self.score = 0
        self.level = 1
        self.lines_cleared = 0
        self.game_over = False
        self.paused = False
        
        # Current and next piece
        self.current_piece = None
        self.current_piece_type = 0
        self.current_x = 0
        self.current_y = 0
        self.next_piece_type = 0
        
        # Canvas setup
        self.canvas = document.getElementById("tetris-canvas")
        self.ctx = self.canvas.getContext("2d")
        self.next_canvas = document.getElementById("next-piece-canvas")
        self.next_ctx = self.next_canvas.getContext("2d")
        
        # Game timing
        self.drop_interval = 1000  # milliseconds
        self.last_drop_time = 0
        self.animation_frame_id = None
        
        # UI elements
        self.score_element = document.getElementById("score")
        self.level_element = document.getElementById("level")
        self.lines_element = document.getElementById("lines")
    
    def start_game(self):
        # Reset game state if needed
        if self.game_over:
            self.reset_game()
        else:
            # Generate first pieces if this is the first start
            if self.current_piece is None:
                self.generate_new_piece()
                self.generate_next_piece()
            
            # Start game loop
            self.last_drop_time = js.Date.now()
            
            # Make sure we don't have multiple game loops running
            if self.animation_frame_id:
                js.window.cancelAnimationFrame(self.animation_frame_id)
                
            # Start a new game loop
            self.game_loop(js.Date.now())
    
    def reset_game(self):
        # Reset game state
        self.board = [[0 for _ in range(COLS)] for _ in range(ROWS)]
        self.score = 0
        self.level = 1
        self.lines_cleared = 0
        self.game_over = False
        self.paused = False
        
        # Update UI
        self.update_score()
        
        # Generate first pieces
        self.generate_new_piece()
        self.generate_next_piece()
        
        # Cancel any existing animation frame
        if self.animation_frame_id:
            js.window.cancelAnimationFrame(self.animation_frame_id)
        
        # Start game loop
        self.last_drop_time = js.Date.now()
        self.game_loop(js.Date.now())
    
    def game_loop(self, timestamp):
        # Only process game logic if the game is not over and not paused
        if not self.game_over and not self.paused:
            # Get current time
            current_time = timestamp
            
            # Check if it's time to drop the piece
            if current_time - self.last_drop_time > self.drop_interval:
                self.move_down()
                self.last_drop_time = current_time
            
            # Draw everything
            self.draw()
        
        # Continue the game loop if the game is not over
        if not self.game_over:
            # Schedule the next frame
            self.animation_frame_id = js.window.requestAnimationFrame(
                js.Function.new(self.game_loop)
            )
    
    def generate_new_piece(self):
        if self.next_piece_type == 0:
            # First piece of the game
            self.current_piece_type = int(js.Math.floor(js.Math.random() * 7) + 1)
        else:
            # Use the next piece
            self.current_piece_type = self.next_piece_type
        
        self.current_piece = SHAPES[self.current_piece_type]
        
        # Starting position (centered at top)
        self.current_x = int((COLS - len(self.current_piece[0])) / 2)
        self.current_y = 0
        
        # Check if the new piece can be placed
        if not self.is_valid_move(0, 0):
            self.game_over = True
            # Cancel animation frame when game is over
            if self.animation_frame_id:
                js.window.cancelAnimationFrame(self.animation_frame_id)
            js.alert("Game Over! Your score: " + str(self.score))
    
    def generate_next_piece(self):
        self.next_piece_type = int(js.Math.floor(js.Math.random() * 7) + 1)
        self.draw_next_piece()
    
    def draw_next_piece(self):
        # Clear next piece canvas
        self.next_ctx.fillStyle = "#000000"
        self.next_ctx.fillRect(0, 0, self.next_canvas.width, self.next_canvas.height)
        
        # Draw the next piece
        next_shape = SHAPES[self.next_piece_type]
        block_size = 20  # Smaller blocks for the next piece preview
        
        # Center the piece in the canvas
        offset_x = (self.next_canvas.width - len(next_shape[0]) * block_size) / 2
        offset_y = (self.next_canvas.height - len(next_shape) * block_size) / 2
        
        for y in range(len(next_shape)):
            for x in range(len(next_shape[y])):
                if next_shape[y][x]:
                    self.next_ctx.fillStyle = COLORS[self.next_piece_type]
                    self.next_ctx.fillRect(
                        offset_x + x * block_size,
                        offset_y + y * block_size,
                        block_size,
                        block_size
                    )
                    self.next_ctx.strokeStyle = "#FFFFFF"
                    self.next_ctx.strokeRect(
                        offset_x + x * block_size,
                        offset_y + y * block_size,
                        block_size,
                        block_size
                    )
    
    def draw(self):
        # Clear canvas
        self.ctx.fillStyle = "#000000"
        self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height)
        
        # Draw the board
        for y in range(ROWS):
            for x in range(COLS):
                if self.board[y][x]:
                    self.draw_block(x, y, self.board[y][x])
        
        # Draw current piece
        if self.current_piece:
            for y in range(len(self.current_piece)):
                for x in range(len(self.current_piece[y])):
                    if self.current_piece[y][x]:
                        self.draw_block(
                            self.current_x + x,
                            self.current_y + y,
                            self.current_piece_type
                        )
    
    def draw_block(self, x, y, color_idx):
        self.ctx.fillStyle = COLORS[color_idx]
        self.ctx.fillRect(
            x * BLOCK_SIZE,
            y * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
        )
        self.ctx.strokeStyle = "#FFFFFF"
        self.ctx.strokeRect(
            x * BLOCK_SIZE,
            y * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
        )
    
    def is_valid_move(self, dx, dy, new_piece=None):
        if new_piece is None:
            new_piece = self.current_piece
        
        new_x = self.current_x + dx
        new_y = self.current_y + dy
        
        for y in range(len(new_piece)):
            for x in range(len(new_piece[y])):
                if new_piece[y][x]:
                    # Check boundaries
                    if (new_x + x < 0 or new_x + x >= COLS or
                        new_y + y < 0 or new_y + y >= ROWS):
                        return False
                    
                    # Check collision with placed blocks
                    if new_y + y >= 0 and self.board[new_y + y][new_x + x]:
                        return False
        
        return True
    
    def rotate(self):
        if self.current_piece_type == 4:  # O piece doesn't rotate
            return
        
        # Transpose and reverse rows to rotate 90 degrees clockwise
        rows = len(self.current_piece)
        cols = len(self.current_piece[0])
        
        rotated = [[0 for _ in range(rows)] for _ in range(cols)]
        
        for y in range(rows):
            for x in range(cols):
                rotated[x][rows - 1 - y] = self.current_piece[y][x]
        
        if self.is_valid_move(0, 0, rotated):
            self.current_piece = rotated
    
    def move_left(self):
        if not self.game_over and not self.paused and self.is_valid_move(-1, 0):
            self.current_x -= 1
            self.draw()  # Immediately redraw after movement
    
    def move_right(self):
        if not self.game_over and not self.paused and self.is_valid_move(1, 0):
            self.current_x += 1
            self.draw()  # Immediately redraw after movement
    
    def move_down(self):
        if self.game_over or self.paused:
            return False
            
        if self.is_valid_move(0, 1):
            self.current_y += 1
            self.draw()  # Immediately redraw after movement
            return True
        else:
            self.lock_piece()
            return False
    
    def hard_drop(self):
        if self.game_over or self.paused:
            return
            
        while self.move_down():
            pass
    
    def lock_piece(self):
        # Add the current piece to the board
        for y in range(len(self.current_piece)):
            for x in range(len(self.current_piece[y])):
                if self.current_piece[y][x]:
                    self.board[self.current_y + y][self.current_x + x] = self.current_piece_type
        
        # Check for completed lines
        self.check_lines()
        
        # Generate new pieces
        self.generate_new_piece()
        self.generate_next_piece()
    
    def check_lines(self):
        lines_to_clear = []
        
        # Find completed lines
        for y in range(ROWS):
            if all(self.board[y]):
                lines_to_clear.append(y)
        
        # Clear lines and update score
        if lines_to_clear:
            # Update score based on number of lines cleared
            lines_count = len(lines_to_clear)
            self.lines_cleared += lines_count
            
            # Score calculation based on level and lines cleared
            line_scores = [40, 100, 300, 1200]  # 1, 2, 3, 4 lines
            self.score += line_scores[min(lines_count, 4) - 1] * self.level
            
            # Remove completed lines
            for line in sorted(lines_to_clear, reverse=True):
                del self.board[line]
                self.board.insert(0, [0 for _ in range(COLS)])
            
            # Update level (every 10 lines)
            self.level = max(1, (self.lines_cleared // 10) + 1)
            
            # Update drop speed based on level
            self.drop_interval = max(100, 1000 - (self.level - 1) * 50)
            
            # Update UI
            self.update_score()
    
    def update_score(self):
        self.score_element.textContent = str(self.score)
        self.level_element.textContent = str(self.level)
        self.lines_element.textContent = str(self.lines_cleared)
    
    def toggle_pause(self):
        if not self.game_over:
            self.paused = not self.paused
`;
            
            // Run the Python code
            pyodide.runPython(pythonCode);
            
            // Hide loading message and enable start button
            loadingMessage.style.display = 'none';
            startButton.disabled = false;
            
            console.log("Game code loaded successfully");
            
            // Set up the game
            setupGame();
        } catch (error) {
            console.error("Error loading game code:", error);
            loadingMessage.textContent = "Error loading game code. Please check console for details.";
        }
    }
    
    // Set up the game
    function setupGame() {
        try {
            // Create the Tetris game instance
            game = pyodide.runPython(`
                tetris_game = TetrisGame(js.document)
                tetris_game
            `);
            
            // Add event listener for the start button
            startButton.addEventListener('click', () => {
                if (!gameRunning) {
                    game.start_game();
                    gameRunning = true;
                    startButton.textContent = 'Restart Game';
                    
                    // Force a redraw to make sure the piece appears
                    game.draw();
                } else {
                    // Reset the game
                    game.reset_game();
                }
            });
            
            // Add keyboard event listeners
            document.addEventListener('keydown', (event) => {
                // Only process keyboard events if the game is running
                if (!gameRunning) return;
                
                switch (event.key) {
                    case 'ArrowLeft':
                        game.move_left();
                        event.preventDefault();
                        break;
                    case 'ArrowRight':
                        game.move_right();
                        event.preventDefault();
                        break;
                    case 'ArrowUp':
                        game.rotate();
                        event.preventDefault();
                        break;
                    case 'ArrowDown':
                        game.move_down();
                        event.preventDefault();
                        break;
                    case ' ':
                        game.hard_drop();
                        event.preventDefault();
                        break;
                    case 'p':
                    case 'P':
                        game.toggle_pause();
                        event.preventDefault();
                        break;
                }
            });
            
            console.log("Game setup completed");
        } catch (error) {
            console.error("Error setting up game:", error);
            loadingMessage.textContent = "Error setting up game. Please check console for details.";
        }
    }
    
    // Start loading Pyodide
    initPyodide();
});
