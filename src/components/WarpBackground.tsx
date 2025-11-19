import React, { useEffect, useRef } from 'react';

export const WarpBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
        const numStars = 400; // Reduced count
        const speed = 2; // Much slower, drifting feel

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: (Math.random() - 0.5) * width * 2,
                y: (Math.random() - 0.5) * height * 2,
                z: Math.random() * width,
                pz: Math.random() * width // Previous z
            });
        }

        let animationFrameId: number;

        const animate = () => {
            // Trail effect - darker fade for cleaner look
            ctx.fillStyle = 'rgba(3, 0, 20, 0.2)';
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            stars.forEach(star => {
                // Move star closer
                star.z -= speed;

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
                    const size = (1 - star.z / width) * 2;
                    const alpha = (1 - star.z / width) * 0.5; // Lower opacity

                    ctx.beginPath();
                    // Gradient from violet to blue
                    const gradient = ctx.createLinearGradient(px, py, x, y);
                    gradient.addColorStop(0, `rgba(139, 92, 246, ${alpha})`); // Violet
                    gradient.addColorStop(1, `rgba(59, 130, 246, ${alpha})`); // Blue

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = size;
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
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-none"
        />
    );
};
