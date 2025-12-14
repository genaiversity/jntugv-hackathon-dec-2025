"""Authentication and authorization utilities."""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthHandler:
    """Handles authentication and authorization."""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        """
        Initialize auth handler.
        
        Args:
            secret_key: Secret key for JWT encoding
            algorithm: JWT algorithm
        """
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def hash_password(self, password: str) -> str:
        """
        Hash a password.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.
        
        Args:
            plain_password: Plain text password
            hashed_password: Hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(
        self,
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Data to encode in the token
            expires_delta: Token expiration time
            
        Returns:
            Encoded JWT token
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        
        return encoded_jwt
    
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Decode and verify a JWT token.
        
        Args:
            token: JWT token to decode
            
        Returns:
            Decoded token data or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        
        except JWTError as e:
            logger.error(f"Failed to decode token: {e}")
            return None
    
    def verify_token(self, token: str) -> bool:
        """
        Verify if a token is valid.
        
        Args:
            token: JWT token to verify
            
        Returns:
            True if token is valid, False otherwise
        """
        payload = self.decode_token(token)
        return payload is not None
