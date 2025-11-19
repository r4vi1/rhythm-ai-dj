const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

export const authService = {
    accessToken: null as string | null,
    tokenExpiration: 0,

    init: () => {
        // Load token from local storage if valid
        const storedToken = localStorage.getItem('google_access_token');
        const storedExpiration = localStorage.getItem('google_token_expiration');

        if (storedToken && storedExpiration) {
            const now = Date.now();
            if (now < parseInt(storedExpiration)) {
                authService.accessToken = storedToken;
                authService.tokenExpiration = parseInt(storedExpiration);
            } else {
                authService.logout();
            }
        }
    },

    login: (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!CLIENT_ID) {
                console.error("Missing VITE_GOOGLE_CLIENT_ID");
                reject("Missing Client ID");
                return;
            }

            const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

            // Create <form> element to submit parameters to OAuth 2.0 endpoint.
            const form = document.createElement('form');
            form.setAttribute('method', 'GET');
            form.setAttribute('action', oauth2Endpoint);

            const params: Record<string, string> = {
                'client_id': CLIENT_ID,
                'redirect_uri': window.location.origin,
                'response_type': 'token',
                'scope': SCOPES,
                'include_granted_scopes': 'true',
                'state': 'pass-through value'
            };

            for (const p in params) {
                const input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', p);
                input.setAttribute('value', params[p]);
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();
        });
    },

    handleCallback: () => {
        // Parse query string to see if page request is coming from OAuth 2.0 server.
        const fragmentString = location.hash.substring(1);
        const params: Record<string, string> = {};
        const regex = /([^&=]+)=([^&]*)/g;
        let m;
        while (m = regex.exec(fragmentString)) {
            params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }

        if (params['access_token']) {
            authService.accessToken = params['access_token'];
            const expiresIn = parseInt(params['expires_in']);
            authService.tokenExpiration = Date.now() + expiresIn * 1000;

            localStorage.setItem('google_access_token', authService.accessToken);
            localStorage.setItem('google_token_expiration', authService.tokenExpiration.toString());

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return true;
        }
        return false;
    },

    logout: () => {
        authService.accessToken = null;
        authService.tokenExpiration = 0;
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_token_expiration');
    },

    isAuthenticated: () => {
        return !!authService.accessToken && Date.now() < authService.tokenExpiration;
    }
};

// Initialize on load
authService.init();
