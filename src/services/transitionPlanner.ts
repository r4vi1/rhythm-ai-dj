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
        synth: boolean;
        riser: boolean;
    };
    mixInPoint: number; // seconds before track1 ends
    mixOutPoint: number; // seconds into track2
}

class TransitionPlannerService {
    async plan(track1: TrackAnalysis, track2: TrackAnalysis): Promise<TransitionPlan> {
        const prompt = `You are a world-class DJ planning a seamless transition.

Current Track:
- BPM: ${track1.bpm}
- Key: ${track1.key}
- Energy: ${track1.energy}
- Genre: ${track1.genre}
- Outro duration: ${track1.structure.outro}s

Next Track:
- BPM: ${track2.bpm}
- Key: ${track2.key}
- Energy: ${track2.energy}
- Genre: ${track2.genre}
- Intro duration: ${track2.structure.intro}s

DJ Techniques to Consider:
1. **Beat Matching**: BPMs within 5% can sync easily, >10% needs tempo adjustment
2. **Harmonic Mixing**: Compatible keys sound smooth (Camelot Wheel)
3. **Energy Flow**: Gradual energy changes feel natural (+/- 0.2 max)
4. **Genre Compatibility**: Similar genres = shorter transition (4-8s), different = longer (8-16s)

Provide a professional transition plan in EXACT JSON format:
{
  "duration": <4-16 seconds>,
  "technique": "bass-swap" | "crossfade" | "filter-sweep" | "echo-out",
  "bpmAdjustment": <true if BPM difference > 5%>,
  "eqCurve": {
    "low": "swap" | "cut" | "boost",
    "mid": "neutral" | "cut",
    "high": "swap" | "neutral"
  },
  "generatedElements": {
    "kick": <add kick drum bridge>,
    "snare": <add snare>,
    "hihat": <add hi-hat>,
    "synth": <add pad/synth>,
    "riser": <add riser effect>
  },
  "mixInPoint": <when to start transition, seconds before track1 ends>,
  "mixOutPoint": <seconds into track2 to complete>
}`;

        try {
            const result = await geminiService.generateContent(prompt);
            const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const plan: TransitionPlan = JSON.parse(jsonStr);

            // Validate and sanitize
            return {
                duration: Math.max(4, Math.min(16, plan.duration)),
                technique: plan.technique || 'crossfade',
                bpmAdjustment: plan.bpmAdjustment || false,
                eqCurve: plan.eqCurve || { low: 'swap', mid: 'neutral', high: 'neutral' },
                generatedElements: plan.generatedElements || {
                    kick: false,
                    snare: false,
                    hihat: false,
                    synth: false,
                    riser: false
                },
                mixInPoint: Math.max(4, Math.min(plan.mixInPoint, 30)),
                mixOutPoint: Math.max(0, Math.min(plan.mixOutPoint, 16))
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
                synth: energyDiff > 0.3,
                riser: energyDiff > 0.3
            },
            mixInPoint: 16,
            mixOutPoint: 8
        };
    }
}

export const transitionPlanner = new TransitionPlannerService();
