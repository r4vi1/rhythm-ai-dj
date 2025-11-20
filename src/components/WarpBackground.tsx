import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';

export const WarpBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { isPlaying, currentTrack } = usePlayerStore();

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
        const numStars = 200; // Reduced from 400 for subtlety
        const baseSpeed = 0.5; // Much slower base speed

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: (Math.random() - 0.5) * width * 2,
                y: (Math.random() - 0.5) * height * 2,
                z: Math.random() * width,
                pz: Math.random() * width
            });
        }

        let animationFrameId: number;

        const animate = () => {
            // Darker fade for cleaner look
            ctx.fillStyle = 'rgba(10, 3, 3, 0.2)'; // Matches background better
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            // Rhythm calculation
            let beatImpulse = 0;
            if (isPlaying && currentTrack) {
                const bpm = currentTrack.bpm || 120;
                const beatDuration = 60 / bpm;
                const now = Date.now() / 1000;
                const phase = (now % beatDuration) / beatDuration;

                // Sharp impulse on the beat
                beatImpulse = Math.pow(Math.sin(phase * Math.PI), 10) * 0.5;
            }

            const currentSpeed = baseSpeed + (beatImpulse * 2); // Speed up on beat

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
                    // Modulate opacity with beat
                    const alpha = ((1 - star.z / width) * 0.3) + (beatImpulse * 0.2);

                    ctx.beginPath();
                    // Subtle gradient
                    const gradient = ctx.createLinearGradient(px, py, x, y);
                    gradient.addColorStop(0, `rgba(225, 29, 72, ${alpha})`); // Primary Red
                    gradient.addColorStop(1, `rgba(245, 158, 11, ${alpha})`); // Secondary Amber

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = size * (1 + beatImpulse); // Pulse size
                    ctx.moveTo(px, py);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, currentTrack]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
        />
    );
};
