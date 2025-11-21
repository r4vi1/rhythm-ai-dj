import * as Tone from 'tone';
import { usePlayerStore } from '../stores/usePlayerStore';
import { bridgeGenerator } from './bridgeGenerator';
import { transitionPlanner } from './transitionPlanner';
import type { TransitionPlan } from './transitionPlanner';
import type { Track } from '../stores/usePlayerStore';
import { audioAnalyzer } from './audioAnalyzer';
import { spotifyPlayback } from './spotifyPlayback';

class TransitionEngine {
    private isTransitioning = false;
    private preparedPlan: TransitionPlan | null = null;
    private preparedNextTrack: Track | null = null;
    private preparationPromise: Promise<void> | null = null; // Track async preparation
    private instanceId = Math.random().toString(36).substring(7); // Debug: track instance

    constructor() {
        console.log(`🎛️ TransitionEngine instance created: ${this.instanceId}`);
    }

    /**
     * Simple play - no transition, just play the track
     * Used for manual track changes and first track
     */
    public async play(track: Track) {
        // Stop any ongoing transition
        bridgeGenerator.stop();

        // Play via Spotify
        await spotifyPlayback.play(track.audioUrl);
        usePlayerStore.getState().setIsPlaying(true);

        // Reset volume to user preference
        const { volume } = usePlayerStore.getState();
        setTimeout(async () => {
            try {
                await spotifyPlayback.setVolume(volume);
            } catch (error) {
                console.warn('Failed to set volume:', error);
            }
        }, 1000);
    }

    /**
     * Pre-calculate transition plan (called 45s before track end)
     * This doesn't affect playback, just prepares the plan
     */
    public async prepareTransition(currentTrack: Track, nextTrack: Track) {
        console.log(`🔮 Pre-calculating transition plan... (instance: ${this.instanceId})`);

        // Store the preparation promise so executeTransition can await it
        this.preparationPromise = (async () => {
            try {
                // 1. Analyze both tracks
                const [currentAnalysis, nextAnalysis] = await Promise.all([
                    audioAnalyzer.analyzeTrack(currentTrack),
                    audioAnalyzer.analyzeTrack(nextTrack)
                ]);

                console.log(`  📊 Current: ${currentAnalysis.bpm} BPM, ${currentAnalysis.key}, Energy ${currentAnalysis.energy}`);
                console.log(`  📊 Next: ${nextAnalysis.bpm} BPM, ${nextAnalysis.key}, Energy ${nextAnalysis.energy}`);

                // 2. Generate transition plan
                const plan = await transitionPlanner.plan(currentAnalysis, nextAnalysis);

                console.log(`  📋 Plan: ${plan.duration}s ${plan.technique} transition`);
                console.log(`  🎚️  Elements: ${Object.entries(plan.generatedElements).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'none'}`);

                // 3. Store for execution
                this.preparedPlan = plan;
                this.preparedNextTrack = nextTrack;

                console.log('✅ Transition plan prepared and stored successfully');
                console.log(`  preparedPlan exists: ${this.preparedPlan !== null}`);
                console.log(`  preparedNextTrack exists: ${this.preparedNextTrack !== null}`);
            } catch (error) {
                console.error('❌ Transition prep failed:', error);
                console.error('  Error details:', error instanceof Error ? error.message : String(error));
                console.error('  Stack:', error instanceof Error ? error.stack : 'N/A');
                // Will fallback to simple play
                this.preparedPlan = null;
                this.preparedNextTrack = null;
            }
        })();

        return this.preparationPromise;
    }

    /**
     * Check if we have a prepared transition ready
     */
    public hasPreparedTransition(): boolean {
        return this.preparedPlan !== null && this.preparedNextTrack !== null;
    }

