"""
Module for handling Tetris high scores.
Provides functions for loading, saving, and displaying high scores.
"""

from js import document, window, console, fetch
from pyodide.ffi import create_proxy
import json
import asyncio

class HighScoreManager:
    """
    Manages high scores for the Tetris game.
    Handles loading, saving, and displaying high scores.
    """
    
    def __init__(self, score_container_id="high-scores-body"):
        """
        Initialize the high score manager.
        
        Args:
            score_container_id: ID of the HTML element to display scores in
        """
        self.scores = []
        self.score_container_id = score_container_id
        self.score_container = document.getElementById(score_container_id)
        self.table_container = document.getElementById("high-scores-table-container")
        
        # Set up sorting functionality
        self.current_sort_column = "score"
        self.current_sort_direction = "desc"
        
        # Load scores immediately on initialization
        asyncio.ensure_future(self.load_scores())
    
    async def load_scores(self):
        """
        Load high scores from the server.
        
        Returns:
            list: The loaded high scores
        """
        try:
            console.log("Loading high scores from server...")
            
            # Get API URL with window.location.origin to ensure it works both locally and on deployed site
            api_url = f"{window.location.origin}/api/scores"
            console.log(f"API URL: {api_url}")
            
            # Fetch scores from the server
            response = await fetch(api_url)
            
            if response.ok:
                # Parse the JSON response
                data = await response.json()
                console.log(f"Received high scores data: {json.dumps(data)}")
                
                # Handle different response formats
                if isinstance(data, list):
                    self.scores = data
                elif isinstance(data, dict) and "highScores" in data and isinstance(data["highScores"], list):
                    self.scores = data["highScores"]
                else:
                    console.error("Invalid high scores data format:", data)
                    self.scores = []
                
                console.log(f"Loaded {len(self.scores)} scores from server")
                
                # Display the scores
                self.display_scores()
                
                return self.scores
            else:
                console.error(f"Error loading scores: {response.status} {response.statusText}")
                return []
        except Exception as e:
            console.error(f"Error loading scores: {str(e)}")
            return []
    
    async def save_score(self, player_name, score, level, lines):
        """
        Save a new high score to the server.
        
        Args:
            player_name: Name of the player
            score: Player's score
            level: Player's level
            lines: Number of lines cleared
            
        Returns:
            bool: True if the score was saved successfully, False otherwise
        """
        try:
            # Create score object
            new_score = {
                "name": player_name,
                "score": score,
                "level": level,
                "lines": lines,
                "date": window.Date().toISOString().split('T')[0]  # Current date in YYYY-MM-DD format
            }
            
            # Get API URL with window.location.origin
            api_url = f"{window.location.origin}/api/scores"
            console.log(f"Saving score to: {api_url}")
            
            # Send score to server
            response = await fetch(api_url, {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": json.dumps([new_score])
            })
            
            if response.ok:
                console.log("Score saved successfully")
                
                # Add to local scores and sort
                self.scores.append(new_score)
                self.sort_scores(self.current_sort_column, self.current_sort_direction)
                
                # Update display
                self.display_scores()
                
                return True
            else:
                console.error(f"Error saving score: {response.status} {response.statusText}")
                return False
        except Exception as e:
            console.error(f"Error saving score: {str(e)}")
            return False
    
    def sort_scores(self, column, direction):
        """
        Sort the scores based on the specified column and direction.
        
        Args:
            column: Column to sort by (name, score, level, lines, date)
            direction: Sort direction (asc, desc)
        """
        if not self.scores:
            return
        
        # Define comparison function based on column
        def get_value(score, col):
            if col == "name":
                return score.get("name", "").lower()
            elif col in ["score", "level", "lines"]:
                return int(score.get(col, 0))
            elif col == "date":
                return score.get("date", "")
            else:
                return 0
        
        # Sort the scores
        reverse = direction == "desc"
        self.scores.sort(key=lambda x: get_value(x, column), reverse=reverse)
        
        # Update sort state
        self.current_sort_column = column
        self.current_sort_direction = direction
    
    def display_scores(self, max_scores=10):
        """
        Display high scores in the score container.
        
        Args:
            max_scores: Maximum number of scores to display
        """
        if not self.score_container:
            console.error(f"Score container not found with ID: {self.score_container_id}")
            return
        
        # Clear the container
        self.score_container.innerHTML = ""
        
        # Sort scores before displaying
        self.sort_scores(self.current_sort_column, self.current_sort_direction)
        
        if not self.scores or len(self.scores) == 0:
            # No scores to display
            row = document.createElement("tr")
            cell = document.createElement("td")
            cell.colSpan = 5
            cell.style.textAlign = "center"
            cell.textContent = "No high scores yet"
            row.appendChild(cell)
            self.score_container.appendChild(row)
            return
        
        # Add score rows
        for i, score in enumerate(self.scores[:max_scores]):
            row = document.createElement("tr")
            
            # Name
            name_cell = document.createElement("td")
            name_cell.textContent = score.get("name", "Anonymous")
            row.appendChild(name_cell)
            
            # Score
            score_cell = document.createElement("td")
            score_cell.textContent = str(score.get("score", 0))
            row.appendChild(score_cell)
            
            # Level
            level_cell = document.createElement("td")
            level_cell.textContent = str(score.get("level", 1))
            row.appendChild(level_cell)
            
            # Lines
            lines_cell = document.createElement("td")
            lines_cell.textContent = str(score.get("lines", 0))
            row.appendChild(lines_cell)
            
            # Date
            date_cell = document.createElement("td")
            date_cell.textContent = score.get("date", "N/A")
            row.appendChild(date_cell)
            
            self.score_container.appendChild(row)
        
        # Set up sorting functionality
        self.setup_sorting()
    
    def setup_sorting(self):
        """Set up sorting functionality for the high scores table."""
        # Find all sortable headers
        headers = document.querySelectorAll("th[data-sort]")
        
        # Add click event listeners to headers
        for header in headers:
            column = header.getAttribute("data-sort")
            
            # Add sort indicator if this is the current sort column
            if column == self.current_sort_column:
                header.className = f"sort-{self.current_sort_direction}"
            
            # Add click event for sorting (only if not already added)
            if not hasattr(header, "_sort_listener_added"):
                header._sort_listener_added = True
                header.addEventListener("click", create_proxy(lambda event, col=column: self.handle_sort_click(col)))
    
    def handle_sort_click(self, column):
        """
        Handle click on a sortable column header.
        
        Args:
            column: Column to sort by
        """
        # Toggle direction if clicking the same column
        if column == self.current_sort_column:
            new_direction = "asc" if self.current_sort_direction == "desc" else "desc"
        else:
            # Default to descending for score, level, lines; ascending for others
            new_direction = "desc" if column in ["score", "level", "lines"] else "asc"
        
        # Sort and update display
        self.sort_scores(column, new_direction)
        self.display_scores()
    
    def prompt_for_name(self, score, level, lines):
        """
        Prompt the player for their name and save their score.
        
        Args:
            score: Player's score
            level: Player's level
            lines: Number of lines cleared
        """
        # Prompt for name
        player_name = window.prompt(f"Game Over! Your score: {score}\nEnter your name:", "Player")
        
        if not player_name:
            player_name = "Anonymous"
        
        # Save score asynchronously
        asyncio.ensure_future(self.save_score(player_name, score, level, lines))
        
        return player_name
