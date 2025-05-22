# Tetris game constants and shapes
# This module contains all the constant values used in the Tetris game

# Board dimensions
COLS = 10
ROWS = 20
BLOCK_SIZE = 30

# Colors for different pieces
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

# Game timing constants
DEFAULT_DROP_INTERVAL = 1000  # milliseconds between automatic downward moves
LEVEL_SPEED_FACTOR = 100  # How much to decrease interval per level

# Scoring constants
POINTS_PER_LINE = 100
LEVEL_UP_LINES = 10  # Lines needed to level up
