"""SMS integration tool using Twilio."""
from typing import Dict, Any
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)


class SMSTool:
    """SMS tool using Twilio API."""
    
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        """
        Initialize SMS tool.
        
        Args:
            account_sid: Twilio account SID
            auth_token: Twilio auth token
            from_number: Twilio phone number to send from
        """
        self.client = Client(account_sid, auth_token)
        self.from_number = from_number
    
    def send_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """
        Send an SMS message.
        
        Args:
            to_number: Recipient phone number (E.164 format)
            message: Message text
            
        Returns:
            Message details
        """
        try:
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            logger.info(f"SMS sent successfully. SID: {message_obj.sid}")
            return {
                'sid': message_obj.sid,
                'status': message_obj.status,
                'to': message_obj.to,
                'from': message_obj.from_,
                'body': message_obj.body,
                'date_sent': message_obj.date_sent
            }
        
        except TwilioRestException as e:
            logger.error(f"Failed to send SMS: {e}")
            raise
    
    def get_message_status(self, message_sid: str) -> Dict[str, Any]:
        """
        Get the status of a sent message.
        
        Args:
            message_sid: Message SID
            
        Returns:
            Message status details
        """
        try:
            message = self.client.messages(message_sid).fetch()
            
            return {
                'sid': message.sid,
                'status': message.status,
                'to': message.to,
                'from': message.from_,
                'error_code': message.error_code,
                'error_message': message.error_message
            }
        
        except TwilioRestException as e:
            logger.error(f"Failed to get message status: {e}")
            raise
    
    def send_mms(
        self,
        to_number: str,
        message: str,
        media_url: str
    ) -> Dict[str, Any]:
        """
        Send an MMS message with media.
        
        Args:
            to_number: Recipient phone number (E.164 format)
            message: Message text
            media_url: URL of media to attach
            
        Returns:
            Message details
        """
        try:
            message_obj = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number,
                media_url=[media_url]
            )
            
            logger.info(f"MMS sent successfully. SID: {message_obj.sid}")
            return {
                'sid': message_obj.sid,
                'status': message_obj.status,
                'to': message_obj.to,
                'from': message_obj.from_,
                'body': message_obj.body,
                'num_media': message_obj.num_media
            }
        
        except TwilioRestException as e:
            logger.error(f"Failed to send MMS: {e}")
            raise
