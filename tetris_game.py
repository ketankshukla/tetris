from js import document, window
from pyodide.ffi import create_proxy
import json
import asyncio

from tetris_constants import POINTS_PER_LINE, LEVEL_UP_LINES, DEFAULT_DROP_INTERVAL, LEVEL_SPEED_FACTOR
from tetris_board import Board
from tetris_piece import Piece
from tetris_renderer import Renderer
from tetris_highscores import HighScoreManager
from tetris_api import TetrisAPI

class TetrisGame:
    """
    Main Tetris game class that coordinates all game components.
    """
    
    def __init__(self):
        """Initialize the Tetris game."""
        # Get canvas elements
        self.main_canvas = document.getElementById("tetris-canvas")
        self.next_canvas = document.getElementById("next-piece-canvas")
        
        # Initialize components
        self.board = Board()
        self.renderer = Renderer(self.main_canvas, self.next_canvas)
        self.high_score_manager = HighScoreManager("high-scores-body")
        self.api = TetrisAPI()
        
        # Game state
        self.current_piece = None
        self.next_piece = None
        self.current_x = 0
        self.current_y = 0
        self.score = 0
        self.level = 1
        self.game_over = False
        self.paused = False
        self.started = False
        
        # Game timing
        self.drop_interval = DEFAULT_DROP_INTERVAL
        self.last_drop_time = 0
        self.animation_frame_id = None
        
        # UI elements
        self.score_element = document.getElementById("score")
        self.level_element = document.getElementById("level")
        self.lines_element = document.getElementById("lines")
        self.start_button = document.getElementById("start-button")
        
        # Set up event handlers
        self.setup_event_listeners()
        
        # Draw welcome screen
        self.renderer.draw_welcome_screen()
    
    def load_high_scores(self):
        """Load high scores from the server."""
        # This is now handled by the HighScoreManager class
        pass
    
    def setup_event_listeners(self):
        """Set up keyboard and button event listeners."""
        # Keyboard events
        self.keydown_proxy = create_proxy(self.handle_keydown)
        window.addEventListener("keydown", self.keydown_proxy)
        
        # Start button
        try:
            self.start_button_proxy = create_proxy(self.start_game)
            self.start_button.addEventListener("click", self.start_button_proxy)
            print("Start button event listener attached")
        except Exception as e:
            print(f"Error setting up start button: {str(e)}")
    
    def handle_keydown(self, event):
        """Handle keyboard events."""
        if self.game_over:
            return
        
        key = event.key
        
        if key == "ArrowLeft":
            self.move_left()
        elif key == "ArrowRight":
            self.move_right()
        elif key == "ArrowDown":
            self.move_down()
        elif key == "ArrowUp":
            self.rotate()
        elif key == " ":  # Space
            self.hard_drop()
        elif key.lower() == "p":
            self.toggle_pause()
        elif key.lower() == "s" and not self.started:
            self.start_game()
        elif key == "Escape":
            self.exit_game()
    
    def start_game(self, event=None):
        """Start a new game."""
        # Reset game state
        self.board.reset()
        self.score = 0
        self.level = 1
        self.game_over = False
        self.paused = False
        self.started = True
        
        # Update UI
        self.update_score()
        
        # Generate first pieces
        self.current_piece = Piece.generate_random()
        self.next_piece = Piece.generate_random()
        
        # Starting position (centered at top)
        self.current_x = int((self.board.cols - len(self.current_piece.shape[0])) / 2)
        self.current_y = 0
        
        # Start game loop
        self.last_drop_time = window.performance.now()
        if self.animation_frame_id:
            window.cancelAnimationFrame(self.animation_frame_id)
        
        self.game_loop_proxy = create_proxy(self.game_loop)
        self.animation_frame_id = window.requestAnimationFrame(self.game_loop_proxy)
        
        # Change button text
        self.start_button.textContent = "Restart Game"
    
    def exit_game(self):
        """Exit the current game."""
        if self.animation_frame_id:
            window.cancelAnimationFrame(self.animation_frame_id)
        
        self.game_over = True
        self.started = False
        self.renderer.draw_welcome_screen()
        self.start_button.textContent = "Start Game"
    
    def toggle_pause(self):
        """Toggle game pause state."""
        if not self.started or self.game_over:
            return
        
        self.paused = not self.paused
        
        if self.paused:
            # Draw pause screen
            self.renderer.draw_pause_screen()
        else:
            # Resume game
            self.last_drop_time = window.performance.now()
            self.draw()
    
    def game_loop(self, timestamp):
        """Main game loop."""
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
    
    def draw(self):
        """Draw the game state."""
        self.renderer.draw_board(self.board)
        
        # Draw current piece
        if self.current_piece:
            self.renderer.draw_piece(self.current_piece, self.current_x, self.current_y)
        
        # Draw next piece
        if self.next_piece:
            self.renderer.draw_next_piece(self.next_piece)
    
    def update_score(self):
        """Update the score display."""
        self.score_element.textContent = str(self.score)
        self.level_element.textContent = str(self.level)
        self.lines_element.textContent = str(self.board.lines_cleared)
    
    def move_left(self):
        """Move the current piece left."""
        if not self.started or self.paused or self.game_over:
            return
        
        if self.is_valid_move(self.current_x - 1, self.current_y):
            self.current_x -= 1
            self.draw()
    
    def move_right(self):
        """Move the current piece right."""
        if not self.started or self.paused or self.game_over:
            return
        
        if self.is_valid_move(self.current_x + 1, self.current_y):
            self.current_x += 1
            self.draw()
    
    def move_down(self):
        """Move the current piece down."""
        if not self.started or self.paused or self.game_over:
            return
        
        if self.is_valid_move(self.current_x, self.current_y + 1):
            self.current_y += 1
            self.draw()
            return True
        else:
            # Lock the piece in place
            self.lock_piece()
            return False
    
    def hard_drop(self):
        """Drop the piece to the bottom."""
        if not self.started or self.paused or self.game_over:
            return
        
        # Move down until it hits something
        drop_distance = 0
        while self.is_valid_move(self.current_x, self.current_y + 1):
            self.current_y += 1
            drop_distance += 1
        
        # Add bonus points for hard drop
        self.score += drop_distance
        
        # Lock the piece
        self.lock_piece()
    
    def rotate(self):
        """Rotate the current piece."""
        if not self.started or self.paused or self.game_over or not self.current_piece:
            return
        
        # Get the rotated shape
        rotated_piece = self.current_piece.get_rotated()
        
        # Try standard rotation
        if self.is_valid_move(self.current_x, self.current_y, rotated_piece):
            self.current_piece = rotated_piece
            self.draw()
            return
        
        # Try wall kicks
        # First try moving left/right
        for dx in [-1, 1, -2, 2]:
            if self.is_valid_move(self.current_x + dx, self.current_y, rotated_piece):
                self.current_x += dx
                self.current_piece = rotated_piece
                self.draw()
                return
        
        # Then try moving up (for I piece)
        if self.is_valid_move(self.current_x, self.current_y - 1, rotated_piece):
            self.current_y -= 1
            self.current_piece = rotated_piece
            self.draw()
            return
    
    def is_valid_move(self, x, y, piece=None):
        """Check if a move is valid."""
        if not piece:
            piece = self.current_piece
        
        if not piece:
            return False
        
        # Check each block of the piece
        for row in range(len(piece.shape)):
            for col in range(len(piece.shape[row])):
                if piece.shape[row][col]:
                    # Check if out of bounds
                    if (y + row < 0 or y + row >= self.board.rows or
                        x + col < 0 or x + col >= self.board.cols):
                        return False
                    
                    # Check if overlapping with existing blocks
                    if self.board.grid[y + row][x + col] != 0:
                        return False
        
        return True
    
    def lock_piece(self):
        """Lock the current piece in place and generate a new one."""
        # Add the piece to the board
        for row in range(len(self.current_piece.shape)):
            for col in range(len(self.current_piece.shape[row])):
                if self.current_piece.shape[row][col]:
                    self.board.grid[self.current_y + row][self.current_x + col] = self.current_piece.type
        
        # Check for completed lines
        lines_cleared = self.board.clear_lines()
        
        if lines_cleared > 0:
            # Calculate score based on number of lines cleared
            points = POINTS_PER_LINE[min(lines_cleared, len(POINTS_PER_LINE) - 1)] * self.level
            self.score += points
            
            # Check for level up
            if self.board.lines_cleared >= self.level * LEVEL_UP_LINES:
                self.level += 1
                self.drop_interval = max(DEFAULT_DROP_INTERVAL - (self.level - 1) * LEVEL_SPEED_FACTOR, 100)
            
            # Update score display
            self.update_score()
        
        # Generate new piece
        self.current_piece = self.next_piece
        self.next_piece = Piece.generate_random()
        
        # Starting position (centered at top)
        self.current_x = int((self.board.cols - len(self.current_piece.shape[0])) / 2)
        self.current_y = 0
        
        # Check if the new piece can be placed
        if not self.is_valid_move(self.current_x, self.current_y):
            self.game_over = True
            self.save_score()
            self.renderer.draw_game_over_screen(self.score, self.level, self.board.lines_cleared)
    
    def save_score(self):
        """Save the score to the server."""
        try:
            # Prompt for player name
            player_name = window.prompt(f"Game Over! Your score: {self.score}\nEnter your name:", "Player")
            
            if not player_name:
                player_name = "Anonymous"
            
            # Save score using the high score manager
            self.high_score_manager.prompt_for_name(self.score, self.level, self.board.lines_cleared)
        except Exception as e:
            print(f"Error saving score: {str(e)}")

# Function to initialize the game
def init_game():
    """Initialize the Tetris game."""
    return TetrisGame()

# Main function to start the game when the page loads
def main():
    """Main function to start the game."""
    def on_load(event):
        global tetris_game
        tetris_game = init_game()
    
    # Check if document is already loaded
    if document.readyState == "complete":
        on_load(None)
    else:
        # Set up load event listener
        load_proxy = create_proxy(on_load)
        window.addEventListener("load", load_proxy)

# Initialize global game variable
tetris_game = None

# Run the main function
if __name__ == "__main__":
    main()
