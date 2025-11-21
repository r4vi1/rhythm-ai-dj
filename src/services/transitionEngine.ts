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

        console.log(`🎛️  executeTransition called (instance: ${this.instanceId})`);
        console.log(`  preparedPlan exists: ${this.preparedPlan !== null}`);
        console.log(`  preparedNextTrack exists: ${this.preparedNextTrack !== null}`);
        console.log(`  nextTrack arg provided: ${nextTrack !== undefined}`);

        // Use prepared plan or fallback
        const plan = this.preparedPlan;
        const targetTrack = nextTrack || this.preparedNextTrack;

        if (!plan || !targetTrack) {
            console.warn('⚠️  No prepared transition, using simple play');
            if (targetTrack) await this.play(targetTrack);
            return;
        }

        this.isTransitioning = true;
        console.log(`🎛️  Executing ${plan.technique} transition (${plan.duration}s)`);

        // Update UI immediately to show next track
        usePlayerStore.getState().setCurrentTrack(targetTrack);

        try {
            // Start Tone.js for bridge generation
            await Tone.start();

            // Calculate phase durations (split total duration into 3 phases)
            const phaseDuration = plan.duration / 3;
            const phase1Duration = phaseDuration; // Overlap
            const phase2Duration = phaseDuration; // Dominance
            const phase3Duration = phaseDuration; // Handoff

            // --- PHASE 1: OVERLAP (Current track ducks, Bridge fades in) ---
            console.log('  Phase 1: Overlap (Current → 40%, Bridge → 80%)');

            // Generate bridge with plan's elements
            if (Object.values(plan.generatedElements).some(v => v)) {
                const currentAnalysis = await audioAnalyzer.analyzeTrack(usePlayerStore.getState().currentTrack!);
                const nextAnalysis = await audioAnalyzer.analyzeTrack(targetTrack);
                bridgeGenerator.generateFrom(plan, currentAnalysis.bpm, nextAnalysis.bpm);
            }

            // Fade current track: 100% → 40% (logarithmic)
            const fadeCurrentDown = this.logarithmicFade(1.0, 0.4, phase1Duration * 1000);

            // Fade bridge in: 0% → 80%
            bridgeGenerator.setVolume(0);
            const fadeBridgeIn = new Promise(resolve => {
                setTimeout(() => {
                    bridgeGenerator.setVolume(0.8);
                    resolve(undefined);
                }, phase1Duration * 1000);
            });

            await Promise.all([fadeCurrentDown, fadeBridgeIn]);

            // --- PHASE 2: BRIDGE DOMINANCE (Current fades out, Bridge solo) ---
            console.log('  Phase 2: Dominance (Current → 0%, Bridge @ 80%)');

            // Fade current track: 40% → 0%
            const fadePhase2 = this.logarithmicFade(0.4, 0, phase2Duration * 1000);

            // Halfway through phase 2, start next track (muted)
            const loadNextTrack = new Promise(async (resolve) => {
                setTimeout(async () => {
                    console.log('  🔄 Loading next track (muted)...');
                    try {
                        // play() now handles token refresh internally
                        await spotifyPlayback.play(targetTrack.audioUrl);
                        await spotifyPlayback.setVolume(0);
                        console.log('  ✅ Next track loaded successfully (muted)');
                    } catch (error) {
                        console.error('❌ Failed to load next track:', error);
                    }
                    resolve(undefined);
                }, (phase2Duration * 1000) / 2);
            });

            await Promise.all([fadePhase2, loadNextTrack]);

            // --- PHASE 3: HANDOFF (Bridge fades out, Next track fades in) ---
            console.log('  Phase 3: Handoff (Bridge → 0%, Next → 100%)');

            // Fade bridge out: 80% → 0%
            const fadeBridgeOut = new Promise(resolve => {
                setTimeout(() => {
                    bridgeGenerator.setVolume(0);
                    bridgeGenerator.stop();
                    resolve(undefined);
                }, phase3Duration * 1000);
            });

            // Fade next track in: 0% → 100% (logarithmic)
            const userVolume = usePlayerStore.getState().volume;
            const fadeNextTrackIn = this.logarithmicFade(0, userVolume, phase3Duration * 1000);

            await Promise.all([fadeBridgeOut, fadeNextTrackIn]);

            console.log('✅ Transition complete!');

        } catch (error) {
            console.error('❌ Transition execution failed:', error);
            // Fallback to simple crossfade
            await this.simpleCrossfade(targetTrack);
        } finally {
            this.isTransitioning = false;
            this.preparedPlan = null;
            this.preparedNextTrack = null;
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
