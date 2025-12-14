"""Slack API integration tool."""
from typing import Dict, Any, List, Optional
import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

logger = logging.getLogger(__name__)


class SlackTool:
    """Slack API tool for messaging and channel management."""
    
    def __init__(self, token: str):
        """
        Initialize Slack tool.
        
        Args:
            token: Slack bot token
        """
        self.client = WebClient(token=token)
    
    def send_message(
        self,
        channel: str,
        text: str,
        thread_ts: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a message to a Slack channel.
        
        Args:
            channel: Channel ID or name
            text: Message text
            thread_ts: Thread timestamp for replying to a thread
            
        Returns:
            Message response
        """
        try:
            response = self.client.chat_postMessage(
                channel=channel,
                text=text,
                thread_ts=thread_ts
            )
            
            logger.info(f"Message sent to channel {channel}")
            return response.data
        
        except SlackApiError as e:
            logger.error(f"Failed to send Slack message: {e.response['error']}")
            raise
    
    def send_direct_message(self, user_id: str, text: str) -> Dict[str, Any]:
        """
        Send a direct message to a user.
        
        Args:
            user_id: User ID
            text: Message text
            
        Returns:
            Message response
        """
        try:
            # Open a DM channel with the user
            response = self.client.conversations_open(users=[user_id])
            channel_id = response['channel']['id']
            
            # Send message to the DM channel
            return self.send_message(channel_id, text)
        
        except SlackApiError as e:
            logger.error(f"Failed to send direct message: {e.response['error']}")
            raise
    
    def upload_file(
        self,
        channels: List[str],
        file_path: str,
        title: Optional[str] = None,
        initial_comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload a file to Slack channels.
        
        Args:
            channels: List of channel IDs
            file_path: Path to file to upload
            title: File title
            initial_comment: Initial comment with the file
            
        Returns:
            Upload response
        """
        try:
            response = self.client.files_upload_v2(
                channels=','.join(channels),
                file=file_path,
                title=title,
                initial_comment=initial_comment
            )
            
            logger.info(f"File uploaded to channels: {channels}")
            return response.data
        
        except SlackApiError as e:
            logger.error(f"Failed to upload file: {e.response['error']}")
            raise
    
    def get_channel_history(
        self,
        channel: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get channel message history.
        
        Args:
            channel: Channel ID
            limit: Maximum number of messages to retrieve
            
        Returns:
            List of messages
        """
        try:
            response = self.client.conversations_history(
                channel=channel,
                limit=limit
            )
            
            messages = response['messages']
            logger.info(f"Retrieved {len(messages)} messages from channel {channel}")
            return messages
        
        except SlackApiError as e:
            logger.error(f"Failed to get channel history: {e.response['error']}")
            raise
    
    def list_channels(self) -> List[Dict[str, Any]]:
        """
        List all channels the bot has access to.
        
        Returns:
            List of channels
        """
        try:
            response = self.client.conversations_list()
            channels = response['channels']
            
            logger.info(f"Retrieved {len(channels)} channels")
            return channels
        
        except SlackApiError as e:
            logger.error(f"Failed to list channels: {e.response['error']}")
            raise
    
    def get_user_info(self, user_id: str) -> Dict[str, Any]:
        """
        Get user information.
        
        Args:
            user_id: User ID
            
        Returns:
            User information
        """
        try:
            response = self.client.users_info(user=user_id)
            return response['user']
        
        except SlackApiError as e:
            logger.error(f"Failed to get user info: {e.response['error']}")
            raise
