"""Redis-based state management for conversation flows."""
import redis.asyncio as redis
import json
from typing import Optional, Dict, Any
import logging
from datetime import timedelta
from models.schema import ConversationState

logger = logging.getLogger(__name__)


class StateManager:
    """Manages conversation state using Redis."""
    
    def __init__(self, redis_url: str, default_ttl: int = 3600):
        """
        Initialize state manager.
        
        Args:
            redis_url: Redis connection URL
            default_ttl: Default TTL for state in seconds
        """
        self.redis_url = redis_url
        self.default_ttl = default_ttl
        self.client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Establish connection to Redis."""
        try:
            self.client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.client.ping()
            logger.info("Successfully connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def disconnect(self):
        """Close Redis connection."""
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")
    
    async def health_check(self) -> bool:
        """
        Check if Redis connection is healthy.
        
        Returns:
            True if connection is healthy, False otherwise
        """
        try:
            await self.client.ping()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    def _get_key(self, session_id: str) -> str:
        """
        Generate Redis key for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Redis key
        """
        return f"conversation:{session_id}"
    
    async def save_state(
        self,
        state: ConversationState,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Save conversation state to Redis.
        
        Args:
            state: Conversation state to save
            ttl: Time to live in seconds (optional)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = self._get_key(state.session_id)
            value = state.model_dump_json()
            
            ttl = ttl or self.default_ttl
            
            await self.client.setex(
                key,
                timedelta(seconds=ttl),
                value
            )
            
            logger.info(f"State saved for session: {state.session_id}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to save state: {e}")
            return False
    
    async def get_state(self, session_id: str) -> Optional[ConversationState]:
        """
        Get conversation state from Redis.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Conversation state or None if not found
        """
        try:
            key = self._get_key(session_id)
            value = await self.client.get(key)
            
            if not value:
                logger.info(f"No state found for session: {session_id}")
                return None
            
            state = ConversationState.model_validate_json(value)
            logger.info(f"State retrieved for session: {session_id}")
            return state
        
        except Exception as e:
            logger.error(f"Failed to get state: {e}")
            return None
    
    async def delete_state(self, session_id: str) -> bool:
        """
        Delete conversation state from Redis.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = self._get_key(session_id)
            await self.client.delete(key)
            
            logger.info(f"State deleted for session: {session_id}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to delete state: {e}")
            return False
    
    async def update_state(
        self,
        session_id: str,
        updates: Dict[str, Any]
    ) -> Optional[ConversationState]:
        """
        Update specific fields in conversation state.
        
        Args:
            session_id: Session identifier
            updates: Dictionary of fields to update
            
        Returns:
            Updated conversation state or None if not found
        """
        state = await self.get_state(session_id)
        
        if not state:
            return None
        
        # Update fields
        for key, value in updates.items():
            if hasattr(state, key):
                setattr(state, key, value)
        
        # Save updated state
        await self.save_state(state)
        
        return state
    
    async def extend_ttl(self, session_id: str, ttl: int) -> bool:
        """
        Extend the TTL of a conversation state.
        
        Args:
            session_id: Session identifier
            ttl: New TTL in seconds
            
        Returns:
            True if successful, False otherwise
        """
        try:
            key = self._get_key(session_id)
            await self.client.expire(key, ttl)
            
            logger.info(f"TTL extended for session: {session_id}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to extend TTL: {e}")
            return False


# Global instance
state_manager: Optional[StateManager] = None


def get_state_manager() -> StateManager:
    """Get the global state manager instance."""
    if state_manager is None:
        raise RuntimeError("State manager not initialized")
    return state_manager
