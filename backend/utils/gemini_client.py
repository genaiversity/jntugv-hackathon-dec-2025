"""Gemini AI client for LLM interactions."""
import google.generativeai as genai
from typing import Optional, Dict, Any, List
import logging
import json

logger = logging.getLogger(__name__)


class GeminiClient:
    """Client for interacting with Google's Gemini AI."""
    
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        """
        Initialize Gemini client.
        
        Args:
            api_key: Gemini API key
            model_name: Model name to use (default: gemini-2.0-flash)
        """
        genai.configure(api_key=api_key)
        # Ensure model name has 'models/' prefix for API v0.8+
        if not model_name.startswith('models/'):
            model_name = f'models/{model_name}'
        self.model_name = model_name
        self.model = genai.GenerativeModel(model_name)
        self.chat = None
    
    def generate_response(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Generate a response from a prompt.
        
        Args:
            prompt: Input prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Generated response text
        """
        try:
            generation_config = {
                "temperature": temperature,
            }
            
            if max_tokens:
                generation_config["max_output_tokens"] = max_tokens
            
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            return response.text
        
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            raise
    
    def start_chat(self, history: Optional[List[Dict[str, str]]] = None):
        """
        Start a chat session.
        
        Args:
            history: Optional chat history
        """
        self.chat = self.model.start_chat(history=history or [])
    
    def send_message(self, message: str) -> str:
        """
        Send a message in the current chat session.
        
        Args:
            message: Message to send
            
        Returns:
            Response text
        """
        if not self.chat:
            self.start_chat()
        
        try:
            response = self.chat.send_message(message)
            return response.text
        
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise
    
    def get_chat_history(self) -> List[Dict[str, str]]:
        """
        Get the current chat history.
        
        Returns:
            Chat history
        """
        if not self.chat:
            return []
        
        return self.chat.history
    
    def extract_structured_data(
        self,
        text: str,
        schema: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract structured data from text using a schema.
        
        Args:
            text: Input text
            schema: JSON schema for extraction
            
        Returns:
            Extracted structured data
        """
        prompt = f"""
        Extract the following information from the text according to this schema:
        
        Schema: {schema}
        
        Text: {text}
        
        Return the extracted data as a JSON object matching the schema.
        """
        
        try:
            response = self.generate_response(prompt)
            # Parse JSON response
            import json
            return json.loads(response)
        
        except Exception as e:
            logger.error(f"Failed to extract structured data: {e}")
            raise
    
    def classify_intent(self, user_message: str) -> str:
        """
        Classify user intent from a message.
        
        Args:
            user_message: User's message
            
        Returns:
            Classified intent
        """
        prompt = f"""
        Classify the intent of the following user message into one of these categories:
        
        Gmail intents:
        - send_email: User wants to send an email
        - read_email: User wants to read/list emails
        - search_email: User wants to search for specific emails
        - get_unread_emails: User wants to see unread emails
        - reply_to_email: User wants to reply to an email
        
        Calendar intents:
        - create_calendar_event: User wants to create a calendar event
        - list_calendar_events: User wants to list calendar events
        - search_calendar_events: User wants to search for specific events
        - update_calendar_event: User wants to update an existing event
        - delete_calendar_event: User wants to delete an event
        - get_today_events: User wants to see today's events
        - get_week_events: User wants to see this week's events
        
        Other intents:
        - create_document: User wants to create a document
        - send_slack_message: User wants to send a Slack message
        - send_sms: User wants to send an SMS
        - general_query: General question or conversation
        
        User message: {user_message}
        
        Return only the intent category, nothing else.
        """
        
        try:
            intent = self.generate_response(prompt, temperature=0.3).strip().lower()
            return intent
        
        except Exception as e:
            logger.error(f"Failed to classify intent: {e}")
            return "general_query"

