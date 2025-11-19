import * as Tone from 'tone';

class BridgeGenerator {
    private kick: Tone.MembraneSynth;
    private hihat: Tone.MetalSynth;
    private loop: Tone.Loop | null = null;
    private isPlaying = false;

    constructor() {
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

        // Lower volume slightly to sit behind the mix
        this.kick.volume.value = -6;
        this.hihat.volume.value = -12;
    }

    public start(bpm: number) {
        if (this.isPlaying) return;

        Tone.Transport.bpm.value = bpm;

        // Simple 4/4 House/Techno Beat
        this.loop = new Tone.Loop((time) => {
            this.kick.triggerAttackRelease("C1", "8n", time);
            this.hihat.triggerAttackRelease("32n", time + Tone.Time("4n").toSeconds() / 2); // Off-beat hat
        }, "4n").start(0);

        Tone.Transport.start();
        this.isPlaying = true;
    }

    public stop() {
        if (!this.isPlaying) return;

        if (this.loop) {
            this.loop.stop();
            this.loop.dispose();
            this.loop = null;
        }

        // Don't stop Transport if other things use it, but for now we assume we control it
        // Tone.Transport.stop(); 
        this.isPlaying = false;
    }

    public rampToBpm(targetBpm: number, duration: number) {
        Tone.Transport.bpm.rampTo(targetBpm, duration);
    }

    public setVolume(value: number) {
        // Master volume for bridge elements
        // We could route them to a bus, but direct setting is fine for MVP
        const db = Tone.gainToDb(value);
        this.kick.volume.rampTo(db - 6, 0.1);
        this.hihat.volume.rampTo(db - 12, 0.1);
    }
}

export const bridgeGenerator = new BridgeGenerator();
