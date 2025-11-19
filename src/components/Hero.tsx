import React from 'react';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {

    return (
        <section className="relative min-h-[35vh] flex flex-col justify-center overflow-hidden">
            {/* Massive Text */}
            <div className="relative z-10 mix-blend-difference px-4 md:px-12">
                <div className="flex flex-col items-center text-center w-full">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        <span className="text-xs font-body text-white/60 tracking-[0.2em] uppercase">Sonic Intelligence</span>
                        <div className="w-1 h-1 bg-primary rounded-full" />
                    </motion.div>

                    <motion.h1
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative font-display text-[15vw] md:text-[20vw] leading-[0.8] font-bold uppercase tracking-tighter"
                    >
                        {/* Hollow/Stroke Layer */}
                        <span className="absolute inset-0 text-transparent text-stroke-2 text-stroke-white/20 select-none blur-sm opacity-50">
                            RHYTHM
                        </span>

                        {/* Main Text with Gradient Mask */}
                        <span className="relative block text-white mix-blend-overlay opacity-90">
                            RHYTHM
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 1 }}
                        className="mt-8 max-w-md text-lg text-white/40 font-body font-light leading-relaxed"
                    >
                        Curated auditory experiences for deep work and flow states.
                    </motion.p>
                </div>
            </div>

            {/* Subtext & CTA - Removed for cleaner look, or keep minimal */}
        </section>
    );
};
