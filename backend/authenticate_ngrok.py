"""Google OAuth authentication using ngrok URL.

Use this script when your backend is exposed via ngrok.
This will create token.json using your ngrok redirect URI.
"""

import os
import sys
from tools.google_auth import GoogleAuthHandler
from utils.config import get_settings

def main():
    """Run Google OAuth authentication flow with ngrok."""
    print("=" * 70)
    print("Google OAuth Authentication with ngrok")
    print("=" * 70)
    print()
    
    # Get ngrok URL from user
    print("📝 Enter your ngrok URL (without trailing slash)")
    print("   Example: https://86c73482d43a.ngrok-free.app")
    print()
    
    ngrok_url = input("ngrok URL: ").strip()
    
    # Remove trailing slash if present
    if ngrok_url.endswith('/'):
        ngrok_url = ngrok_url[:-1]
    
    # Validate URL
    if not ngrok_url.startswith('https://') and not ngrok_url.startswith('http://'):
        print("\n❌ Error: URL must start with http:// or https://")
        sys.exit(1)
    
    if 'ngrok' not in ngrok_url:
        print("\n⚠️  Warning: This doesn't look like an ngrok URL")
        response = input("Continue anyway? (yes/no): ").strip().lower()
        if response not in ['yes', 'y']:
            sys.exit(0)
    
    redirect_uri = ngrok_url  # ngrok URL is the redirect URI
    
    print("\n" + "=" * 70)
    print("IMPORTANT: Update Google Cloud Console")
    print("=" * 70)
    print()
    print("Before continuing, add this redirect URI to Google Cloud Console:")
    print()
    print(f"   {redirect_uri}/")
    print(f"   {redirect_uri}")
    print()
    print("Steps:")
    print("1. Go to: https://console.cloud.google.com/apis/credentials")
    print("2. Click on your OAuth 2.0 Client ID")
    print("3. Add the above URLs to 'Authorized redirect URIs'")
    print("4. Click Save and wait 30 seconds")
    print()
    
    response = input("Have you added the redirect URI? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("\n❌ Please add the redirect URI first, then run this script again.")
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("Starting OAuth flow with ngrok...")
    print("=" * 70)
    print()
    
    # Load settings
    settings = get_settings()
    
    # Initialize auth handler with custom redirect URI
    auth_handler = GoogleAuthHandler(
        credentials_file=settings.google_credentials_file,
        token_file=settings.google_token_file,
        redirect_uri=redirect_uri
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
        print()
        
        # Run authentication
        creds = auth_handler.authenticate()
        
        print("\n" + "=" * 70)
        print("✅ SUCCESS! Authentication complete!")
        print("=" * 70)
        print()
        print(f"✅ Token saved to: {settings.google_token_file}")
        print()
        print("📋 Next steps:")
        print("   1. Your FastAPI server can now use the saved token")
        print("   2. The token will auto-refresh when needed")
        print("   3. You don't need to authenticate again unless token is deleted")
        print()
        print("ℹ️  The token will be valid until it expires or you revoke it.")
        print()
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Authentication failed: {e}")
        print("\nTroubleshooting:")
        print(f"1. Make sure you added {redirect_uri}/ to authorized redirect URIs")
        print("2. Check that credentials.json is valid")
        print("3. Verify the redirect URL you pasted was complete")
        print("4. Make sure your ngrok tunnel is running")
        sys.exit(1)

if __name__ == "__main__":
    main()
