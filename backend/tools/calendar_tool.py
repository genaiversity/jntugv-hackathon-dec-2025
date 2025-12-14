"""Google Calendar API integration tool with real-time capabilities."""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
from .google_auth import GoogleAuthHandler

logger = logging.getLogger(__name__)


class CalendarTool:
    """Google Calendar API tool for comprehensive event management with real-time capabilities."""
    
    def __init__(self, auth_handler: GoogleAuthHandler):
        """
        Initialize Calendar tool.
        
        Args:
            auth_handler: Google authentication handler
        """
        self.auth_handler = auth_handler
        self.service = None
    
    def _get_service(self):
        """Get or create Calendar API service."""
        if not self.service:
            self.service = self.auth_handler.get_service('calendar', 'v3')
        return self.service
    
    def create_event(
        self,
        summary: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[str]] = None,
        timezone: str = 'UTC'
    ) -> Dict[str, Any]:
        """
        Create a calendar event.
        
        Args:
            summary: Event title
            start_time: Event start time
            end_time: Event end time
            description: Event description
            location: Event location
            attendees: List of attendee email addresses
            timezone: Event timezone
            
        Returns:
            Created event details
        """
        try:
            service = self._get_service()
            
            event = {
                'summary': summary,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': timezone,
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': timezone,
                },
            }
            
            if description:
                event['description'] = description
            
            if location:
                event['location'] = location
            
            if attendees:
                event['attendees'] = [{'email': email} for email in attendees]
            
            created_event = service.events().insert(
                calendarId='primary',
                body=event
            ).execute()
            
            logger.info(f"Event created successfully. Event ID: {created_event['id']}")
            return created_event
        
        except Exception as e:
            logger.error(f"Failed to create calendar event: {e}")
            raise
    
    def get_event(self, event_id: str) -> Dict[str, Any]:
        """
        Get event by ID.
        
        Args:
            event_id: Event identifier
            
        Returns:
            Event details
        """
        try:
            service = self._get_service()
            event = service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()
            
            return event
        
        except Exception as e:
            logger.error(f"Failed to get event: {e}")
            raise
    
    def list_upcoming_events(self, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        List upcoming events.
        
        Args:
            max_results: Maximum number of events to return
            
        Returns:
            List of upcoming events
        """
        try:
            service = self._get_service()
            now = datetime.utcnow().isoformat() + 'Z'
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=now,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            logger.info(f"Retrieved {len(events)} upcoming events")
            return events
        
        except Exception as e:
            logger.error(f"Failed to list events: {e}")
            raise
    
    def update_event(
        self,
        event_id: str,
        summary: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update an existing event.
        
        Args:
            event_id: Event identifier
            summary: New event title
            start_time: New start time
            end_time: New end time
            description: New description
            location: New location
            
        Returns:
            Updated event details
        """
        try:
            service = self._get_service()
            event = service.events().get(calendarId='primary', eventId=event_id).execute()
            
            if summary:
                event['summary'] = summary
            if start_time:
                event['start']['dateTime'] = start_time.isoformat()
            if end_time:
                event['end']['dateTime'] = end_time.isoformat()
            if description:
                event['description'] = description
            if location:
                event['location'] = location
            
            updated_event = service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event
            ).execute()
            
            logger.info(f"Event updated successfully. Event ID: {event_id}")
            return updated_event
        
        except Exception as e:
            logger.error(f"Failed to update event: {e}")
            raise
    
    
    def delete_event(self, event_id: str) -> None:
        """
        Delete an event.
        
        Args:
            event_id: Event identifier
        """
        try:
            service = self._get_service()
            service.events().delete(
                calendarId='primary',
                eventId=event_id
            ).execute()
            
            logger.info(f"Event deleted successfully. Event ID: {event_id}")
        
        except Exception as e:
            logger.error(f"Failed to delete event: {e}")
            raise
    
    def watch_calendar(self, channel_id: str, webhook_url: str, ttl: Optional[int] = None) -> Dict[str, Any]:
        """
        Set up push notifications for calendar changes.
        
        Args:
            channel_id: Unique channel identifier
            webhook_url: URL to receive notifications
            ttl: Time to live in seconds (max 2592000 = 30 days)
            
        Returns:
            Watch response with channel details
        """
        try:
            service = self._get_service()
            
            body = {
                'id': channel_id,
                'type': 'web_hook',
                'address': webhook_url
            }
            
            if ttl:
                expiration = int((datetime.utcnow() + timedelta(seconds=ttl)).timestamp() * 1000)
                body['expiration'] = expiration
            
            watch_response = service.events().watch(
                calendarId='primary',
                body=body
            ).execute()
            
            logger.info(f"Calendar watch set up successfully. Channel ID: {channel_id}")
            return watch_response
        
        except Exception as e:
            logger.error(f"Failed to set up calendar watch: {e}")
            raise
    
    def stop_watch(self, channel_id: str, resource_id: str) -> None:
        """
        Stop watching calendar changes.
        
        Args:
            channel_id: Channel identifier
            resource_id: Resource identifier from watch response
        """
        try:
            service = self._get_service()
            service.channels().stop(
                body={
                    'id': channel_id,
                    'resourceId': resource_id
                }
            ).execute()
            
            logger.info(f"Calendar watch stopped. Channel ID: {channel_id}")
        
        except Exception as e:
            logger.error(f"Failed to stop calendar watch: {e}")
            raise
    
    def search_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        query: Optional[str] = None,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search events by date range and/or query.
        
        Args:
            start_date: Start date for search (default: now)
            end_date: End date for search (default: 30 days from now)
            query: Text query to search in event details
            max_results: Maximum number of results
            
        Returns:
            List of matching events
        """
        try:
            service = self._get_service()
            
            if not start_date:
                start_date = datetime.utcnow()
            if not end_date:
                end_date = start_date + timedelta(days=30)
            
            params = {
                'calendarId': 'primary',
                'timeMin': start_date.isoformat() + 'Z',
                'timeMax': end_date.isoformat() + 'Z',
                'maxResults': max_results,
                'singleEvents': True,
                'orderBy': 'startTime'
            }
            
            if query:
                params['q'] = query
            
            events_result = service.events().list(**params).execute()
            events = events_result.get('items', [])
            
            logger.info(f"Found {len(events)} events")
            return events
        
        except Exception as e:
            logger.error(f"Failed to search events: {e}")
            raise
    
    def get_events_today(self) -> List[Dict[str, Any]]:
        """
        Get all events for today.
        
        Returns:
            List of today's events
        """
        now = datetime.utcnow()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        return self.search_events(start_date=start_of_day, end_date=end_of_day)
    
    def get_events_this_week(self) -> List[Dict[str, Any]]:
        """
        Get all events for this week.
        
        Returns:
            List of this week's events
        """
        now = datetime.utcnow()
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=7)
        
        return self.search_events(start_date=start_of_week, end_date=end_of_week)
    
    def quick_add_event(self, text: str) -> Dict[str, Any]:
        """
        Create an event from natural language text.
        
        Args:
            text: Natural language event description
                  (e.g., "Appointment at Somewhere on June 3rd 10am-10:25am")
            
        Returns:
            Created event details
        """
        try:
            service = self._get_service()
            
            event = service.events().quickAdd(
                calendarId='primary',
                text=text
            ).execute()
            
            logger.info(f"Quick event created. Event ID: {event['id']}")
            return event
        
        except Exception as e:
            logger.error(f"Failed to create quick event: {e}")
            raise
    
    def get_free_busy(
        self,
        start_time: datetime,
        end_time: datetime,
        calendars: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get free/busy information for calendars.
        
        Args:
            start_time: Start time for query
            end_time: End time for query
            calendars: List of calendar IDs (default: primary)
            
        Returns:
            Free/busy information
        """
        try:
            service = self._get_service()
            
            if not calendars:
                calendars = ['primary']
            
            body = {
                'timeMin': start_time.isoformat() + 'Z',
                'timeMax': end_time.isoformat() + 'Z',
                'items': [{'id': cal_id} for cal_id in calendars]
            }
            
            freebusy = service.freebusy().query(body=body).execute()
            
            logger.info("Retrieved free/busy information")
            return freebusy
        
        except Exception as e:
            logger.error(f"Failed to get free/busy info: {e}")
            raise