    /**
     * Execute the prepared transition (called 15s before track end)
     * Uses professional 3-phase crossfade technique
     */
    public async executeTransition(nextTrack?: Track) {
        if (this.isTransitioning) return;

        console.log(`🎛️  Executing SIMPLE crossfade transition`);

        // Get target track
        const { currentTrack, queue } = usePlayerStore.getState();
        const targetTrack = nextTrack || (currentTrack ? queue[queue.findIndex(t => t.id === currentTrack.id) + 1] : null);

        if (!targetTrack) {
            console.warn('⚠️  No next track available');
            return;
        }

        this.isTransitioning = true;

        try {
            // Update UI to show next track
            usePlayerStore.getState().setCurrentTrack(targetTrack);

            const crossfadeDuration = 8000; // 8 seconds
            const overlap = 0.5; // Start next track halfway through crossfade

            console.log(`🎵 Starting simple crossfade (${crossfadeDuration / 1000}s)`);

            // Start fading current track out
            const fadeCurrentOut = this.logarithmicFade(
                usePlayerStore.getState().volume,
                0,
                crossfadeDuration
            );

            // Wait for overlap point, then start next track
            setTimeout(async () => {
                try {
                    console.log('  🔄 Loading and fading in next track...');

                    // Only refresh token if needed
                    const now = Date.now();
                    const tokenExpiresAt = spotifyAuthService.tokenExpiration;
                    const fiveMinutes = 5 * 60 * 1000;

                    if (!tokenExpiresAt || (now + fiveMinutes) >= tokenExpiresAt) {
                        await spotifyAuthService.refreshAccessToken();
                    }

                    //Load next track
                    await spotifyPlayback.play(targetTrack.audioUrl);
                    await spotifyPlayback.setVolume(0);

                    // Fade next track in
                    const fadeTime = crossfadeDuration * (1 - overlap);
                    await this.logarithmicFade(0, usePlayerStore.getState().volume, fadeTime);

                    console.log('✅ Crossfade complete!');
                } catch (error) {
                    console.error('❌ Next track load failed:', error);
                }
            }, crossfadeDuration * overlap);

            // Wait for current track fade to complete
            await fadeCurrentOut;

        } catch (error) {
            console.error('❌ Crossfade failed:', error);
        } finally {
            this.isTransitioning = false;
            this.preparedPlan = null;
            this.preparedNextTrack = null;
            this.preparationPromise = null;
        }
    }

    /**
     * Logarithmic volume fade (constant-power crossfade)
     * Prevents perceived volume dips during transitions
     * Based on research: logarithmic curves sound more natural to human hearing
     */
    private logarithmicFade(from: number, to: number, durationMs: number): Promise<void> {
        return new Promise(resolve => {
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const linearProgress = Math.min(elapsed / durationMs, 1);

                // Apply logarithmic curve (equal-power crossfade)
                // Using cosine/sine curves for smooth transitions
                let volume: number;
                if (from > to) {
                    // Fading out: use cosine curve
                    const fadeOut = Math.cos((linearProgress * Math.PI) / 2);
                    volume = to + (from - to) * fadeOut;
                } else {
                    // Fading in: use sine curve
                    const fadeIn = Math.sin((linearProgress * Math.PI) / 2);
                    volume = from + (to - from) * fadeIn;
                }

                spotifyPlayback.setVolume(volume);

                if (linearProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    /**
     * Simple crossfade fallback (for errors or when no plan available)
     */
    private async simpleCrossfade(nextTrack: Track) {
        console.log('  ↔️  Simple crossfade (fallback)');
        const userVolume = usePlayerStore.getState().volume;

        await this.logarithmicFade(userVolume, 0, 1000);
        await spotifyPlayback.play(nextTrack.audioUrl);
        usePlayerStore.getState().setCurrentTrack(nextTrack);
        await this.logarithmicFade(0, userVolume, 1000);
    }

    public pause() {
        spotifyPlayback.pause();
        bridgeGenerator.stop();
        usePlayerStore.getState().setIsPlaying(false);
    }

    public resume() {
        spotifyPlayback.resume();
        usePlayerStore.getState().setIsPlaying(true);
    }

    public setVolume(value: number) {
        spotifyPlayback.setVolume(value);
        bridgeGenerator.setVolume(value * 0.8); // Bridge slightly quieter
    }
}

export const transitionEngine = new TransitionEngine();
