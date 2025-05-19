from js import document, window, console
from pyodide.ffi import create_proxy

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

class Tetris:
    def __init__(self):
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
        self.start_button = document.getElementById("start-button")
        
        # Set up event listeners
        self.setup_event_listeners()
    
    def setup_event_listeners(self):
        # Keyboard events
        self.keydown_proxy = create_proxy(self.handle_keydown)
        window.addEventListener("keydown", self.keydown_proxy)
        
        # Start button
        try:
            self.start_button_proxy = create_proxy(self.start_game)
            self.start_button.addEventListener("click", self.start_button_proxy)
            console.log("Start button event listener attached")
        except Exception as e:
            console.error(f"Error setting up start button: {str(e)}")
    
    def start_game(self, event=None):
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
        
        # Start game loop
        self.last_drop_time = window.performance.now()
        if self.animation_frame_id:
            window.cancelAnimationFrame(self.animation_frame_id)
        
        self.game_loop_proxy = create_proxy(self.game_loop)
        self.animation_frame_id = window.requestAnimationFrame(self.game_loop_proxy)
        
        # Change button text
        self.start_button.textContent = "Restart Game"
    
    def game_loop(self, timestamp):
        if not self.game_over and not self.paused:
            # Check if it's time to drop the piece
            if timestamp - self.last_drop_time > self.drop_interval:
                self.move_down()
                self.last_drop_time = timestamp
            
            # Draw everything
            self.draw()
        
        # Continue the game loop
        if not self.game_over:
            self.animation_frame_id = window.requestAnimationFrame(self.game_loop_proxy)
    
    def generate_new_piece(self):
        if self.next_piece_type == 0:
            # First piece of the game
            self.current_piece_type = int(window.Math.floor(window.Math.random() * 7) + 1)
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
            window.alert("Game Over! Your score: " + str(self.score))
    
    def generate_next_piece(self):
        self.next_piece_type = int(window.Math.floor(window.Math.random() * 7) + 1)
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
        if self.is_valid_move(-1, 0):
            self.current_x -= 1
    
    def move_right(self):
        if self.is_valid_move(1, 0):
            self.current_x += 1
    
    def move_down(self):
        if self.is_valid_move(0, 1):
            self.current_y += 1
            return True
        else:
            self.lock_piece()
            return False
    
    def hard_drop(self):
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
        self.paused = not self.paused
    
    def handle_keydown(self, event):
        if self.game_over:
            return
        
        key = event.key
        
        if key == "ArrowLeft":
            self.move_left()
            event.preventDefault()
        elif key == "ArrowRight":
            self.move_right()
            event.preventDefault()
        elif key == "ArrowUp":
            self.rotate()
            event.preventDefault()
        elif key == "ArrowDown":
            self.move_down()
            event.preventDefault()
        elif key == " ":  # Space
            self.hard_drop()
            event.preventDefault()
        elif key.lower() == "p":
            self.toggle_pause()
            event.preventDefault()

# Initialize the game when the page loads
def main():
    try:
        global game
        game = Tetris()
        console.log("Game initialized")
        
        # Add a direct event listener to the start button as a fallback
        start_button = document.getElementById("start-button")
        if start_button:
            def direct_start(event):
                console.log("Direct start button clicked")
                game.start_game(event)
            
            direct_start_proxy = create_proxy(direct_start)
            start_button.addEventListener("click", direct_start_proxy)
            console.log("Direct start button event listener attached")
    except Exception as e:
        console.error(f"Error in main: {str(e)}")

# Run the main function
main()
