import React, { useEffect, useRef } from 'react';

interface InteractiveBackgroundProps {
    isHovering: boolean;
}

export const InteractiveBackground: React.FC<InteractiveBackgroundProps> = ({ isHovering }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isHoveringRef = useRef(isHovering);

    useEffect(() => {
        isHoveringRef.current = isHovering;
    }, [isHovering]);

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

        // Particle Grid System
        const particles: { x: number; z: number; y: number; baseY: number }[] = [];
        const gap = 30; // Distance between particles
        const rows = Math.ceil(height / gap) + 10;
        const cols = Math.ceil(width / gap) + 10;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                particles.push({
                    x: c * gap - (gap * 5), // Offset to cover edges
                    z: r * gap, // We'll map Z to Y for 3D effect if needed, or just use 2D grid
                    y: 0,
                    baseY: 0
                });
            }
        }

        let time = 0;
        let mouseX = width / 2;
        let mouseY = height / 2;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            time += 0.02;

            ctx.fillStyle = '#E11D48'; // Crimson

            particles.forEach((p) => {
                // 2D Grid coordinates
                const px = p.x;
                const py = p.z; // Using Z as vertical screen coordinate for the grid

                // Distance from mouse
                const dx = px - mouseX;
                const dy = py - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Ripple Wave Logic
                // Base wave
                const wave = Math.sin(px * 0.01 + time) * Math.cos(py * 0.01 + time) * 10;

                // Mouse interaction ripple
                const interaction = Math.max(0, (300 - dist) / 300); // 0 to 1 based on distance
                const ripple = Math.sin(dist * 0.05 - time * 5) * 20 * interaction;

                // Combined offset
                const offsetY = wave + ripple;

                // Draw
                let size = 1.5 + (interaction * 2); // Particles grow near mouse

                // Base alpha + Interaction + Global Hover Boost
                let alpha = 0.3 + (interaction * 0.7);

                if (isHoveringRef.current) {
                    alpha += 0.35; // Increased brightness boost (was 0.2)
                    size *= 0.8;   // Slightly smaller particles on hover
                }

                ctx.globalAlpha = Math.min(1, alpha);
                ctx.beginPath();
                ctx.arc(px, py + offsetY, size, 0, Math.PI * 2);
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none mix-blend-screen"
        />
    );
};
