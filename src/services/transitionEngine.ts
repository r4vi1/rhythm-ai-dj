import * as Tone from 'tone';
import { usePlayerStore } from '../stores/usePlayerStore';
import { bridgeGenerator } from './bridgeGenerator';
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
        console.log('🎛️ Starting AGGRESSIVE BRIDGE transition...');

        try {
            // 1. INSTANT START: Start Bridge IMMEDIATELY
            // We don't wait for analysis. We use current track's BPM if known, or default.
            // We'll try to get a quick read from cache or default to 128 (House)
            const currentAnalysis = await audioAnalyzer.analyzeTrack(currentTrack); // Should be cached
            const startBpm = currentAnalysis ? currentAnalysis.bpm : 128;

            console.log(`  🚀 INSTANT START at ${startBpm} BPM`);

            await Tone.start();
            // Start bridge with full energy
            bridgeGenerator.generateFrom({
                duration: 4, // 4 bars default
                technique: 'bridge',
                bpmAdjustment: false,
                eqCurve: { low: 'swap', mid: 'neutral', high: 'neutral' },
                generatedElements: { kick: true, snare: true, hihat: true, synth: true, riser: true },
                mixInPoint: 0,
                mixOutPoint: 0
            } as TransitionPlan, startBpm, startBpm); // Start at current BPM

            bridgeGenerator.setVolume(0.8); // Full volume immediately
            bridgeGenerator.setIntensity(0.5); // Start with moderate intensity

            // 2. AGGRESSIVE DUCK: Cut current track volume fast
            console.log('  📉 Aggressive ducking...');
            await this.fadeVolume(0.8, 0, 500); // Fast 500ms fade out

            // 3. Analyze Next Track (while bridge is playing)
            const nextAnalysis = await audioAnalyzer.analyzeTrack(nextTrack);
            console.log(`  Next BPM: ${nextAnalysis.bpm}`);

            // Ramp bridge to next BPM
            Tone.Transport.bpm.rampTo(nextAnalysis.bpm, 2);
            bridgeGenerator.setIntensity(1.0); // Ramp up intensity

            // 4. Switch Track
            console.log('  🔄 Switching Spotify track...');
            await spotifyPlayback.play(nextTrack.audioUrl);
            usePlayerStore.getState().setCurrentTrack(nextTrack);

            // 5. Wait for Buffering (Bridge is driving the party)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 6. Fade In Next Track
            console.log('  📈 Fading in next track...');
            await this.fadeVolume(0, 0.8, 1000); // Fast fade in

            // 7. Stop Bridge
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
