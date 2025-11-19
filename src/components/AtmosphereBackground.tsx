import React from 'react';

export const AtmosphereBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0303] pointer-events-none">
            {/* Deep Space Base */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0303] via-[#1a0505] to-[#000000]" />

            {/* CSS Animated Light Leaks (GPU Accelerated) */}
            <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />

            <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen animate-blob-delayed" />

            <div className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] bg-orange-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow" />

            {/* Noise Overlay (Very Subtle & Static) */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            />
        </div>
    );
};
