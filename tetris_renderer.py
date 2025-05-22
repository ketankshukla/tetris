from tetris_constants import COLORS, BLOCK_SIZE

class Renderer:
    """
    Handles rendering the Tetris game to the canvas.
    """
    
    def __init__(self, main_canvas, next_canvas):
        """
        Initialize the renderer with canvas references.
        
        Args:
            main_canvas: The main game canvas
            next_canvas: The preview canvas for the next piece
        """
        self.canvas = main_canvas
        self.ctx = main_canvas.getContext("2d")
        self.next_canvas = next_canvas
        self.next_ctx = next_canvas.getContext("2d")
    
    def clear_canvas(self):
        """Clear the main game canvas."""
        self.ctx.fillStyle = "#000000"
        self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height)
    
    def clear_next_canvas(self):
        """Clear the next piece preview canvas."""
        self.next_ctx.fillStyle = "#000000"
        self.next_ctx.fillRect(0, 0, self.next_canvas.width, self.next_canvas.height)
    
    def draw_block(self, x, y, color_idx, context=None, size=None, color=None):
        """
        Draw a single block on the canvas.
        
        Args:
            x: X coordinate in grid units
            y: Y coordinate in grid units
            color_idx: Index of the color to use
            context: Canvas context to draw on (default: main canvas)
            size: Size of the block (default: BLOCK_SIZE)
            color: Color to use (default: from COLORS array)
        """
        ctx = context or self.ctx
        block_size = size or BLOCK_SIZE
        block_color = color or COLORS[color_idx]
        
        # Draw the block
        ctx.fillStyle = block_color
        ctx.fillRect(x * block_size, y * block_size, block_size, block_size)
        
        # Draw the border
        ctx.strokeStyle = "#FFFFFF"
        ctx.strokeRect(x * block_size, y * block_size, block_size, block_size)
        
        # Add shading for 3D effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"
        ctx.fillRect(x * block_size, y * block_size, block_size / 10, block_size)
        ctx.fillRect(x * block_size, y * block_size, block_size, block_size / 10)
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
        ctx.fillRect(x * block_size + block_size - block_size / 10, y * block_size, block_size / 10, block_size)
        ctx.fillRect(x * block_size, y * block_size + block_size - block_size / 10, block_size, block_size / 10)
    
    def draw_board(self, board):
        """
        Draw the game board.
        
        Args:
            board: 2D array representing the game board
        """
        self.clear_canvas()
        
        # Draw the grid
        for y in range(len(board)):
            for x in range(len(board[y])):
                if board[y][x]:
                    self.draw_block(x, y, board[y][x])
    
    def draw_piece(self, piece, x, y):
        """
        Draw a piece on the main canvas.
        
        Args:
            piece: The tetromino shape to draw
            x: X coordinate of the piece
            y: Y coordinate of the piece
        """
        for row_idx, row in enumerate(piece.shape):
            for col_idx, cell in enumerate(row):
                if cell:
                    self.draw_block(x + col_idx, y + row_idx, piece.type)
    
    def draw_next_piece(self, piece):
        """
        Draw the next piece on the preview canvas.
        
        Args:
            piece: The next tetromino piece
        """
        self.clear_next_canvas()
        
        # Use smaller blocks for the preview
        block_size = 20
        
        # Center the piece in the canvas
        shape = piece.shape
        offset_x = (self.next_canvas.width - len(shape[0]) * block_size) / 2
        offset_y = (self.next_canvas.height - len(shape) * block_size) / 2
        
        # Draw each block of the piece
        for y, row in enumerate(shape):
            for x, cell in enumerate(row):
                if cell:
                    # Draw directly with pixel coordinates
                    self.next_ctx.fillStyle = COLORS[piece.type]
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
    
    def draw_game_over(self):
        """Draw the game over screen."""
        # Semi-transparent overlay
        self.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height)
        
        # Game over text
        self.ctx.fillStyle = "#FF0000"
        self.ctx.font = "bold 48px Arial"
        self.ctx.textAlign = "center"
        self.ctx.fillText("GAME OVER", self.canvas.width / 2, self.canvas.height / 2 - 24)
        
        # Instructions to restart
        self.ctx.fillStyle = "#FFFFFF"
        self.ctx.font = "24px Arial"
        self.ctx.fillText("Press S to play again", self.canvas.width / 2, self.canvas.height / 2 + 24)
    
    def draw_pause_screen(self):
        """Draw the pause screen."""
        # Semi-transparent overlay
        self.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height)
        
        # Pause text
        self.ctx.fillStyle = "#FFFFFF"
        self.ctx.font = "bold 48px Arial"
        self.ctx.textAlign = "center"
        self.ctx.fillText("PAUSED", self.canvas.width / 2, self.canvas.height / 2 - 24)
        
        # Instructions to resume
        self.ctx.fillStyle = "#FFFFFF"
        self.ctx.font = "24px Arial"
        self.ctx.fillText("Press P to resume", self.canvas.width / 2, self.canvas.height / 2 + 24)
    
    def draw_welcome_screen(self):
        """Draw the welcome screen."""
        # Clear the canvas
        self.clear_canvas()
        
        # Background
        self.ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        self.ctx.fillRect(0, 0, self.canvas.width, self.canvas.height)
        
        # Title
        self.ctx.fillStyle = "#00BFFF"
        self.ctx.font = "bold 48px Arial"
        self.ctx.textAlign = "center"
        self.ctx.fillText("TETRIS", self.canvas.width / 2, self.canvas.height / 3)
        
        # Instructions
        self.ctx.fillStyle = "#FFFFFF"
        self.ctx.font = "24px Arial"
        self.ctx.fillText("Press S to start", self.canvas.width / 2, self.canvas.height / 2)
        
        # Controls
        self.ctx.font = "16px Arial"
        self.ctx.fillText("← → : Move", self.canvas.width / 2, self.canvas.height / 2 + 40)
        self.ctx.fillText("↑ : Rotate", self.canvas.width / 2, self.canvas.height / 2 + 70)
        self.ctx.fillText("↓ : Soft Drop", self.canvas.width / 2, self.canvas.height / 2 + 100)
        self.ctx.fillText("Space : Hard Drop", self.canvas.width / 2, self.canvas.height / 2 + 130)
        self.ctx.fillText("P : Pause", self.canvas.width / 2, self.canvas.height / 2 + 160)
