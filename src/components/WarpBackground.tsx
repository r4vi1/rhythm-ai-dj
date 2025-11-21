import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { audioAnalyzer } from '../services/audioAnalyzer';

export const WarpBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { isPlaying, currentTrack } = usePlayerStore();
    const [energy, setEnergy] = React.useState(0.6); // Default medium energy

    // Envelope follower for smooth beat response
    const beatEnvelopeRef = useRef({ value: 0, target: 0 });

    // Fetch Audio Analysis
    useEffect(() => {
        if (currentTrack) {
            audioAnalyzer.analyzeTrack(currentTrack).then(analysis => {
                if (analysis && analysis.energy) {
                    setEnergy(analysis.energy);
                }
            }).catch(() => setEnergy(0.6));
        }
    }, [currentTrack]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // Star properties
        const stars: { x: number; y: number; z: number; pz: number }[] = [];
        const numStars = 200;
        const baseSpeed = 0.5;

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: (Math.random() - 0.5) * width * 2,
                y: (Math.random() - 0.5) * height * 2,
                z: Math.random() * width,
                pz: Math.random() * width
            });
        }

        let animationFrameId: number;
        let lastTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000; // seconds
            lastTime = now;

            // Darker fade for cleaner look
            ctx.fillStyle = 'rgba(5, 2, 2, 0.3)'; // Slightly more opaque for trails
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            // Rhythm calculation with percussive envelope
            let beatTarget = 0;
            let kick = 0;

            if (isPlaying && currentTrack) {
                const bpm = currentTrack.bpm || 120;
                const beatDuration = 60 / bpm;
                const nowSec = now / 1000;
                const phase = (nowSec % beatDuration) / beatDuration;

                // Complex rhythmic simulation
                // 1. Kick drum (sharp peak at start of beat)
                kick = Math.pow(Math.max(0, 1 - phase * 4), 4);

                // 2. Snare/Clap (peak at 0.5 phase)
                const snarePhase = (phase + 0.5) % 1;
                const snare = Math.pow(Math.max(0, 1 - Math.abs(snarePhase - 0.5) * 8), 8) * 0.5;

                // 3. Hi-hats (16th notes)
                const hatPhase = (nowSec % (beatDuration / 4)) / (beatDuration / 4);
                const hat = Math.pow(Math.max(0, 1 - hatPhase * 2), 16) * 0.1;

                beatTarget = (kick + snare + hat) * energy; // Scale by energy
            }

            // Envelope follower
            const envelope = beatEnvelopeRef.current;
            const attackTime = 0.05;
            const releaseTime = 0.2;

            if (beatTarget > envelope.value) {
                envelope.value += (beatTarget - envelope.value) * Math.min(deltaTime / attackTime, 1);
            } else {
                envelope.value += (beatTarget - envelope.value) * Math.min(deltaTime / releaseTime, 1);
            }

            // Apply easing
            const easedBeat = envelope.value;

            // Add some "noise" or drift
            const drift = Math.sin(now / 2000) * 0.2;

            // Dynamic Speed based on Energy
            const currentSpeed = baseSpeed + (easedBeat * 8 * energy) + drift;

            // Bass Zoom Effect (Kick)
            const zoom = 1 + (kick * 0.05 * energy); // 5% zoom on kick

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(zoom, zoom);
            ctx.translate(-cx, -cy);

            stars.forEach(star => {
                // Move star
                star.z -= currentSpeed;

                // Reset if behind camera
                if (star.z <= 0) {
                    star.z = width;
                    star.pz = width;
                    star.x = (Math.random() - 0.5) * width * 2;
                    star.y = (Math.random() - 0.5) * height * 2;
                }

                // Project 3D position to 2D
                const x = (star.x / star.z) * cx + cx;
                const y = (star.y / star.z) * cy + cy;

                // Previous position for trail
                const px = (star.x / star.pz) * cx + cx;
                const py = (star.y / star.pz) * cy + cy;

                star.pz = star.z;

                // Draw star trail
                if (x >= 0 && x <= width && y >= 0 && y <= height) {
                    const size = (1 - star.z / width);
                    // Modulate opacity with eased beat and energy
                    const alpha = ((1 - star.z / width) * 0.3) + (easedBeat * 0.5 * energy);

                    ctx.beginPath();
                    // Subtle gradient
                    const gradient = ctx.createLinearGradient(px, py, x, y);
                    gradient.addColorStop(0, `rgba(225, 29, 72, ${alpha})`); // Primary Red
                    gradient.addColorStop(1, `rgba(245, 158, 11, ${alpha})`); // Secondary Amber

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = size * (1 + easedBeat * 2 * energy); // Pulse size with easing
                    ctx.moveTo(px, py);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            });

            ctx.restore();

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, currentTrack, energy]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
        />
    );
};
