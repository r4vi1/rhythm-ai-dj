import * as Tone from 'tone';
import { usePlayerStore } from '../stores/usePlayerStore';
import { bridgeGenerator } from './bridgeGenerator';

class TransitionEngine {
    private playerA: Tone.Player;
    private playerB: Tone.Player;
    private crossFade: Tone.CrossFade;
    private activePlayer: 'A' | 'B' = 'A';
    private isInitialized = false;

    // We use Tone.Player which loads the full buffer. 
    // For long tracks (streaming), this might be heavy, but it allows precise scheduling and pitch/rate control.
    // If memory is an issue, we might fallback to MediaElementSource, but Tone.Player is better for "DJ" features.

    constructor() {
        this.crossFade = new Tone.CrossFade().toDestination();

        this.playerA = new Tone.Player().connect(this.crossFade.a);
        this.playerB = new Tone.Player().connect(this.crossFade.b);

        // Default to A
        this.crossFade.fade.value = 0;
    }

    public async initialize() {
        if (this.isInitialized) return;
        await Tone.start();
        this.isInitialized = true;
    }

    public async play(url: string) {
        if (!this.isInitialized) await this.initialize();

        // Stop current if playing
        this.playerA.stop();
        this.playerB.stop();
        bridgeGenerator.stop(); // Ensure bridge is off

        // Reset to Player A
        this.activePlayer = 'A';
        this.crossFade.fade.value = 0;

        try {
            await this.playerA.load(url);
            this.playerA.start();
            usePlayerStore.getState().setIsPlaying(true);
        } catch (error) {
            console.error("Failed to load track:", error);
        }
    }

    public async transitionTo(nextUrl: string, transitionDuration: number = 8) {
        if (!this.isInitialized) await this.initialize();

        const targetPlayer = this.activePlayer === 'A' ? this.playerB : this.playerA;
        const currentPlayer = this.activePlayer === 'A' ? this.playerA : this.playerB;
        const targetFadeValue = this.activePlayer === 'A' ? 1 : 0;

        try {
            // 1. Load next track
            await targetPlayer.load(nextUrl);

            // 2. Determine if we need a Bridge
            // For MVP, let's assume we always use a bridge for the "DJ Effect" 
            // In reality, we'd check BPM diff.
            const useBridge = true;

            if (useBridge) {
                // Start Bridge Beat
                // Assume 120 BPM default for now, or detect from metadata
                bridgeGenerator.start(120);

                // Fade IN Bridge (Volume handled in generator, but we could ramp here)
            }

            // 3. Start next track (synced)
            // Sync start time? For now, just start immediately for crossfade
            targetPlayer.start();

            // 4. Execute Crossfade
            // Tone.js automation
            this.crossFade.fade.rampTo(targetFadeValue, transitionDuration);

            // 5. Cleanup
            setTimeout(() => {
                currentPlayer.stop();
                if (useBridge) bridgeGenerator.stop();
                this.activePlayer = this.activePlayer === 'A' ? 'B' : 'A';
            }, transitionDuration * 1000);

            usePlayerStore.getState().setIsPlaying(true);

        } catch (error) {
            console.error("Transition failed:", error);
        }
    }

    public pause() {
        if (this.activePlayer === 'A') this.playerA.stop(); // Tone.Player doesn't really "pause" in the same way, it stops. 
        // To truly pause we'd need to track offset. 
        // For MVP, stop is acceptable or we implement offset tracking.
        else this.playerB.stop();

        usePlayerStore.getState().setIsPlaying(false);
    }

    public resume() {
        // Re-start logic would go here (needing offset)
        // For now, simple start
        if (this.activePlayer === 'A') this.playerA.start();
        else this.playerB.start();
        usePlayerStore.getState().setIsPlaying(true);
    }

    public setVolume(value: number) {
        Tone.Destination.volume.value = Tone.gainToDb(value);
    }
}

export const transitionEngine = new TransitionEngine();
