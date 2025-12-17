import { usePlayerStore } from '../stores/usePlayerStore';
import { bridgeGenerator } from './bridgeGenerator';
import { transitionPlanner } from './transitionPlanner';
import type { TransitionPlan } from './transitionPlanner';
import type { Track } from '../stores/usePlayerStore';
import { audioAnalyzer } from './audioAnalyzer';
import { spotifyPlayback } from './spotifyPlayback';
import { spotifyAuthService } from './authService';

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

        console.log(`🎛️  Executing SEQUENTIAL transition`);

        // Get target track
        const { currentTrack, queue } = usePlayerStore.getState();
        const targetTrack = nextTrack || (currentTrack ? queue[queue.findIndex(t => t.id === currentTrack.id) + 1] : null);

        if (!targetTrack) {
            console.warn('⚠️  No next track available');
            return;
        }

        this.isTransitioning = true;

        try {
            const fadeDuration = 3000; // 3 seconds out, 3 seconds in
            const userVolume = usePlayerStore.getState().volume;

            // 1. Fade out current track
            console.log(`  📉 Fading out current track (${fadeDuration / 1000}s)...`);
            await this.logarithmicFade(userVolume, 0, fadeDuration);

            // 2. Pause current track and lock volume at 0
            console.log('  ⏸️  Pausing current track...');
            await spotifyPlayback.pause();
            await spotifyPlayback.setVolume(0);

            // Brief silence gap
            await new Promise(resolve => setTimeout(resolve, 300));

            // 3. Switch track
            console.log('  🔄 Switching track...');

            // Update UI
            usePlayerStore.getState().setCurrentTrack(targetTrack, true);

            // Only refresh token if needed
            const now = Date.now();
            const tokenExpiresAt = spotifyAuthService.tokenExpiration;
            const fiveMinutes = 5 * 60 * 1000;

            if (!tokenExpiresAt || (now + fiveMinutes) >= tokenExpiresAt) {
                await spotifyAuthService.refreshAccessToken();
            }

            // Start new track (volume is already at 0 from above)
            await spotifyPlayback.play(targetTrack.audioUrl);

            // Ensure volume is STILL at 0 after track loads
            await new Promise(resolve => setTimeout(resolve, 200));
            await spotifyPlayback.setVolume(0);
            console.log('  🔈 Volume confirmed at 0 before fade in');

            // 4. Fade in next track
            console.log(`  📈 Fading in next track (${fadeDuration / 1000}s)...`);
            await this.logarithmicFade(0, userVolume, fadeDuration);

            console.log('✅ Transition complete!');

        } catch (error) {
            console.error('❌ Transition failed:', error);
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
            const updateInterval = 100; // Update every 100ms (10 times per second)

            console.log(`    🔊 Fade: ${from.toFixed(2)} → ${to.toFixed(2)} over ${durationMs}ms`);

            const interval = setInterval(async () => {
                const elapsed = Date.now() - startTime;
                const linearProgress = Math.min(elapsed / durationMs, 1);

                // Apply logarithmic curve (equal-power crossfade)
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

                console.log(`    🔊 Volume: ${volume.toFixed(2)} (${(linearProgress * 100).toFixed(0)}%)`);

                try {
                    await spotifyPlayback.setVolume(volume);
                } catch (e) {
                    console.error('Failed to set volume:', e);
                }

                if (linearProgress >= 1) {
                    clearInterval(interval);
                    console.log(`    🔊 Fade complete: ${to.toFixed(2)}`);
                    resolve();
                }
            }, updateInterval);
        });
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
