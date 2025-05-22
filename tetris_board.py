from tetris_constants import COLS, ROWS

class Board:
    """
    Represents the Tetris game board.
    Handles board state, piece placement, and line clearing.
    """
    
    def __init__(self):
        """Initialize an empty game board."""
        self.grid = self.create_empty_board()
        self.lines_cleared = 0
    
    def create_empty_board(self):
        """Create and return an empty game board."""
        return [[0 for _ in range(COLS)] for _ in range(ROWS)]
    
    def reset(self):
        """Reset the board to its initial empty state."""
        self.grid = self.create_empty_board()
        self.lines_cleared = 0
    
    def is_valid_position(self, piece, piece_x, piece_y):
        """
        Check if a piece can be placed at the given position.
        
        Args:
            piece: The tetromino shape to check
            piece_x: X coordinate of the piece
            piece_y: Y coordinate of the piece
            
        Returns:
            bool: True if the position is valid, False otherwise
        """
        for y in range(len(piece)):
            for x in range(len(piece[y])):
                if piece[y][x]:
                    # Check if the piece is within board boundaries
                    if (piece_x + x < 0 or piece_x + x >= COLS or 
                        piece_y + y < 0 or piece_y + y >= ROWS):
                        return False
                    
                    # Check if the position is already occupied
                    if self.grid[piece_y + y][piece_x + x] != 0:
                        return False
        
        return True
    
    def place_piece(self, piece, piece_x, piece_y, piece_type):
        """
        Place a piece permanently on the board.
        
        Args:
            piece: The tetromino shape to place
            piece_x: X coordinate of the piece
            piece_y: Y coordinate of the piece
            piece_type: Type index of the piece (for coloring)
            
        Returns:
            bool: True if the piece was placed successfully, False otherwise
        """
        if not self.is_valid_position(piece, piece_x, piece_y):
            return False
        
        for y in range(len(piece)):
            for x in range(len(piece[y])):
                if piece[y][x]:
                    self.grid[piece_y + y][piece_x + x] = piece_type
        
        return True
    
    def check_lines(self):
        """
        Check for completed lines and remove them.
        
        Returns:
            int: Number of lines cleared
        """
        lines_to_clear = []
        
        # Find complete lines
        for y in range(ROWS):
            if all(self.grid[y]):
                lines_to_clear.append(y)
        
        # Remove complete lines
        for line in lines_to_clear:
            # Remove the line
            self.grid.pop(line)
            # Add a new empty line at the top
            self.grid.insert(0, [0 for _ in range(COLS)])
        
        # Update lines cleared count
        self.lines_cleared += len(lines_to_clear)
        
        return len(lines_to_clear)
    
    def is_game_over(self, piece, piece_x, piece_y):
        """
        Check if the game is over (can't place a new piece).
        
        Args:
            piece: The new tetromino shape
            piece_x: X coordinate of the new piece
            piece_y: Y coordinate of the new piece
            
        Returns:
            bool: True if the game is over, False otherwise
        """
        return not self.is_valid_position(piece, piece_x, piece_y)
