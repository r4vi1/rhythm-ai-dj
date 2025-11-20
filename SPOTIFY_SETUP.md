# Spotify Setup Instructions

## Step 1: Create Spotify Developer Account

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account (or create one)
3. Click "Create app"

## Step 2: Configure Your App

**App Name:** Rhythm AI DJ
**App Description:** AI-powered DJ transitions and music player
**Redirect URI:** `http://localhost:5173/callback`
**Which API/SDKs are you planning to use:** Web API, Web Playback SDK

## Step 3: Get Credentials

After creating the app:
1. Click "Settings"
2. Copy your **Client ID**
3. Add it to `.env` file as `VITE_SPOTIFY_CLIENT_ID=your_client_id_here`

## Step 4: Required Scopes

We'll request these scopes for full functionality:
- `streaming` - Control Spotify playback
- `user-read-email` - Read user profile  
- `user-read-private` - Read user subscription level
- `user-library-read` - Access saved tracks
- `user-library-modify` - Save tracks
- `user-top-read` - Read listening history
- `playlist-read-private` - Read private playlists
- `playlist-modify-public` - Modify playlists

## Important Notes

⚠️ **Spotify Premium is required** for Web Playback SDK
⚠️ Users will need to authenticate with their Spotify account
⚠️ We can analyze their listening history for better track recommendations
