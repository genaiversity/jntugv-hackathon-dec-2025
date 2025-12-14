"""Google OAuth authentication handler."""
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


class GoogleAuthHandler:
    """Handles Google OAuth authentication for various Google APIs."""
    
    # Default scopes for Google APIs
    DEFAULT_SCOPES = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/documents'
    ]
    
    def __init__(
        self,
        credentials_file: str = 'credentials.json',
        token_file: str = 'token.json',
        scopes: Optional[List[str]] = None,
        redirect_uri: Optional[str] = None
    ):
        """
        Initialize Google Auth Handler.
        
        Args:
            credentials_file: Path to OAuth credentials JSON file
            token_file: Path to store/load OAuth tokens
            scopes: List of OAuth scopes to request
            redirect_uri: Custom redirect URI (e.g., ngrok URL). If None, uses localhost
        """
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.scopes = scopes or self.DEFAULT_SCOPES
        self.redirect_uri = redirect_uri
        self.creds: Optional[Credentials] = None
    
    def authenticate(self) -> Credentials:
        """
        Authenticate and return valid credentials.
        
        Returns:
            Valid Google OAuth credentials
        """
        # Load existing token if available
        if os.path.exists(self.token_file):
            self.creds = Credentials.from_authorized_user_file(self.token_file, self.scopes)
        
        # Refresh or create new credentials if needed
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                logger.info("Refreshing expired credentials")
                self.creds.refresh(Request())
            else:
                logger.info("Starting new OAuth flow")
                if not os.path.exists(self.credentials_file):
                    raise FileNotFoundError(
                        f"Credentials file not found: {self.credentials_file}. "
                        "Please download it from Google Cloud Console."
                    )
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, self.scopes
                )
                
                # Use custom redirect URI if provided (e.g., ngrok)
                if self.redirect_uri:
                    logger.info(f"Using custom redirect URI: {self.redirect_uri}")
                    flow.redirect_uri = self.redirect_uri
                    
                    # For custom URIs, we need to manually handle the flow
                    auth_url, _ = flow.authorization_url(prompt='consent')
                    
                    logger.info("=" * 60)
                    logger.info("MANUAL OAUTH FLOW")
                    logger.info("=" * 60)
                    logger.info(f"1. Open this URL in your browser:\n   {auth_url}")
                    logger.info(f"2. After authorization, you'll be redirected to: {self.redirect_uri}")
                    logger.info("3. Copy the FULL redirect URL from your browser")
                    logger.info("=" * 60)
                    
                    print("\n" + "=" * 60)
                    print("MANUAL OAUTH FLOW")
                    print("=" * 60)
                    print(f"\n1. Open this URL in your browser:\n   {auth_url}\n")
                    print(f"2. After authorization, you'll be redirected to:\n   {self.redirect_uri}\n")
                    print("3. Copy the FULL redirect URL from your browser address bar")
                    print("   (It will contain 'code=' and 'state=' parameters)")
                    print("=" * 60)
                    
                    redirect_response = input("\nPaste the full redirect URL here: ").strip()
                    
                    # Extract the code from the redirect URL
                    flow.fetch_token(authorization_response=redirect_response)
                    self.creds = flow.credentials
                else:
                    # Use localhost automatic flow
                    logger.info("Using localhost OAuth flow on port 8000")
                    self.creds = flow.run_local_server(port=8000)
            
            # Save credentials for future use
            with open(self.token_file, 'w') as token:
                token.write(self.creds.to_json())
            logger.info("Credentials saved successfully")
        
        return self.creds
    
    def get_service(self, service_name: str, version: str):
        """
        Get authenticated Google API service.
        
        Args:
            service_name: Name of the Google service (e.g., 'gmail', 'calendar')
            version: API version (e.g., 'v1', 'v3')
            
        Returns:
            Authenticated Google API service object
        """
        if not self.creds:
            self.authenticate()
        
        return build(service_name, version, credentials=self.creds)
    
    def revoke_credentials(self):
        """Revoke current credentials and delete token file."""
        if os.path.exists(self.token_file):
            os.remove(self.token_file)
            logger.info("Credentials revoked and token file deleted")
        self.creds = None
