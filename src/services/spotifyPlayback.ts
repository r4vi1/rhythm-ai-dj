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

    async play(trackUri: string) {
        if (!this.isReady || !this.deviceId) {
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Spotify player not ready');
            }
        }

        const token = spotifyAuthService.getAccessToken();
        if (!token) throw new Error('Not authenticated');

        console.log('Playing track:', trackUri, 'on device:', this.deviceId);

        try {
            // Use Spotify Web API to start playback on our device
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

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Spotify play failed:', response.status, errorText);
                throw new Error(`Playback failed: ${response.status}`);
            }

            console.log('✅ Playback started successfully');
        } catch (error) {
            console.error('Error starting playback:', error);
            throw error;
        }
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
