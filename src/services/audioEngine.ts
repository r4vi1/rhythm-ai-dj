import { usePlayerStore } from '../stores/usePlayerStore';

class AudioEngine {
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private sourceNode: MediaElementAudioSourceNode | null = null;
    private audio: HTMLAudioElement;
    private isInitialized = false;

    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";

        // Event listeners for the audio element
        this.audio.addEventListener('ended', () => {
            usePlayerStore.getState().setIsPlaying(false);
            // TODO: Auto-play next track logic
        });

        this.audio.addEventListener('timeupdate', () => {
            usePlayerStore.getState().setProgress(this.audio.currentTime);
        });

        this.audio.addEventListener('loadedmetadata', () => {
            // Duration is available here
        });

        this.audio.addEventListener('error', (e) => {
            console.error("Audio playback error:", e);
            usePlayerStore.getState().setIsPlaying(false);
        });
    }

    public async initialize() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();

            // Connect audio element to Web Audio API graph
            this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
            this.sourceNode.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            this.isInitialized = true;

            // Resume context if suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.error("Failed to initialize AudioEngine:", error);
        }
    }

    public async play(url: string) {
        if (!this.isInitialized) await this.initialize();

        // Resume context again just in case
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (this.audio.src !== url) {
            this.audio.src = url;
            this.audio.load();
        }

        try {
            await this.audio.play();
            usePlayerStore.getState().setIsPlaying(true);
        } catch (error) {
            console.error("Playback failed:", error);
            usePlayerStore.getState().setIsPlaying(false);
        }
    }

    public pause() {
        this.audio.pause();
        usePlayerStore.getState().setIsPlaying(false);
    }

    public resume() {
        if (this.audio.src) {
            this.audio.play();
            usePlayerStore.getState().setIsPlaying(true);
        }
    }

    public setVolume(value: number) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, value));
        }
        this.audio.volume = value; // Fallback/Sync
    }

    public seek(time: number) {
        if (Number.isFinite(time)) {
            this.audio.currentTime = time;
            usePlayerStore.getState().setProgress(time);
        }
    }

    public getDuration(): number {
        return this.audio.duration || 0;
    }
}

export const audioEngine = new AudioEngine();
