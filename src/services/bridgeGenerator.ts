import * as Tone from 'tone';
import type { TransitionPlan } from './transitionPlanner';

class EnhancedBridgeGenerator {
    private kick: Tone.MembraneSynth;
    private snare: Tone.NoiseSynth;
    private hihat: Tone.MetalSynth;
    private bass: Tone.MonoSynth;
    private riser: Tone.Synth | null = null;
    private loops: Tone.Loop[] = [];
    private isPlaying = false;
    private intensity = 0;

    constructor() {
        // Punchier Kick
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4,
                attackCurve: "exponential"
            }
        }).toDestination();

        // Crisper Snare/Clap
        this.snare = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0
            }
        }).toDestination();

        // Sharp Hi-Hat
        this.hihat = new Tone.MetalSynth({
            envelope: {
                attack: 0.001,
                decay: 0.05,
                release: 0.01
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).toDestination();
        this.hihat.frequency.value = 200;

        // Driving Bass
        this.bass = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.5,
                release: 0.2
            },
            filterEnvelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0.2,
                release: 0.2,
                baseFrequency: 100,
                octaves: 4
            }
        }).toDestination();

        // Set initial volumes
        this.kick.volume.value = -6;
        this.snare.volume.value = -10;
        this.hihat.volume.value = -12;
        this.bass.volume.value = -10;
    }

    public generateFrom(plan: TransitionPlan, fromBpm: number, toBpm: number) {
        // CRITICAL: Must stop and cancel Transport to prevent timing conflicts
        if (this.isPlaying) this.stop();

        // Cancel all scheduled events on Transport timeline
        Tone.Transport.cancel();

        // Start with current BPM for instant match
        Tone.Transport.bpm.value = fromBpm;

        // Ramp to target BPM over the duration
        Tone.Transport.bpm.rampTo(toBpm, plan.duration);

        // Add driving elements based on plan
        if (plan.generatedElements.kick) this.addKickPattern();
        if (plan.generatedElements.snare) this.addSnarePattern();
        if (plan.generatedElements.hihat) this.addHiHatPattern();
        if (plan.generatedElements.bass) this.addBassPattern();

        if (plan.generatedElements.riser) {
            this.addRiser(plan.duration);
        }

        Tone.Transport.start();
        this.isPlaying = true;
    }

    public setIntensity(value: number) {
        this.intensity = Math.max(0, Math.min(1, value));

        // Open up filters and decay as intensity increases
        const filterFreq = 100 + (this.intensity * 4000);
        this.bass.filterEnvelope.baseFrequency = filterFreq;

        // Make hi-hats louder and sharper
        this.hihat.volume.rampTo(-12 + (this.intensity * 6), 0.1);
        this.hihat.envelope.decay = 0.05 + (this.intensity * 0.1);
    }

    private addKickPattern() {
        // Driving 4-on-the-floor with ghost notes
        const loop = new Tone.Loop((time) => {
            this.kick.triggerAttackRelease("C1", "8n", time);
            // Occasional ghost kick on off-beat 16th
            if (Math.random() > 0.7) {
                this.kick.triggerAttackRelease("C1", "16n", time + Tone.Time("8n").toSeconds() / 2, 0.5);
            }
        }, "4n").start(0);

        this.loops.push(loop);
    }

    private addSnarePattern() {
        // Snare on 2 and 4 with occasional fills
        const loop = new Tone.Loop((time) => {
            this.snare.triggerAttackRelease("16n", time);
        }, "2n").start(Tone.Time("4n").toSeconds());

        this.loops.push(loop);
    }

    private addHiHatPattern() {
        // 16th note driving hi-hats
        const loop = new Tone.Loop((time) => {
            // Accent the off-beats
            const velocity = 0.5 + (this.intensity * 0.5);
            this.hihat.triggerAttackRelease("32n", time, velocity);

            // Add 16th note in between
            this.hihat.triggerAttackRelease("32n", time + Tone.Time("8n").toSeconds() / 2, velocity * 0.6);
        }, "8n").start(0);

        this.loops.push(loop);
    }

    private addBassPattern() {
        // Rolling bassline (off-beat)
        const loop = new Tone.Loop((time) => {
            this.bass.triggerAttackRelease("C2", "8n", time);
        }, "8n").start(Tone.Time("8n").toSeconds());

        this.loops.push(loop);
    }

    private addRiser(duration: number) {
        this.riser = new Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: duration, decay: 0, sustain: 1, release: 1 }
        }).toDestination();

        const filter = new Tone.Filter(200, "lowpass", -24).toDestination();
        this.riser.connect(filter);

        this.riser.volume.value = -20;
        this.riser.triggerAttack("C4");

        filter.frequency.rampTo(12000, duration);

        setTimeout(() => {
            if (this.riser) {
                this.riser.triggerRelease();
                setTimeout(() => {
                    this.riser?.dispose();
                    this.riser = null;
                    filter.dispose();
                }, 1000);
            }
        }, duration * 1000);
    }

    public stop() {
        if (!this.isPlaying) return;

        // Stop loops
        this.loops.forEach(loop => {
            loop.stop();
            loop.dispose();
        });
        this.loops = [];

        // Stop riser
        if (this.riser) {
            this.riser.triggerRelease();
            this.riser = null;
        }

        // CRITICAL: Proper Transport cleanup sequence
        // 1. Stop Transport (halts clock)
        Tone.Transport.stop();
        // 2. Wait for stop to complete, then cancel all scheduled events
        // Must be done in this order to prevent timing conflicts
        setTimeout(() => {
            Tone.Transport.cancel();
        }, 50);

        this.isPlaying = false;
    }

    public setVolume(value: number) {
        const db = Tone.gainToDb(value);
        this.kick.volume.rampTo(db - 6, 0.1);
        this.snare.volume.rampTo(db - 10, 0.1);
        this.hihat.volume.rampTo(db - 12 + (this.intensity * 6), 0.1);
        this.bass.volume.rampTo(db - 10, 0.1);
    }

    public fadeTo(targetVolume: number, durationMs: number) {
        const db = Tone.gainToDb(targetVolume);
        const durationSec = durationMs / 1000;

        this.kick.volume.rampTo(db - 6, durationSec);
        this.snare.volume.rampTo(db - 10, durationSec);
        this.hihat.volume.rampTo(db - 12 + (this.intensity * 6), durationSec);
        this.bass.volume.rampTo(db - 10, durationSec);
    }
}

export const bridgeGenerator = new EnhancedBridgeGenerator();
