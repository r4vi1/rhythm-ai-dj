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

    constructor() {
        // Kick Drum
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

        // Snare
        this.snare = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0
            }
        }).toDestination();

        // Hi-Hat
        this.hihat = new Tone.MetalSynth({
            frequency: 200,
            envelope: {
                attack: 0.001,
                decay: 0.1,
                release: 0.01
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).toDestination();

        // Bass Synth
        this.bass = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.4,
                release: 0.5
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.5,
                release: 0.8,
                baseFrequency: 200,
                octaves: 2
            }
        }).toDestination();

        // Set volumes
        this.kick.volume.value = -6;
        this.snare.volume.value = -10;
        this.hihat.volume.value = -12;
        this.bass.volume.value = -15;
    }

    public generateFrom(plan: TransitionPlan, fromBpm: number, toBpm: number) {
        if (this.isPlaying) this.stop();

        const avgBpm = (fromBpm + toBpm) / 2;
        Tone.Transport.bpm.value = avgBpm;

        // Add requested elements
        if (plan.generatedElements.kick) {
            this.addKickPattern();
        }
        if (plan.generatedElements.snare) {
            this.addSnarePattern();
        }
        if (plan.generatedElements.hihat) {
            this.addHiHatPattern();
        }
        if (plan.generatedElements.synth) {
            this.addBassSynth();
        }
        if (plan.generatedElements.riser) {
            this.addRiser(plan.duration);
        }

        // Ramp BPM if adjustment needed
        if (plan.bpmAdjustment) {
            this.rampToBpm(toBpm, plan.duration);
        }

        Tone.Transport.start();
        this.isPlaying = true;
    }

    private addKickPattern() {
        // 4-on-the-floor house kick
        const loop = new Tone.Loop((time) => {
            this.kick.triggerAttackRelease("C1", "8n", time);
        }, "4n").start(0);

        this.loops.push(loop);
    }

    private addSnarePattern() {
        // Snare on 2 and 4
        const loop = new Tone.Loop((time) => {
            this.snare.triggerAttackRelease("16n", time);
        }, "2n").start(Tone.Time("4n").toSeconds());

        this.loops.push(loop);
    }

    private addHiHatPattern() {
        // Off-beat hi-hats
        const loop = new Tone.Loop((time) => {
            this.hihat.triggerAttackRelease("32n", time);
        }, "8n").start(Tone.Time("8n").toSeconds());

        this.loops.push(loop);
    }

    private addBassSynth() {
        // Simple bass pattern
        const loop = new Tone.Loop((time) => {
            this.bass.triggerAttackRelease("C2", "8n", time);
        }, "2n").start(0);

        this.loops.push(loop);
    }

    private addRiser(duration: number) {
        // White noise riser with filter sweep
        this.riser = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.01,
                decay: 0,
                sustain: 1,
                release: 0.1
            }
        }).toDestination();

        const filter = new Tone.Filter(100, "lowpass").toDestination();
        this.riser.connect(filter);

        this.riser.volume.value = -20;
        this.riser.triggerAttack("C4");

        // Sweep filter
        filter.frequency.rampTo(10000, duration);

        // Stop after duration
        setTimeout(() => {
            if (this.riser) {
                this.riser.triggerRelease();
                setTimeout(() => {
                    this.riser?.dispose();
                    this.riser = null;
                    filter.dispose();
                }, 200);
            }
        }, duration * 1000);
    }

    private rampToBpm(targetBpm: number, duration: number) {
        Tone.Transport.bpm.rampTo(targetBpm, duration);
    }

    public stop() {
        if (!this.isPlaying) return;

        // Stop all loops
        this.loops.forEach(loop => {
            loop.stop();
            loop.dispose();
        });
        this.loops = [];

        // Stop riser if playing
        if (this.riser) {
            this.riser.triggerRelease();
            setTimeout(() => {
                this.riser?.dispose();
                this.riser = null;
            }, 200);
        }

        this.isPlaying = false;
    }

    public setVolume(value: number) {
        const db = Tone.gainToDb(value);
        this.kick.volume.rampTo(db - 6, 0.1);
        this.snare.volume.rampTo(db - 10, 0.1);
        this.hihat.volume.rampTo(db - 12, 0.1);
        this.bass.volume.rampTo(db - 15, 0.1);
        if (this.riser) {
            this.riser.volume.rampTo(db - 20, 0.1);
        }
    }
}

export const bridgeGenerator = new EnhancedBridgeGenerator();
