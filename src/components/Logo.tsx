import React from 'react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
            >
                <path
                    d="M20 4L4 36H12L20 20L28 36H36L20 4Z"
                    fill="currentColor"
                    className="drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                />
                <path
                    d="M20 4L28 20H12L20 4Z"
                    fill="#06b6d4"
                    className="mix-blend-overlay"
                />
            </svg>
            <span className="font-display font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                RHYTHM
            </span>
        </div>
    );
};
