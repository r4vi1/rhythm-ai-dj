import React from 'react';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {

    return (
        <section className="relative min-h-[35vh] flex flex-col justify-center overflow-hidden">
            {/* Massive Text */}
            <div className="relative z-10 px-4 md:px-12">
                <div className="flex flex-col items-center text-center w-full">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                        <span className="text-xs font-body text-white/60 tracking-[0.3em] uppercase">Sonic Intelligence</span>
                        <div className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
                    </motion.div>

                    <motion.div
                        initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                    >
                        <h1 className="font-display text-[15vw] md:text-[18vw] leading-[0.8] font-bold tracking-tighter text-white mix-blend-overlay select-none">
                            RHYTHM
                        </h1>

                        {/* Kinetic Underline */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0.5 }}
                            animate={{
                                scaleX: 1,
                                opacity: [0.8, 1, 0.8],
                                boxShadow: [
                                    "0 0 20px 2px rgba(225,29,72,0.4)",
                                    "0 0 30px 4px rgba(225,29,72,0.6)",
                                    "0 0 20px 2px rgba(225,29,72,0.4)"
                                ]
                            }}
                            transition={{
                                scaleX: { delay: 0.5, duration: 1.0, ease: "circOut" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-primary rounded-full"
                        />
                    </motion.div>



                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="mt-12 max-w-md text-lg text-white/60 font-body font-light leading-relaxed tracking-wide"
                    >
                        Curated auditory experiences for deep work and flow states.
                    </motion.p>
                </div>
            </div>

            {/* Subtext & CTA - Removed for cleaner look, or keep minimal */}
        </section>
    );
};
