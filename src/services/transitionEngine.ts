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

    public async play(track: Track) {
        await Tone.start();

        // Stop any ongoing transition
        bridgeGenerator.stop();

        // Play via Spotify
        await spotifyPlayback.play(track.audioUrl);
        usePlayerStore.getState().setIsPlaying(true);
    }

    public async intelligentTransition(currentTrack: Track, nextTrack: Track) {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        console.log('🎛️ Starting INTELLIGENT transition...');

        try {
            // 1. Analyze Both Tracks
            const [currentAnalysis, nextAnalysis] = await Promise.all([
                audioAnalyzer.analyzeTrack(currentTrack),
                audioAnalyzer.analyzeTrack(nextTrack)
            ]);

            // 2. Generate Transition Plan
            const plan = await transitionPlanner.plan(currentAnalysis, nextAnalysis);
            console.log('📋 Transition Plan:', plan);

            await Tone.start();

            // 3. Start Bridge (Filler)
            // Use the plan's suggested elements
            bridgeGenerator.generateFrom(plan, currentAnalysis.bpm, nextAnalysis.bpm);

            bridgeGenerator.setVolume(0.8);
            bridgeGenerator.setIntensity(0.5);

            // 4. Execute Fade Out (Track 1)
            console.log(`  📉 Fading out current track over ${plan.duration}s...`);
            await this.fadeVolume(0.8, 0, plan.duration * 1000);

            // 5. Ramp Bridge to Next BPM
            Tone.Transport.bpm.rampTo(nextAnalysis.bpm, 2);
            bridgeGenerator.setIntensity(1.0);

            // 6. Switch Track
            console.log('  🔄 Switching Spotify track...');
            await spotifyPlayback.play(nextTrack.audioUrl);
            usePlayerStore.getState().setCurrentTrack(nextTrack);

            // 7. Wait for Buffering
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 8. Fade In Next Track
            console.log(`  📈 Fading in next track over ${plan.duration}s...`);
            await this.fadeVolume(0, 0.8, plan.duration * 1000);

            // 9. Stop Bridge
            console.log('  🛑 Stopping bridge...');
            bridgeGenerator.stop();

        } catch (error) {
            console.error('❌ Transition failed:', error);
            await this.simpleCrossfade(nextTrack);
        } finally {
            this.isTransitioning = false;
        }
    }



    private fadeVolume(from: number, to: number, durationMs: number): Promise<void> {
        return new Promise(resolve => {
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / durationMs, 1);

                // Linear fade
                const current = from + (to - from) * progress;
                spotifyPlayback.setVolume(current);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    private async simpleCrossfade(nextTrack: Track) {
        console.log('  ↔️  Simple crossfade (fallback)');
        await this.fadeVolume(0.8, 0, 1000);
        await spotifyPlayback.play(nextTrack.audioUrl);
        usePlayerStore.getState().setCurrentTrack(nextTrack);
        await this.fadeVolume(0, 0.8, 1000);
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
        bridgeGenerator.setVolume(value);
    }
}

export const transitionEngine = new TransitionEngine();
