"""
Module for handling API interactions with the Tetris server.
Provides functions for fetching and saving high scores.
"""

from js import fetch, console, window
import json
from pyodide.ffi import to_js

class TetrisAPI:
    """
    Handles API interactions with the Tetris server.
    """
    
    def __init__(self, base_url=None):
        """
        Initialize the API handler.
        
        Args:
            base_url: Base URL for API endpoints (default: current domain)
        """
        self.base_url = base_url or window.location.origin
        console.log(f"TetrisAPI initialized with base URL: {self.base_url}")
    
    async def get_scores(self):
        """
        Fetch high scores from the server.
        
        Returns:
            list: List of high score objects
        """
        try:
            api_url = f"{self.base_url}/api/scores"
            console.log(f"Fetching scores from: {api_url}")
            
            response = await fetch(api_url)
            
            if response.ok:
                data = await response.json()
                console.log(f"Received high scores data: {json.dumps(data)[:100]}...")
                
                # Handle different response formats
                if isinstance(data, list):
                    console.log(f"Loaded {len(data)} scores (array format)")
                    return data
                elif isinstance(data, dict) and "highScores" in data and isinstance(data["highScores"], list):
                    console.log(f"Loaded {len(data['highScores'])} scores (object format)")
                    return data["highScores"]
                else:
                    console.error("Invalid high scores data format:", data)
                    return []
            else:
                console.error(f"Error fetching scores: {response.status} {response.statusText}")
                return []
        except Exception as e:
            console.error(f"Exception fetching scores: {str(e)}")
            return []
    
    async def save_score(self, score_data):
        """
        Save a score to the server.
        
        Args:
            score_data: Score data object or list of score data objects
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Ensure score_data is a list
            if not isinstance(score_data, list):
                score_data = [score_data]
            
            api_url = f"{self.base_url}/api/scores"
            console.log(f"Saving score to: {api_url}")
            console.log(f"Score data: {json.dumps(score_data)}")
            
            # Send to server
            response = await fetch(api_url, {
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": json.dumps(score_data)
            })
            
            if response.ok:
                console.log("Score saved successfully")
                return True
            else:
                console.error(f"Error saving score: {response.status} {response.statusText}")
                
                # Try to get error message from response
                try:
                    error_data = await response.json()
                    console.error("Error details:", error_data)
                except:
                    pass
                
                return False
        except Exception as e:
            console.error(f"Exception saving score: {str(e)}")
            return False
    
    async def test_connection(self):
        """
        Test the connection to the server.
        
        Returns:
            bool: True if connection is successful, False otherwise
        """
        try:
            api_url = f"{self.base_url}/api/test"
            console.log(f"Testing connection to: {api_url}")
            
            response = await fetch(api_url)
            
            if response.ok:
                console.log("Server connection test successful")
                return True
            else:
                console.error(f"Server connection test failed: {response.status} {response.statusText}")
                return False
        except Exception as e:
            console.error(f"Server connection test exception: {str(e)}")
            return False
