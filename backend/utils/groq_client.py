"""Groq AI client for LLM interactions."""
from groq import Groq
from typing import Optional, Dict, Any, List
import logging
import json

logger = logging.getLogger(__name__)


class GroqClient:
    """Client for interacting with Groq AI."""
    
    def __init__(self, api_key: str, model_name: str = "llama-3.3-70b-versatile"):
        """
        Initialize Groq client.
        
        Args:
            api_key: Groq API key
            model_name: Model name to use (default: llama-3.3-70b-versatile)
        """
        self.client = Groq(api_key=api_key)
        self.model_name = model_name
        self.chat_history = []
    
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
            messages = [{"role": "user", "content": prompt}]
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens or 1024
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            raise
    
    def start_chat(self, history: Optional[List[Dict[str, str]]] = None):
        """
        Start a chat session.
        
        Args:
            history: Optional chat history
        """
        self.chat_history = history or []
        return self
    
    def send_message(self, message: str, temperature: float = 0.7) -> str:
        """
        Send a message in the chat session.
        
        Args:
            message: User message
            temperature: Sampling temperature
            
        Returns:
            AI response
        """
        try:
            # Add user message to history
            self.chat_history.append({"role": "user", "content": message})
            
            # Get response
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=self.chat_history,
                temperature=temperature
            )
            
            ai_message = response.choices[0].message.content
            
            # Add AI response to history
            self.chat_history.append({"role": "assistant", "content": ai_message})
            
            return ai_message
            
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            raise
    
    def extract_structured_data(
        self,
        prompt: str,
        schema: Dict[str, Any],
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """
        Extract structured data from a prompt.
        
        Args:
            prompt: Input prompt
            schema: Expected data schema
            temperature: Sampling temperature
            
        Returns:
            Extracted structured data
        """
        try:
            schema_str = json.dumps(schema, indent=2)
            full_prompt = f"""Extract the following information from the text and return it as JSON.

Schema:
{schema_str}

Text: {prompt}

Return ONLY valid JSON, no other text."""

            response = self.generate_response(full_prompt, temperature=temperature)
            
            # Try to parse JSON from response
            try:
                # Find JSON in response
                start = response.find('{')
                end = response.rfind('}') + 1
                if start != -1 and end > start:
                    json_str = response[start:end]
                    return json.loads(json_str)
                else:
                    return json.loads(response)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON from response: {response}")
                return {}
                
        except Exception as e:
            logger.error(f"Failed to extract structured data: {e}")
            return {}
    
    def classify_intent(self, user_message: str) -> str:
        """
        Classify user intent from message.
        
        Args:
            user_message: User's message
            
        Returns:
            Classified intent
        """
        try:
            prompt = f"""Classify the following user message into ONE of these intents:

Intents:
- send_email: User wants to send an email
- read_email: User wants to read/view emails
- search_email: User wants to search for specific emails
- get_unread_emails: User wants to see unread emails
- reply_to_email: User wants to reply to an email
- create_calendar_event: User wants to create a calendar event
- list_calendar_events: User wants to list calendar events
- search_calendar_events: User wants to search calendar events
- update_calendar_event: User wants to update an event
- delete_calendar_event: User wants to delete an event
- get_today_events: User wants today's events
- get_week_events: User wants this week's events
- create_document: User wants to create a document
- send_slack_message: User wants to send a Slack message
- send_sms: User wants to send an SMS
- general_query: General question or conversation

User message: "{user_message}"

Return ONLY the intent name, nothing else."""

            response = self.generate_response(prompt, temperature=0.1)
            intent = response.strip().lower()
            
            # Validate intent
            valid_intents = [
                "send_email", "read_email", "search_email", "get_unread_emails", "reply_to_email",
                "create_calendar_event", "list_calendar_events", "search_calendar_events",
                "update_calendar_event", "delete_calendar_event", "get_today_events", "get_week_events",
                "create_document", "send_slack_message", "send_sms", "general_query"
            ]
            
            if intent in valid_intents:
                return intent
            else:
                logger.warning(f"Invalid intent classified: {intent}, defaulting to general_query")
                return "general_query"
                
        except Exception as e:
            logger.error(f"Failed to classify intent: {e}")
            return "general_query"
