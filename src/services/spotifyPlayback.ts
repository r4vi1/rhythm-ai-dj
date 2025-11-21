import { spotifyAuthService } from './authService';
import { usePlayerStore } from '../stores/usePlayerStore';
import { transitionEngine } from './transitionEngine';

declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: any;
    }
}

class SpotifyPlaybackService {
    private player: any = null;
    private deviceId: string | null = null;
    private isReady = false;
    private hasTriggeredTransition = false;
    private hasTriggeredPreparation = false;

    async initialize() {
        if (this.isReady) return true;

        return new Promise<boolean>((resolve) => {
            // Load Spotify Web Playback SDK
            if (!document.querySelector('script[src*="spotify-player"]')) {
                const script = document.createElement('script');
                script.src = 'https://sdk.scdn.co/spotify-player.js';
                script.async = true;
                document.body.appendChild(script);
            }

            window.onSpotifyWebPlaybackSDKReady = () => {
                const token = spotifyAuthService.getAccessToken();
                if (!token) {
                    console.error('No Spotify token available');
                    resolve(false);
                    return;
                }

                this.player = new window.Spotify.Player({
                    name: 'Rhythm AI DJ',
                    getOAuthToken: (cb: (token: string) => void) => {
                        const token = spotifyAuthService.getAccessToken();
                        if (token) cb(token);
                    },
                    volume: 0.8
                });

                // Error handling
                this.player.addListener('initialization_error', ({ message }: any) => {
                    console.error('Initialization error:', message);
                });

                this.player.addListener('authentication_error', ({ message }: any) => {
                    console.error('Authentication error:', message);
                    spotifyAuthService.refreshAccessToken();
                });

                this.player.addListener('account_error', ({ message }: any) => {
                    console.error('Account error:', message);
                    alert('Spotify Premium is required for playback');
                });

                this.player.addListener('playback_error', ({ message }: any) => {
                    console.error('Playback error:', message);
                });

                // Ready
                this.player.addListener('ready', ({ device_id }: any) => {
                    console.log('✅ Spotify Player ready with Device ID:', device_id);
                    this.deviceId = device_id;
                    this.isReady = true;
                    resolve(true);
                });

                // Not Ready
                this.player.addListener('not_ready', ({ device_id }: any) => {
                    console.log('Device ID has gone offline:', device_id);
                    this.isReady = false;
                });

                // Player state changed
                let previousState: any = null;

                this.player.addListener('player_state_changed', (state: any) => {
                    if (!state) return;

                    const { paused, position, track_window } = state;

                    // Detect TRACK CHANGE (new track started)
                    // Reset transition flags so next transition can be prepared
                    if (previousState && track_window?.current_track?.id !== previousState.track_window?.current_track?.id) {
                        console.log('🎵 New track detected, resetting transition flags');
                        this.hasTriggeredPreparation = false;
                        this.hasTriggeredTransition = false;
                    }

                    // Detect Track End
                    // If we were playing, and now we are paused at position 0, the track likely ended
                    // Added check for previousState.position > 0 to ensure we actually played something
                    if (previousState && !previousState.paused && paused && position === 0 && previousState.position > 0) {
                        console.log('🎵 Track finished, triggering auto-next...');
                        usePlayerStore.getState().handleTrackEnd();
                    }

                    previousState = state;

                    usePlayerStore.getState().setIsPlaying(!paused);
                    usePlayerStore.getState().setProgress(position / 1000);

                    // Detect Pre-Calculation (45s before end)
                    // Pre-calculate transition plan to enable smooth mixing
                    const { duration } = state;
                    const timeRemaining = duration - position;

                    // Debug: Log timing info periodically
                    if (duration > 0 && timeRemaining % 10000 < 1000) { // Every ~10s
                        console.log(`⏱️  Time remaining: ${(timeRemaining / 1000).toFixed(1)}s / ${(duration / 1000).toFixed(1)}s (prep triggered: ${this.hasTriggeredPreparation})`);
                    }

                    if (duration > 0 && timeRemaining < 45000 && !this.hasTriggeredPreparation) {
                        console.log(`🔮 Pre-calculating transition (${(timeRemaining / 1000).toFixed(1)}s left)...`);
                        this.hasTriggeredPreparation = true;

                        // Get next track from queue
                        const { currentTrack, queue } = usePlayerStore.getState();
                        if (currentTrack) {
                            const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
                            const nextTrack = queue[currentIndex + 1];

                            if (nextTrack) {
                                transitionEngine.prepareTransition(currentTrack, nextTrack);
                            }
                        }
                    }

                    // Detect Pre-End for Transition (use plan's mixInPoint or default 20s)
                    // This ensures transition starts BEFORE track ends, not after
                    if (duration > 0 && duration - position < 20000 && !this.hasTriggeredTransition) {
                        console.log('🔄 Pre-end detected (20s left), triggering intelligent transition...');
                        this.hasTriggeredTransition = true;
                        usePlayerStore.getState().handleTrackEnd();
                    }
                });

                // Connect to the player
                this.player.connect();
            };
        });
    }

