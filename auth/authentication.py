import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class AuthenticationManager:
    """
    Manages user authentication including registration, login, and session handling.
    """
    
    def __init__(self, db_connection):
        """Initialize with database connection"""
        self.db = db_connection
        self.session_store = {}  # In production, use Redis or similar
        self.token_expiry = timedelta(hours=24)
    
    def register_user(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """
        Register a new user with hashed password
        """
        # Check if user already exists
        existing_user = self.db.query("SELECT * FROM users WHERE username = ? OR email = ?", 
                                     (username, email))
        
        if existing_user:
            return {"success": False, "message": "Username or email already exists"}
        
        # Generate salt and hash password
        salt = os.urandom(32)
        hashed_password = self._hash_password(password, salt)
        
        # Store user in database
        try:
            user_id = self.db.execute(
                "INSERT INTO users (username, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
                (username, email, hashed_password, salt, datetime.now())
            )
            return {
                "success": True,
                "user_id": user_id,
                "message": "User registered successfully"
            }
        except Exception as e:
            return {"success": False, "message": f"Registration failed: {str(e)}"}
    
    def login(self, username_or_email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user and create session
        """
        # Get user from database
        user = self.db.query(
            "SELECT * FROM users WHERE username = ? OR email = ?", 
            (username_or_email, username_or_email)
        )
        
        if not user:
            return {"success": False, "message": "Invalid username or password"}
        
        # Verify password
        stored_hash = user["password_hash"]
        salt = user["salt"]
        computed_hash = self._hash_password(password, salt)
        
        if stored_hash != computed_hash:
            return {"success": False, "message": "Invalid username or password"}
        
        # Create session token
        token = self._generate_token()
        expiry = datetime.now() + self.token_expiry
        
        # Store session
        self.session_store[token] = {
            "user_id": user["id"],
            "expiry": expiry
        }
        
        return {
            "success": True,
            "token": token,
            "user_id": user["id"],
            "expiry": expiry,
            "username": user["username"]
        }
    
    def logout(self, token: str) -> Dict[str, Any]:
        """
        Invalidate user session
        """
        if token in self.session_store:
            del self.session_store[token]
            return {"success": True, "message": "Logged out successfully"}
        return {"success": False, "message": "Invalid session"}
    
    def verify_session(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify if session is valid and not expired
        """
        session = self.session_store.get(token)
        if not session:
            return None
        
        if session["expiry"] < datetime.now():
            del self.session_store[token]
            return None
        
        return session
    
    def reset_password_request(self, email: str) -> Dict[str, Any]:
        """
        Generate password reset token and send to user
        """
        user = self.db.query("SELECT * FROM users WHERE email = ?", (email,))
        if not user:
            # Return success regardless to prevent email enumeration
            return {"success": True, "message": "If your email exists, you will receive reset instructions"}
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expiry = datetime.now() + timedelta(hours=1)
        
        # Store reset token
        self.db.execute(
            "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
            (reset_token, expiry, user["id"])
        )
        
        # In a real app, you would send an email here
        return {"success": True, "message": "Password reset instructions sent",
                "debug_token": reset_token}  # Remove in production
    
    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """
        Reset user password using token
        """
        user = self.db.query(
            "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?",
            (token, datetime.now())
        )
        
        if not user:
            return {"success": False, "message": "Invalid or expired reset token"}
        
        # Generate new password hash
        salt = os.urandom(32)
        hashed_password = self._hash_password(new_password, salt)
        
        # Update password and clear reset token
        self.db.execute(
            "UPDATE users SET password_hash = ?, salt = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
            (hashed_password, salt, user["id"])
        )
        
        return {"success": True, "message": "Password reset successfully"}
    
    def _hash_password(self, password: str, salt: bytes) -> bytes:
        """
        Create salted password hash using PBKDF2
        """
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000,  # Number of iterations
            dklen=128  # Length of the derived key
        )
        return key
    
    def _generate_token(self) -> str:
        """
        Generate secure random token for session
        """
        return secrets.token_urlsafe(32)