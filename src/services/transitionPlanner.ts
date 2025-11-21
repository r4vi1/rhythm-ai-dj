import { geminiService } from './geminiService';
import type { TrackAnalysis } from './audioAnalyzer';

export interface TransitionPlan {
    duration: number; // seconds (4-16 optimal)
    technique: 'crossfade' | 'bass-swap' | 'filter-sweep' | 'echo-out' | 'bridge';
    bpmAdjustment: boolean;
    eqCurve: {
        low: 'swap' | 'cut' | 'boost';
        mid: 'neutral' | 'cut';
        high: 'swap' | 'neutral';
    };
    generatedElements: {
        kick: boolean;
        snare: boolean;
        hihat: boolean;
        bass: boolean;
        riser: boolean;
    };
    mixInPoint: number; // seconds before track1 ends
    mixOutPoint: number; // seconds into track2
}

class TransitionPlannerService {
    async plan(track1: TrackAnalysis, track2: TrackAnalysis): Promise<TransitionPlan> {
        try {
            // Use the new advanced AI planning method
            const result = await geminiService.planTransitionAdvanced(
                {
                    bpm: track1.bpm,
                    key: track1.key,
                    energy: track1.energy,
                    genre: track1.genre,
                    structure: { outro: track1.structure.outro }
                },
                {
                    bpm: track2.bpm,
                    key: track2.key,
                    energy: track2.energy,
                    genre: track2.genre,
                    structure: { intro: track2.structure.intro }
                }
            );

            // Map to our TransitionPlan format
            return {
                duration: Math.max(10, Math.min(30, result.duration)), // Enforce 10-30s range
                technique: result.technique as any || 'crossfade',
                bpmAdjustment: result.bpmAdjustment || false,
                eqCurve: { low: 'swap', mid: 'neutral', high: 'neutral' }, // Default EQ curve
                generatedElements: result.generatedElements || {
                    kick: false,
                    snare: false,
                    hihat: false,
                    bass: false,
                    riser: false
                },
                mixInPoint: Math.max(15, Math.min(result.mixInPoint, 30)),
                mixOutPoint: Math.max(8, Math.min(result.mixOutPoint, 16))
            };
        } catch (error) {
            console.error('Transition planning failed:', error);
            // Safe fallback
            return this.getDefaultPlan(track1, track2);
        }
    }

    private getDefaultPlan(track1: TrackAnalysis, track2: TrackAnalysis): TransitionPlan {
        const bpmDiff = Math.abs(track1.bpm - track2.bpm) / track1.bpm;
        const energyDiff = Math.abs(track1.energy - track2.energy);

        return {
            duration: energyDiff > 0.3 ? 12 : 8,
            technique: bpmDiff > 0.1 ? 'bass-swap' : 'crossfade',
            bpmAdjustment: bpmDiff > 0.05,
            eqCurve: {
                low: 'swap',
                mid: 'neutral',
                high: 'neutral'
            },
            generatedElements: {
                kick: bpmDiff > 0.1,
                snare: false,
                hihat: energyDiff > 0.2,
                bass: energyDiff > 0.3,
                riser: energyDiff > 0.3
            },
            mixInPoint: 16,
            mixOutPoint: 8
        };
    }
}

export const transitionPlanner = new TransitionPlannerService();