    async transferPlayback(deviceId: string) {
        const token = spotifyAuthService.getAccessToken();
        if (!token) return;

        await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_ids: [deviceId],
                play: false // Don't auto-play, just activate
            })
        });
    }

    async play(trackUri: string) {
        // Ensure player is ready
        if (!this.isReady || !this.deviceId) {
            console.log('⚠️ Player not ready, initializing...');
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Spotify player not ready');
            }
            // Wait a bit for the device to be fully registered
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Only refresh token if it's expired or expiring soon (within 5 minutes)
        const now = Date.now();
        const tokenExpiresAt = spotifyAuthService.tokenExpiration;
        const fiveMinutes = 5 * 60 * 1000;

        if (tokenExpiresAt && (now + fiveMinutes) < tokenExpiresAt) {
            // Token is still valid, no need to refresh
            console.log('✅ Token still valid, skipping refresh');
        } else {
            // Token expired or expiring soon, refresh it
            console.log('🔄 Token expired or expiring, refreshing...');
            const refreshSuccess = await spotifyAuthService.refreshAccessToken();
            if (!refreshSuccess) {
                console.error('❌ Token refresh failed');
                throw new Error('Token refresh failed');
            }
        }

        const token = spotifyAuthService.getAccessToken();
        if (!token) throw new Error('Not authenticated');

        console.log('▶️ Attempting to play:', trackUri, 'on device:', this.deviceId);

        this.hasTriggeredTransition = false;

        const playRequest = async (retries = 3): Promise<void> => {
            try {
                const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        uris: [trackUri]
                    })
                });

                if (response.status === 404) {
                    console.warn('⚠️ Device not found (404), attempting to activate device...');
                    if (this.deviceId) {
                        await this.transferPlayback(this.deviceId);
                        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for activation
                    }
                    if (retries > 0) {
                        console.log(`🔄 Retrying playback (${retries} attempts left)...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return playRequest(retries - 1);
                    }
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Spotify play failed:', response.status, errorText);

                    // If 403, it might be a premium issue or scope issue
                    if (response.status === 403) {
                        throw new Error('Spotify Premium required or playback restricted');
                    }

                    // If 401, token might be expired
                    if (response.status === 401) {
                        console.warn('⚠️ Token expired, refreshing...');
                        await spotifyAuthService.refreshAccessToken();
                        if (retries > 0) return playRequest(retries - 1);
                    }

                    throw new Error(`Playback failed: ${response.status}`);
                }

                console.log('✅ Playback request successful');
            } catch (error) {
                if (retries > 0) {
                    console.warn(`⚠️ Playback error, retrying (${retries} left):`, error);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return playRequest(retries - 1);
                }
                throw error;
            }
        };

        await playRequest();
    }

    async pause() {
        if (this.player) {
            await this.player.pause();
        }
    }

    async resume() {
        if (this.player) {
            await this.player.resume();
        }
    }

    async setVolume(volume: number) {
        if (this.player) {
            await this.player.setVolume(volume);
        }
    }

    async seek(positionMs: number) {
        if (this.player) {
            await this.player.seek(positionMs);
        }
    }

    getState() {
        if (this.player) {
            return this.player.getCurrentState();
        }
        return null;
    }
}

export const spotifyPlayback = new SpotifyPlaybackService();
