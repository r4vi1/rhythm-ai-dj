import * as Tone from 'tone';
import { usePlayerStore } from '../stores/usePlayerStore';
import { bridgeGenerator } from './bridgeGenerator';
import type { TransitionPlan } from './transitionPlanner';
import type { Track } from '../stores/usePlayerStore';
import { audioAnalyzer } from './audioAnalyzer';
import { transitionPlanner } from './transitionPlanner';
import { spotifyPlayback } from './spotifyPlayback';

class TransitionEngine {
    private player: any; // Spotify player reference
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
        console.log('🎛️ Starting intelligent transition...');

        try {
            // 1. Analyze both tracks
            console.log('  📊 Analyzing tracks...');
            const [analysis1, analysis2] = await Promise.all([
                audioAnalyzer.analyzeTrack(currentTrack),
                audioAnalyzer.analyzeTrack(nextTrack)
            ]);

            console.log(`  Current: ${analysis1.bpm} BPM, ${analysis1.key}, ${analysis1.energy} energy`);
            console.log(`  Next: ${analysis2.bpm} BPM, ${analysis2.key}, ${analysis2.energy} energy`);

            // 2. Plan transition
            console.log('  🧠 Planning transition strategy...');
            const plan = await transitionPlanner.plan(analysis1, analysis2);
            console.log(`  Strategy: ${plan.technique}, ${plan.duration}s, EQ: ${plan.eqCurve.low}`);

            // 3. Execute transition based on plan
            await this.executeTransition(currentTrack, nextTrack, plan, analysis1, analysis2);

        } catch (error) {
            console.error('❌ Transition failed:', error);
            // Fallback to simple crossfade
            await this.simpleCrossfade(nextTrack);
        } finally {
            this.isTransitioning = false;
        }
    }

    private async executeTransition(
        currentTrack: Track,
        nextTrack: Track,
        plan: TransitionPlan,
        analysis1: any,
        analysis2: any
    ) {
        const { duration, technique, generatedElements } = plan;

        // 1. Start generated bridge elements if requested
        const hasGeneratedElements = Object.values(generatedElements).some(v => v);
        if (hasGeneratedElements) {
            console.log('  🎵 Generating transition elements...');
            bridgeGenerator.generateFrom(plan, analysis1.bpm, analysis2.bpm);
        }

        // 2. Execute transition technique
        switch (technique) {
            case 'bass-swap':
                await this.bassSwapTransition(currentTrack, nextTrack, duration);
                break;
            case 'filter-sweep':
                await this.filterSweepTransition(currentTrack, nextTrack, duration);
                break;
            case 'echo-out':
                await this.echoOutTransition(currentTrack, nextTrack, duration);
                break;
            default:
                await this.crossfadeTransition(currentTrack, nextTrack, duration);
        }

        // 3. Stop bridge elements after transition
        if (hasGeneratedElements) {
            setTimeout(() => {
                bridgeGenerator.stop();
            }, duration * 1000);
        }
    }

    private async bassSwapTransition(currentTrack: Track, nextTrack: Track, duration: number) {
        console.log('  ⚡ Bass swap technique');

        // For Spotify, we coordinate volume fades
        const startTime = Date.now();
        const transition = setInterval(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            // Crossfade volumes
            const currentVolume = (1 - progress) * 100;
            const nextVolume = progress * 100;

            // Note: Spotify Web Playback SDK doesn't expose EQ controls
            // So we simulate bass swap with volume curves

            if (progress >= 0.5 && !nextTrack) {
                // Start next track at midpoint
                await spotifyPlayback.play(nextTrack.audioUrl);
            }

            if (progress >= 1) {
                clearInterval(transition);
                usePlayerStore.getState().setCurrentTrack(nextTrack);
            }
        }, 50);
    }

    private async filterSweepTransition(currentTrack: Track, nextTrack: Track, duration: number) {
        console.log('  🌊 Filter sweep technique');
        // Similar to bass swap - Spotify limitations mean we do volume-based
        await this.crossfadeTransition(currentTrack, nextTrack, duration);
    }

    private async echoOutTransition(currentTrack: Track, nextTrack: Track, duration: number) {
        console.log('  🔊 Echo out technique');
        // Would need access to raw audio for true echo effect
        await this.crossfadeTransition(currentTrack, nextTrack, duration);
    }

    private async crossfadeTransition(currentTrack: Track, nextTrack: Track, duration: number) {
        console.log('  〰️  Crossfade technique');

        const startTime = Date.now();
        let nextStarted = false;

        const transition = setInterval(async () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            // Start next track at 30% progress
            if (progress >= 0.3 && !nextStarted) {
                await spotifyPlayback.play(nextTrack.audioUrl);
                nextStarted = true;
            }

            if (progress >= 1) {
                clearInterval(transition);
                usePlayerStore.getState().setCurrentTrack(nextTrack);
            }
        }, 100);
    }

    private async simpleCrossfade(nextTrack: Track) {
        console.log('  ↔️  Simple crossfade (fallback)');
        setTimeout(async () => {
            await spotifyPlayback.play(nextTrack.audioUrl);
            usePlayerStore.getState().setCurrentTrack(nextTrack);
        }, 2000);
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
