"""MongoDB client for database operations."""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class MongoDBClient:
    """MongoDB client with connection pooling."""
    
    def __init__(self, connection_string: str, database_name: str):
        """
        Initialize MongoDB client.
        
        Args:
            connection_string: MongoDB connection URI
            database_name: Name of the database to use
        """
        self.connection_string = connection_string
        self.database_name = database_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
    
    async def connect(self):
        """Establish connection to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(self.connection_string)
            self.db = self.client[self.database_name]
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB database: {self.database_name}")
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    def get_collection(self, collection_name: str):
        """
        Get a collection from the database.
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            MongoDB collection object
        """
        if not self.db:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self.db[collection_name]
    
    async def health_check(self) -> bool:
        """
        Check if MongoDB connection is healthy.
        
        Returns:
            True if connection is healthy, False otherwise
        """
        try:
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            return False


# Global instance
mongodb_client: Optional[MongoDBClient] = None


def get_mongodb_client() -> MongoDBClient:
    """Get the global MongoDB client instance."""
    if mongodb_client is None:
        raise RuntimeError("MongoDB client not initialized")
    return mongodb_client
