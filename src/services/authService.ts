const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = 'http://127.0.0.1:5173/callback';
const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-library-modify',
    'user-top-read',
    'playlist-read-private',
    'playlist-modify-public',
    'user-read-playback-state',
    'user-modify-playback-state'
].join(' ');

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
}

// PKCE helper functions
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export const spotifyAuthService = {
    accessToken: null as string | null,
    refreshToken: null as string | null,
    tokenExpiration: 0,

    init: () => {
        // Load token from local storage if valid
        const storedToken = localStorage.getItem('spotify_access_token');
        const storedRefresh = localStorage.getItem('spotify_refresh_token');
        const storedExpiration = localStorage.getItem('spotify_token_expiration');

        if (storedToken && storedExpiration) {
            const now = Date.now();
            if (now < parseInt(storedExpiration)) {
                spotifyAuthService.accessToken = storedToken;
                spotifyAuthService.refreshToken = storedRefresh;
                spotifyAuthService.tokenExpiration = parseInt(storedExpiration);
            } else if (storedRefresh) {
                // Try to refresh token
                spotifyAuthService.refreshAccessToken();
            } else {
                spotifyAuthService.logout();
            }
        }
    },

    login: async (): Promise<void> => {
        if (!SPOTIFY_CLIENT_ID) {
            console.error("Missing VITE_SPOTIFY_CLIENT_ID");
            throw new Error("Missing Spotify Client ID");
        }

        // Generate code verifier and challenge for PKCE
        const codeVerifier = generateRandomString(64);
        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);

        // Store code verifier for later
        localStorage.setItem('spotify_code_verifier', codeVerifier);

        // Build authorization URL
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        const params = {
            client_id: SPOTIFY_CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            scope: SCOPES,
        };

        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    },

    handleCallback: async (): Promise<boolean> => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        return spotifyAuthService.handleCallbackWithCode(code);
    },

    handleCallbackWithCode: async (code: string | null): Promise<boolean> => {
        console.log('handleCallbackWithCode - code present:', !!code);

        if (!code) {
            console.log('No code provided');
            return false;
        }

        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        console.log('handleCallbackWithCode - code_verifier present:', !!codeVerifier);
        console.log('handleCallbackWithCode - code_verifier value:', codeVerifier?.substring(0, 20) + '...');

        if (!codeVerifier) {
            console.error('No code verifier found in localStorage');
            console.log('All localStorage keys:', Object.keys(localStorage));
            return false;
        }

        try {
            // Exchange code for token
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: SPOTIFY_CLIENT_ID!,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Token exchange failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    client_id: SPOTIFY_CLIENT_ID,
                    redirect_uri: REDIRECT_URI,
                    code_verifier_length: codeVerifier.length
                });
                throw new Error(`Failed to exchange code for token: ${response.status} - ${errorText}`);
            }

            const data: SpotifyTokenResponse = await response.json();

            // Store tokens
            spotifyAuthService.accessToken = data.access_token;
            spotifyAuthService.refreshToken = data.refresh_token || null;
            spotifyAuthService.tokenExpiration = Date.now() + data.expires_in * 1000;

            localStorage.setItem('spotify_access_token', data.access_token);
            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }
            localStorage.setItem('spotify_token_expiration', spotifyAuthService.tokenExpiration.toString());
            localStorage.removeItem('spotify_code_verifier');

            console.log('✅ Token exchange successful');
            return true;
        } catch (error) {
            console.error('Error handling callback:', error);
            return false;
        }
    },

    refreshAccessToken: async (): Promise<boolean> => {
        const refreshToken = spotifyAuthService.refreshToken || localStorage.getItem('spotify_refresh_token');
        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: SPOTIFY_CLIENT_ID!,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data: SpotifyTokenResponse = await response.json();

            spotifyAuthService.accessToken = data.access_token;
            spotifyAuthService.tokenExpiration = Date.now() + data.expires_in * 1000;

            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_token_expiration', spotifyAuthService.tokenExpiration.toString());

            return true;
        } catch (error) {
            console.error('Error refreshing token:', error);
            spotifyAuthService.logout();
            return false;
        }
    },

    logout: () => {
        spotifyAuthService.accessToken = null;
        spotifyAuthService.refreshToken = null;
        spotifyAuthService.tokenExpiration = 0;
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiration');
        localStorage.removeItem('spotify_code_verifier');
    },

    isAuthenticated: (): boolean => {
        return !!spotifyAuthService.accessToken && Date.now() < spotifyAuthService.tokenExpiration;
    },

    getAccessToken: (): string | null => {
        if (spotifyAuthService.isAuthenticated()) {
            return spotifyAuthService.accessToken;
        }
        return null;
    }
};

// Initialize on load
spotifyAuthService.init();

// Keep old authService for backwards compatibility during migration
export const authService = {
    accessToken: null as string | null,
    tokenExpiration: 0,
    init: () => { },
    login: () => spotifyAuthService.login(),
    handleCallback: () => spotifyAuthService.handleCallback(),
    handleCallbackWithCode: (code: string | null) => spotifyAuthService.handleCallbackWithCode(code),
    logout: () => spotifyAuthService.logout(),
    isAuthenticated: () => spotifyAuthService.isAuthenticated()
};
