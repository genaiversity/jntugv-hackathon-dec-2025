"""Standalone Google OAuth authentication script.

Run this script SEPARATELY from main.py to authenticate with Google.
This will create token.json which main.py will then use.

IMPORTANT: Stop your FastAPI server (python main.py) before running this!
"""

import os
import sys
from tools.google_auth import GoogleAuthHandler
from utils.config import get_settings

def main():
    """Run Google OAuth authentication flow."""
    print("=" * 60)
    print("Google OAuth Authentication")
    print("=" * 60)
    print()
    
    # Check if FastAPI server might be running
    print("⚠️  IMPORTANT: Make sure your FastAPI server is STOPPED!")
    print("   (Press Ctrl+C in the terminal running 'python main.py')")
    print()
    
    response = input("Have you stopped the FastAPI server? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("\n❌ Please stop the FastAPI server first, then run this script again.")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("Starting OAuth flow...")
    print("=" * 60)
    print()
    
    # Load settings
    settings = get_settings()
    
    # Initialize auth handler
    auth_handler = GoogleAuthHandler(
        credentials_file=settings.google_credentials_file,
        token_file=settings.google_token_file
    )
    
    try:
        # Check if credentials.json exists
        if not os.path.exists(settings.google_credentials_file):
            print(f"❌ Error: {settings.google_credentials_file} not found!")
            print("\nPlease download your OAuth credentials from Google Cloud Console:")
            print("1. Go to https://console.cloud.google.com/apis/credentials")
            print("2. Download your OAuth 2.0 Client ID as 'credentials.json'")
            print("3. Place it in the backend directory")
            sys.exit(1)
        
        # Delete existing token if present
        if os.path.exists(settings.google_token_file):
            print(f"ℹ️  Found existing {settings.google_token_file}")
            delete = input("Delete it and create a new one? (yes/no): ").strip().lower()
            if delete in ['yes', 'y']:
                os.remove(settings.google_token_file)
                print(f"✅ Deleted {settings.google_token_file}")
            else:
                print(f"ℹ️  Keeping existing {settings.google_token_file}")
                print("✅ Authentication already complete!")
                sys.exit(0)
        
        print("\n📝 OAuth Scopes requested:")
        for scope in auth_handler.DEFAULT_SCOPES:
            print(f"   - {scope}")
        
        print("\n🌐 Opening browser for authentication...")
        print("   Please sign in with your Google account and grant permissions.")
        print()
        
        # Run authentication
        creds = auth_handler.authenticate()
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS! Authentication complete!")
        print("=" * 60)
        print()
        print(f"✅ Token saved to: {settings.google_token_file}")
        print()
        print("📋 Next steps:")
        print("   1. You can now close this script")
        print("   2. Start your FastAPI server: python main.py")
        print("   3. Your app will use the saved token automatically")
        print()
        print("ℹ️  The token will be valid until it expires or you revoke it.")
        print()
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Authentication failed: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you added http://localhost:8000/ to authorized redirect URIs")
        print("2. Check that credentials.json is valid")
        print("3. Ensure port 8000 is not in use by another application")
        sys.exit(1)

if __name__ == "__main__":
    main()
