/**
 * YouTube Player Service using YouTube IFrame API
 * This replaces direct audio playback for YouTube videos to avoid CORS issues
 */

import type { Track } from '../stores/usePlayerStore';

class YouTubePlayerService {
    private player: any = null;
    private isReady = false;
    private pendingVideoId: string | null = null;
    private onStateChangeCb: ((state: number) => void) | null = null;

    constructor() {
        this.loadYouTubeAPI();
    }

    private loadYouTubeAPI() {
        // Check if API is already loaded
        if ((window as any).YT) {
            this.onYouTubeAPIReady();
            return;
        }

        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        // Set callback for when API is ready
        (window as any).onYouTubeIframeAPIReady = () => {
            this.onYouTubeAPIReady();
        };
    }

    private onYouTubeAPIReady() {
        console.log('✅ YouTube IFrame API ready');
        this.isReady = true;

        // Create player if there's a pending video
        if (this.pendingVideoId) {
            this.createPlayer(this.pendingVideoId);
            this.pendingVideoId = null;
        }
    }

    private createPlayer(videoId: string) {
        // Create hidden div for player if it doesn't exist
        let playerDiv = document.getElementById('youtube-player');
        if (!playerDiv) {
            playerDiv = document.createElement('div');
            playerDiv.id = 'youtube-player';
            playerDiv.style.position = 'fixed';
            playerDiv.style.bottom = '0';
            playerDiv.style.right = '0';
            playerDiv.style.width = '1px';
            playerDiv.style.height = '1px';
            playerDiv.style.opacity = '0';
            playerDiv.style.pointerEvents = 'none';
            document.body.appendChild(playerDiv);
        }

        this.player = new (window as any).YT.Player('youtube-player', {
            height: '1',
            width: '1',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
            },
            events: {
                onReady: (event: any) => {
                    console.log('✅ YouTube player ready');
                    event.target.playVideo();
                },
                onStateChange: (event: any) => {
                    if (this.onStateChangeCb) {
                        this.onStateChangeCb(event.data);
                    }
                },
                onError: (event: any) => {
                    console.error('❌ YouTube player error:', event.data);
                }
            }
        });
    }

    public play(track: Track) {
        const videoId = this.extractVideoId(track.audioUrl);
        if (!videoId) {
            console.error('Could not extract video ID from:', track.audioUrl);
            return;
        }

        if (!this.isReady) {
            this.pendingVideoId = videoId;
            return;
        }

        if (this.player) {
            this.player.loadVideoById(videoId);
        } else {
            this.createPlayer(videoId);
        }
    }

    public pause() {
        if (this.player && this.player.pauseVideo) {
            this.player.pauseVideo();
        }
    }

    public resume() {
        if (this.player && this.player.playVideo) {
            this.player.playVideo();
        }
    }

    public setVolume(volume: number) {
        if (this.player && this.player.setVolume) {
            this.player.setVolume(volume * 100); // YouTube expects 0-100
        }
    }

    public onStateChange(callback: (state: number) => void) {
        this.onStateChangeCb = callback;
    }

    private extractVideoId(url: string): string | null {
        // Handle different YouTube URL formats
        // embed URL: https://www.youtube-nocookie.com/embed/{videoId}?...
        // watch URL: https://www.youtube.com/watch?v={videoId}
        // short URL: https://youtu.be/{videoId}

        const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
        if (embedMatch) return embedMatch[1];

        const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
        if (watchMatch) return watchMatch[1];

        const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (shortMatch) return shortMatch[1];

        return null;
    }
}

export const youtubePlayer = new YouTubePlayerService();
