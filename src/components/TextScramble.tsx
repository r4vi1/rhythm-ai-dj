import React, { useState, useEffect } from 'react';

interface TextScrambleProps {
    text: string;
    className?: string;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

export const TextScramble: React.FC<TextScrambleProps> = ({ text, className = '' }) => {
    const [display, setDisplay] = useState(text);

    useEffect(() => {
        let iteration = 0;
        let interval: ReturnType<typeof setInterval>;

        const scramble = () => {
            interval = setInterval(() => {
                setDisplay(
                    text
                        .split('')
                        .map((_, index) => {
                            if (index < iteration) {
                                return text[index];
                            }
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join('')
                );

                if (iteration >= text.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 3;
            }, 30);
        };

        // Trigger on mount and hover (if we added hover logic, but for now just mount)
        scramble();

        return () => clearInterval(interval);
    }, [text]);

    return <span className={`font-mono ${className}`}>{display}</span>;
};
