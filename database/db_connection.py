import sqlite3
import os
from typing import List, Dict, Any, Optional, Union, Tuple
import logging

class DatabaseConnection:
    """
    Database connection manager with connection pooling
    """
    
    def __init__(self, db_path: str, max_connections: int = 5):
        """
        Initialize database connection pool
        
        Args:
            db_path: Path to SQLite database file
            max_connections: Maximum number of connections in the pool
        """
        self.db_path = db_path
        self.max_connections = max_connections
        self.connection_pool = []
        self.logger = logging.getLogger(__name__)
        
        # Create database directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Initialize connection pool
        self._initialize_pool()
        
        # Create tables if they don't exist
        self._create_tables()
    
    def _initialize_pool(self) -> None:
        """Initialize the connection pool with connections"""
        for _ in range(self.max_connections):
            conn = sqlite3.connect(self.db_path)
            # Enable row factory to get dictionary-like results
            conn.row_factory = sqlite3.Row
            self.connection_pool.append(conn)
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get a connection from the pool or create a new one if empty"""
        if not self.connection_pool:
            self.logger.warning("Connection pool exhausted, creating new connection")
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            return conn
            
        return self.connection_pool.pop()
    
    def _release_connection(self, conn: sqlite3.Connection) -> None:
        """Return a connection to the pool"""
        if len(self.connection_pool) < self.max_connections:
            self.connection_pool.append(conn)
        else:
            conn.close()
    
    def _create_tables(self) -> None:
        """Create necessary tables if they don't exist"""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash BLOB NOT NULL,
                salt BLOB NOT NULL,
                created_at TIMESTAMP NOT NULL,
                last_login TIMESTAMP,
                reset_token TEXT,
                reset_token_expiry TIMESTAMP
            )
            ''')
            
            # Add more table creation statements as needed
            
            conn.commit()
        except Exception as e:
            self.logger.error(f"Error creating tables: {e}")
            conn.rollback()
            raise
        finally:
            self._release_connection(conn)
    
    def query(self, query: str, params: Tuple = ()) -> Union[List[Dict[str, Any]], Dict[str, Any], None]:
        """
        Execute a SELECT query and return results
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            Query results as dict or list of dicts, or None if no results
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            results = cursor.fetchall()
            
            if not results:
                return None
                
            # Convert row objects to dictionaries
            if len(results) == 1:
                return {k: results[0][k] for k in results[0].keys()}
            
            return [{k: row[k] for k in row.keys()} for row in results]
            
        except Exception as e:
            self.logger.error(f"Query error: {e}")
            raise
        finally:
            self._release_connection(conn)
    
    def execute(self, query: str, params: Tuple = ()) -> Optional[int]:
        """
        Execute a non-SELECT query (INSERT, UPDATE, DELETE)
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            Last row ID for INSERT, or None for other operations
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            conn.commit()
            
            # Return last row id for INSERT operations
            if query.strip().upper().startswith("INSERT"):
                return cursor.lastrowid
            return None
            
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Execute error: {e}")
            raise
        finally:
            self._release_connection(conn)
    
    def batch_execute(self, queries: List[Tuple[str, Tuple]]) -> None:
        """
        Execute multiple queries in a single transaction
        
        Args:
            queries: List of (query, params) tuples
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            for query, params in queries:
                cursor.execute(query, params)
            conn.commit()
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Batch execute error: {e}")
            raise
        finally:
            self._release_connection(conn)
    
    def close_all(self) -> None:
        """Close all connections in the pool"""
        for conn in self.connection_pool:
            conn.close()
        self.connection_pool = []