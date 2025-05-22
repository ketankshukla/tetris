from tetris_constants import SHAPES
import random

class Piece:
    """
    Represents a Tetris piece (tetromino).
    Handles piece generation, rotation, and movement.
    """
    
    def __init__(self, piece_type=None):
        """
        Initialize a new tetromino piece.
        
        Args:
            piece_type: Type index of the piece (1-7), or None for random
        """
        self.type = piece_type if piece_type is not None else self.random_piece_type()
        self.shape = SHAPES[self.type]
        self.rotation = 0  # Current rotation state (0, 1, 2, 3)
    
    @staticmethod
    def random_piece_type():
        """Generate a random piece type (1-7)."""
        return random.randint(1, 7)
    
    def rotate(self, clockwise=True):
        """
        Rotate the piece.
        
        Args:
            clockwise: True for clockwise rotation, False for counterclockwise
            
        Returns:
            list: The rotated shape
        """
        # Special case for O piece (square) - no rotation needed
        if self.type == 4:  # O piece
            return self.shape
        
        # Get current shape
        current = self.shape
        
        # Calculate new dimensions
        rows = len(current)
        cols = len(current[0])
        
        # Create a new matrix for the rotated shape
        rotated = [[0 for _ in range(rows)] for _ in range(cols)]
        
        if clockwise:
            # Clockwise rotation
            for r in range(rows):
                for c in range(cols):
                    rotated[c][rows - 1 - r] = current[r][c]
        else:
            # Counter-clockwise rotation
            for r in range(rows):
                for c in range(cols):
                    rotated[cols - 1 - c][r] = current[r][c]
        
        # Update shape and rotation state
        self.shape = rotated
        self.rotation = (self.rotation + (1 if clockwise else 3)) % 4
        
        return self.shape
    
    def get_wall_kick_tests(self, prev_rotation, new_rotation):
        """
        Get wall kick test offsets for rotation.
        These are the standard SRS (Super Rotation System) offsets.
        
        Args:
            prev_rotation: Previous rotation state (0-3)
            new_rotation: New rotation state (0-3)
            
        Returns:
            list: List of (x, y) offset pairs to test
        """
        # I piece has different wall kick data
        if self.type == 1:  # I piece
            # I piece wall kick data (SRS)
            wall_kicks = [
                [(0, 0), (-2, 0), (1, 0), (-2, -1), (1, 2)],  # 0->1
                [(0, 0), (-1, 0), (2, 0), (-1, 2), (2, -1)],  # 1->2
                [(0, 0), (2, 0), (-1, 0), (2, 1), (-1, -2)],  # 2->3
                [(0, 0), (1, 0), (-2, 0), (1, -2), (-2, 1)]   # 3->0
            ]
        else:
            # Wall kick data for J, L, S, T, Z pieces (SRS)
            wall_kicks = [
                [(0, 0), (-1, 0), (-1, 1), (0, -2), (-1, -2)],  # 0->1
                [(0, 0), (1, 0), (1, -1), (0, 2), (1, 2)],      # 1->2
                [(0, 0), (1, 0), (1, 1), (0, -2), (1, -2)],     # 2->3
                [(0, 0), (-1, 0), (-1, -1), (0, 2), (-1, 2)]    # 3->0
            ]
        
        # Calculate the rotation transition index
        transition = (prev_rotation, new_rotation)
        if transition == (0, 1) or transition == (2, 3):
            return wall_kicks[0]
        elif transition == (1, 2) or transition == (3, 0):
            return wall_kicks[1]
        elif transition == (2, 1) or transition == (0, 3):
            return wall_kicks[2]
        elif transition == (3, 2) or transition == (1, 0):
            return wall_kicks[3]
        
        # Default case
        return [(0, 0)]
