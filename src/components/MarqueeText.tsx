import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MarqueeTextProps {
    text: string;
    className?: string;
    speed?: number; // pixels per second
    delay?: number; // seconds before starting
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
    text,
    className = '',
    speed = 30,
    delay = 2
}) => {
    const containerRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        const textEl = textRef.current;

        if (container && textEl) {
            const overflow = textEl.scrollWidth > container.clientWidth;
            setIsOverflowing(overflow);

            if (overflow) {
                const dist = textEl.scrollWidth;
                setDuration(dist / speed);
            }
        }
    }, [text, speed]);

    return (
        <span
            ref={containerRef}
            className={`relative overflow-hidden whitespace-nowrap inline-block w-full ${className}`}
            style={{ maskImage: isOverflowing ? 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' : 'none' }}
        >
            {isOverflowing ? (
                <span className="flex">
                    <motion.span
                        ref={textRef}
                        initial={{ x: 0 }}
                        animate={{ x: "-100%" }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: delay,
                            repeatDelay: 1
                        }}
                        className="flex-shrink-0 pr-8 inline-block"
                    >
                        {text}
                    </motion.span>
                    <motion.span
                        initial={{ x: 0 }}
                        animate={{ x: "-100%" }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: delay,
                            repeatDelay: 1
                        }}
                        className="flex-shrink-0 pr-8 inline-block"
                    >
                        {text}
                    </motion.span>
                </span>
            ) : (
                <span ref={textRef} className="truncate inline-block w-full">
                    {text}
                </span>
            )}
        </span>
    );
};
