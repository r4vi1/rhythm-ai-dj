import { spotifyAuthService } from './authService';
import { usePlayerStore } from '../stores/usePlayerStore';

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
                this.player.addListener('player_state_changed', (state: any) => {
                    if (!state) return;

                    const { paused, position } = state;
                    usePlayerStore.getState().setIsPlaying(!paused);
                    usePlayerStore.getState().setProgress(position / 1000);
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
        if (!this.isReady || !this.deviceId) {
            console.log('⚠️ Player not ready, initializing...');
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Spotify player not ready');
            }
            // Wait a bit for the device to be fully registered
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const token = spotifyAuthService.getAccessToken();
        if (!token) throw new Error('Not authenticated');

        console.log('▶️ Attempting to play:', trackUri, 'on device:', this.deviceId);

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
