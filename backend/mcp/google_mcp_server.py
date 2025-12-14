"""MCP Server for Gmail and Calendar integration.

This module provides MCP (Model Context Protocol) server functionality
for real-time Gmail and Calendar operations.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from tools.google_auth import GoogleAuthHandler
from tools.gmail_tool import GmailTool
from tools.calendar_tool import CalendarTool

logger = logging.getLogger(__name__)


class GoogleMCPServer:
    """MCP Server for Google services (Gmail and Calendar)."""
    
    def __init__(
        self,
        credentials_file: str = "credentials.json",
        token_file: str = "token.json"
    ):
        """
        Initialize Google MCP Server.
        
        Args:
            credentials_file: Path to Google OAuth credentials
            token_file: Path to store/load OAuth tokens
        """
        self.auth_handler = GoogleAuthHandler(
            credentials_file=credentials_file,
            token_file=token_file
        )
        self.gmail_tool = GmailTool(self.auth_handler)
        self.calendar_tool = CalendarTool(self.auth_handler)
        self.watch_active = False
        self.gmail_watch_info = None
        self.calendar_watch_info = None
    
    # Gmail MCP Methods
    
    async def gmail_list_messages(
        self,
        max_results: int = 10,
        query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List Gmail messages.
        
        Args:
            max_results: Maximum number of messages to return
            query: Gmail search query
            
        Returns:
            List of messages
        """
        try:
            messages = self.gmail_tool.list_messages(
                max_results=max_results,
                query=query
            )
            logger.info(f"Listed {len(messages)} Gmail messages")
            return messages
        except Exception as e:
            logger.error(f"Failed to list Gmail messages: {e}")
            raise
    
    async def gmail_get_message(self, message_id: str) -> Dict[str, Any]:
        """
        Get a specific Gmail message.
        
        Args:
            message_id: Message identifier
            
        Returns:
            Message details
        """
        try:
            message = self.gmail_tool.get_message(message_id)
            parsed = self.gmail_tool.parse_message(message)
            logger.info(f"Retrieved Gmail message: {message_id}")
            return parsed
        except Exception as e:
            logger.error(f"Failed to get Gmail message: {e}")
            raise
    
    async def gmail_search_messages(
        self,
        query: str,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search Gmail messages.
        
        Args:
            query: Search query
            max_results: Maximum results
            
        Returns:
            List of matching messages
        """
        try:
            messages = self.gmail_tool.search_messages(
                query=query,
                max_results=max_results
            )
            logger.info(f"Found {len(messages)} messages matching '{query}'")
            return messages
        except Exception as e:
            logger.error(f"Failed to search Gmail messages: {e}")
            raise
    
    async def gmail_get_unread(self, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Get unread Gmail messages.
        
        Args:
            max_results: Maximum results
            
        Returns:
            List of unread messages
        """
        try:
            messages = self.gmail_tool.get_unread_messages(max_results=max_results)
            logger.info(f"Retrieved {len(messages)} unread messages")
            return messages
        except Exception as e:
            logger.error(f"Failed to get unread messages: {e}")
            raise
    
    async def gmail_send_email(
        self,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send an email via Gmail.
        
        Args:
            to: Recipient email
            subject: Email subject
            body: Email body
            cc: CC recipients
            bcc: BCC recipients
            
        Returns:
            Sent message details
        """
        try:
            result = self.gmail_tool.send_email(
                to=to,
                subject=subject,
                body=body,
                cc=cc,
                bcc=bcc
            )
            logger.info(f"Sent email to {to}")
            return result
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise
    
    async def gmail_mark_as_read(self, message_id: str) -> Dict[str, Any]:
        """
        Mark a Gmail message as read.
        
        Args:
            message_id: Message identifier
            
        Returns:
            Updated message
        """
        try:
            result = self.gmail_tool.mark_as_read(message_id)
            logger.info(f"Marked message {message_id} as read")
            return result
        except Exception as e:
            logger.error(f"Failed to mark message as read: {e}")
            raise
    
    async def gmail_start_watch(
        self,
        topic_name: str,
        label_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Start watching Gmail for changes.
        
        Args:
            topic_name: Google Cloud Pub/Sub topic name
            label_ids: Labels to watch
            
        Returns:
            Watch response
        """
        try:
            self.gmail_watch_info = self.gmail_tool.watch_mailbox(
                topic_name=topic_name,
                label_ids=label_ids
            )
            self.watch_active = True
            logger.info("Started watching Gmail")
            return self.gmail_watch_info
        except Exception as e:
            logger.error(f"Failed to start Gmail watch: {e}")
            raise
    
    async def gmail_stop_watch(self) -> None:
        """Stop watching Gmail."""
        try:
            self.gmail_tool.stop_watch()
            self.watch_active = False
            self.gmail_watch_info = None
            logger.info("Stopped watching Gmail")
        except Exception as e:
            logger.error(f"Failed to stop Gmail watch: {e}")
            raise
    
    # Calendar MCP Methods
    
    async def calendar_list_events(
        self,
        max_results: int = 10,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        List calendar events.
        
        Args:
            max_results: Maximum results
            start_date: Start date filter
            end_date: End date filter
            
        Returns:
            List of events
        """
        try:
            events = self.calendar_tool.search_events(
                start_date=start_date,
                end_date=end_date,
                max_results=max_results
            )
            logger.info(f"Listed {len(events)} calendar events")
            return events
        except Exception as e:
            logger.error(f"Failed to list calendar events: {e}")
            raise
    
    async def calendar_get_event(self, event_id: str) -> Dict[str, Any]:
        """
        Get a specific calendar event.
        
        Args:
            event_id: Event identifier
            
        Returns:
            Event details
        """
        try:
            event = self.calendar_tool.get_event(event_id)
            logger.info(f"Retrieved calendar event: {event_id}")
            return event
        except Exception as e:
            logger.error(f"Failed to get calendar event: {e}")
            raise
    
    async def calendar_create_event(
        self,
        summary: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a calendar event.
        
        Args:
            summary: Event title
            start_time: Start time
            end_time: End time
            description: Event description
            location: Event location
            attendees: List of attendee emails
            
        Returns:
            Created event details
        """
        try:
            event = self.calendar_tool.create_event(
                summary=summary,
                start_time=start_time,
                end_time=end_time,
                description=description,
                location=location,
                attendees=attendees
            )
            logger.info(f"Created calendar event: {summary}")
            return event
        except Exception as e:
            logger.error(f"Failed to create calendar event: {e}")
            raise
    
    async def calendar_update_event(
        self,
        event_id: str,
        summary: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update a calendar event.
        
        Args:
            event_id: Event identifier
            summary: New title
            start_time: New start time
            end_time: New end time
            description: New description
            location: New location
            
        Returns:
            Updated event details
        """
        try:
            event = self.calendar_tool.update_event(
                event_id=event_id,
                summary=summary,
                start_time=start_time,
                end_time=end_time,
                description=description,
                location=location
            )
            logger.info(f"Updated calendar event: {event_id}")
            return event
        except Exception as e:
            logger.error(f"Failed to update calendar event: {e}")
            raise
    
    async def calendar_delete_event(self, event_id: str) -> None:
        """
        Delete a calendar event.
        
        Args:
            event_id: Event identifier
        """
        try:
            self.calendar_tool.delete_event(event_id)
            logger.info(f"Deleted calendar event: {event_id}")
        except Exception as e:
            logger.error(f"Failed to delete calendar event: {e}")
            raise
    
    async def calendar_get_today_events(self) -> List[Dict[str, Any]]:
        """
        Get today's calendar events.
        
        Returns:
            List of today's events
        """
        try:
            events = self.calendar_tool.get_events_today()
            logger.info(f"Retrieved {len(events)} events for today")
            return events
        except Exception as e:
            logger.error(f"Failed to get today's events: {e}")
            raise
    
    async def calendar_get_week_events(self) -> List[Dict[str, Any]]:
        """
        Get this week's calendar events.
        
        Returns:
            List of this week's events
        """
        try:
            events = self.calendar_tool.get_events_this_week()
            logger.info(f"Retrieved {len(events)} events for this week")
            return events
        except Exception as e:
            logger.error(f"Failed to get week's events: {e}")
            raise
    
    async def calendar_start_watch(
        self,
        channel_id: str,
        webhook_url: str,
        ttl: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Start watching calendar for changes.
        
        Args:
            channel_id: Unique channel identifier
            webhook_url: Webhook URL for notifications
            ttl: Time to live in seconds
            
        Returns:
            Watch response
        """
        try:
            self.calendar_watch_info = self.calendar_tool.watch_calendar(
                channel_id=channel_id,
                webhook_url=webhook_url,
                ttl=ttl
            )
            logger.info("Started watching calendar")
            return self.calendar_watch_info
        except Exception as e:
            logger.error(f"Failed to start calendar watch: {e}")
            raise
    
    async def calendar_stop_watch(
        self,
        channel_id: str,
        resource_id: str
    ) -> None:
        """
        Stop watching calendar.
        
        Args:
            channel_id: Channel identifier
            resource_id: Resource identifier
        """
        try:
            self.calendar_tool.stop_watch(channel_id, resource_id)
            self.calendar_watch_info = None
            logger.info("Stopped watching calendar")
        except Exception as e:
            logger.error(f"Failed to stop calendar watch: {e}")
            raise
    
    def get_available_methods(self) -> List[str]:
        """
        Get list of available MCP methods.
        
        Returns:
            List of method names
        """
        return [
            # Gmail methods
            "gmail_list_messages",
            "gmail_get_message",
            "gmail_search_messages",
            "gmail_get_unread",
            "gmail_send_email",
            "gmail_mark_as_read",
            "gmail_start_watch",
            "gmail_stop_watch",
            
            # Calendar methods
            "calendar_list_events",
            "calendar_get_event",
            "calendar_create_event",
            "calendar_update_event",
            "calendar_delete_event",
            "calendar_get_today_events",
            "calendar_get_week_events",
            "calendar_start_watch",
            "calendar_stop_watch"
        ]
