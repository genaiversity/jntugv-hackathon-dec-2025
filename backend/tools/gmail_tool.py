"""Gmail API integration tool with real-time capabilities."""
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timedelta
from .google_auth import GoogleAuthHandler

logger = logging.getLogger(__name__)


class GmailTool:
    """Gmail API tool for comprehensive email management with real-time capabilities."""
    
    def __init__(self, auth_handler: GoogleAuthHandler):
        """
        Initialize Gmail tool.
        
        Args:
            auth_handler: Google authentication handler
        """
        self.auth_handler = auth_handler
        self.service = None
    
    def _get_service(self):
        """Get or create Gmail API service."""
        if not self.service:
            self.service = self.auth_handler.get_service('gmail', 'v1')
        return self.service
    
    def create_message(
        self,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        attachments: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create email message.
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body content
            cc: CC recipients (comma-separated)
            bcc: BCC recipients (comma-separated)
            attachments: List of file paths to attach
            
        Returns:
            Email message dictionary
        """
        message = MIMEMultipart()
        message['to'] = to
        message['subject'] = subject
        
        if cc:
            message['cc'] = cc
        if bcc:
            message['bcc'] = bcc
        
        msg_body = MIMEText(body, 'plain')
        message.attach(msg_body)
        
        # Add attachments if provided
        if attachments:
            for file_path in attachments:
                try:
                    with open(file_path, 'rb') as f:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header('Content-Disposition', f'attachment; filename={file_path.split("/")[-1]}')
                        message.attach(part)
                except Exception as e:
                    logger.error(f"Failed to attach file {file_path}: {e}")
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        return {'raw': raw_message}
    
    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        attachments: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Send an email.
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body content
            cc: CC recipients (comma-separated)
            bcc: BCC recipients (comma-separated)
            attachments: List of file paths to attach
            
        Returns:
            Sent message details
        """
        try:
            service = self._get_service()
            message = self.create_message(to, subject, body, cc, bcc, attachments)
            
            sent_message = service.users().messages().send(
                userId='me',
                body=message
            ).execute()
            
            logger.info(f"Email sent successfully. Message ID: {sent_message['id']}")
            return sent_message
        
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            raise
    
    def list_messages(
        self,
        max_results: int = 10,
        query: Optional[str] = None,
        label_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        List messages from mailbox.
        
        Args:
            max_results: Maximum number of messages to return
            query: Gmail search query (e.g., 'is:unread', 'from:example@gmail.com')
            label_ids: List of label IDs to filter by
            
        Returns:
            List of message summaries
        """
        try:
            service = self._get_service()
            
            params = {
                'userId': 'me',
                'maxResults': max_results
            }
            
            if query:
                params['q'] = query
            if label_ids:
                params['labelIds'] = label_ids
            
            results = service.users().messages().list(**params).execute()
            messages = results.get('messages', [])
            
            logger.info(f"Retrieved {len(messages)} messages")
            return messages
        
        except Exception as e:
            logger.error(f"Failed to list messages: {e}")
            raise
    
    def get_message(self, message_id: str, format: str = 'full') -> Dict[str, Any]:
        """
        Get a specific message by ID.
        
        Args:
            message_id: Message identifier
            format: Message format ('full', 'metadata', 'minimal', 'raw')
            
        Returns:
            Message details
        """
        try:
            service = self._get_service()
            message = service.users().messages().get(
                userId='me',
                id=message_id,
                format=format
            ).execute()
            
            return message
        
        except Exception as e:
            logger.error(f"Failed to get message: {e}")
            raise
    
    def parse_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse message to extract readable information.
        
        Args:
            message: Raw message from Gmail API
            
        Returns:
            Parsed message with subject, from, to, body, etc.
        """
        headers = message.get('payload', {}).get('headers', [])
        
        parsed = {
            'id': message.get('id'),
            'thread_id': message.get('threadId'),
            'snippet': message.get('snippet'),
            'labels': message.get('labelIds', [])
        }
        
        # Extract headers
        for header in headers:
            name = header.get('name', '').lower()
            value = header.get('value', '')
            
            if name == 'subject':
                parsed['subject'] = value
            elif name == 'from':
                parsed['from'] = value
            elif name == 'to':
                parsed['to'] = value
            elif name == 'date':
                parsed['date'] = value
        
        # Extract body
        payload = message.get('payload', {})
        body = self._extract_body(payload)
        parsed['body'] = body
        
        return parsed
    
    def _extract_body(self, payload: Dict[str, Any]) -> str:
        """Extract email body from payload."""
        if 'body' in payload and 'data' in payload['body']:
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part.get('mimeType') == 'text/plain':
                    if 'data' in part.get('body', {}):
                        return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        
        return ""
    
    def search_messages(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search messages with a query.
        
        Args:
            query: Gmail search query
            max_results: Maximum results to return
            
        Returns:
            List of matching messages
        """
        messages = self.list_messages(max_results=max_results, query=query)
        
        detailed_messages = []
        for msg in messages:
            try:
                full_message = self.get_message(msg['id'])
                parsed = self.parse_message(full_message)
                detailed_messages.append(parsed)
            except Exception as e:
                logger.error(f"Failed to get message {msg['id']}: {e}")
        
        return detailed_messages
    
    def get_unread_messages(self, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Get unread messages.
        
        Args:
            max_results: Maximum results to return
            
        Returns:
            List of unread messages
        """
        return self.search_messages(query='is:unread', max_results=max_results)
    
    def mark_as_read(self, message_id: str) -> Dict[str, Any]:
        """
        Mark a message as read.
        
        Args:
            message_id: Message identifier
            
        Returns:
            Updated message
        """
        try:
            service = self._get_service()
            message = service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            
            logger.info(f"Message {message_id} marked as read")
            return message
        
        except Exception as e:
            logger.error(f"Failed to mark message as read: {e}")
            raise
    
    def mark_as_unread(self, message_id: str) -> Dict[str, Any]:
        """
        Mark a message as unread.
        
        Args:
            message_id: Message identifier
            
        Returns:
            Updated message
        """
        try:
            service = self._get_service()
            message = service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': ['UNREAD']}
            ).execute()
            
            logger.info(f"Message {message_id} marked as unread")
            return message
        
        except Exception as e:
            logger.error(f"Failed to mark message as unread: {e}")
            raise
    
    def watch_mailbox(self, topic_name: str, label_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Set up push notifications for mailbox changes.
        
        Args:
            topic_name: Google Cloud Pub/Sub topic name
            label_ids: Labels to watch (default: all mail)
            
        Returns:
            Watch response with historyId and expiration
        """
        try:
            service = self._get_service()
            
            request = {
                'topicName': topic_name
            }
            
            if label_ids:
                request['labelIds'] = label_ids
            
            watch_response = service.users().watch(
                userId='me',
                body=request
            ).execute()
            
            logger.info(f"Mailbox watch set up successfully. Expires: {watch_response.get('expiration')}")
            return watch_response
        
        except Exception as e:
            logger.error(f"Failed to set up mailbox watch: {e}")
            raise
    
    def stop_watch(self) -> None:
        """Stop watching the mailbox."""
        try:
            service = self._get_service()
            service.users().stop(userId='me').execute()
            logger.info("Mailbox watch stopped")
        
        except Exception as e:
            logger.error(f"Failed to stop mailbox watch: {e}")
            raise
    
    def create_draft(
        self,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
        attachments: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create an email draft.
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body content
            cc: CC recipients (comma-separated)
            bcc: BCC recipients (comma-separated)
            attachments: List of file paths to attach
            
        Returns:
            Draft details
        """
        try:
            service = self._get_service()
            message = self.create_message(to, subject, body, cc, bcc, attachments)
            
            draft = service.users().drafts().create(
                userId='me',
                body={'message': message}
            ).execute()
            
            logger.info(f"Draft created successfully. Draft ID: {draft['id']}")
            return draft
        
        except Exception as e:
            logger.error(f"Failed to create draft: {e}")
            raise
    
    def get_draft(self, draft_id: str) -> Dict[str, Any]:
        """
        Get a draft by ID.
        
        Args:
            draft_id: Draft identifier
            
        Returns:
            Draft details
        """
        try:
            service = self._get_service()
            draft = service.users().drafts().get(
                userId='me',
                id=draft_id
            ).execute()
            
            return draft
        
        except Exception as e:
            logger.error(f"Failed to get draft: {e}")
            raise
    
    def send_draft(self, draft_id: str) -> Dict[str, Any]:
        """
        Send an existing draft.
        
        Args:
            draft_id: Draft identifier
            
        Returns:
            Sent message details
        """
        try:
            service = self._get_service()
            sent_message = service.users().drafts().send(
                userId='me',
                body={'id': draft_id}
            ).execute()
            
            logger.info(f"Draft sent successfully. Message ID: {sent_message['id']}")
            return sent_message
        
        except Exception as e:
            logger.error(f"Failed to send draft: {e}")
            raise
    
    def delete_message(self, message_id: str) -> None:
        """
        Delete a message permanently.
        
        Args:
            message_id: Message identifier
        """
        try:
            service = self._get_service()
            service.users().messages().delete(
                userId='me',
                id=message_id
            ).execute()
            
            logger.info(f"Message {message_id} deleted")
        
        except Exception as e:
            logger.error(f"Failed to delete message: {e}")
            raise
    
    def trash_message(self, message_id: str) -> Dict[str, Any]:
        """
        Move a message to trash.
        
        Args:
            message_id: Message identifier
            
        Returns:
            Updated message
        """
        try:
            service = self._get_service()
            message = service.users().messages().trash(
                userId='me',
                id=message_id
            ).execute()
            
            logger.info(f"Message {message_id} moved to trash")
            return message
        
        except Exception as e:
            logger.error(f"Failed to trash message: {e}")
            raise
