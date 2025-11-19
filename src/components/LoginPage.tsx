import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { MagneticButton } from './MagneticButton';
import { InteractiveBackground } from './InteractiveBackground';

export const LoginPage: React.FC = () => {
    const [isHoveringButton, setIsHoveringButton] = useState(false);

    const handleLogin = () => {
        authService.login();
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] overflow-hidden">

            {/* Deep Crimson Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background z-0" />

            {/* Interactive Particles */}
            <InteractiveBackground isHovering={isHoveringButton} />

            {/* Vignette Overlay for Focus */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none z-0" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">

                {/* Animated Logo/Title */}
                <motion.div
                    initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-24 relative"
                >
                    <h1 className="font-display text-[12vw] md:text-[10vw] leading-none font-bold tracking-tighter text-white mix-blend-overlay select-none">
                        RHYTHM
                    </h1>
                    {/* Kinetic Underline - Glows on Button Hover */}
                    <motion.div
                        initial={{ scaleX: 0, opacity: 0.5 }}
                        animate={{
                            scaleX: 1,
                            opacity: isHoveringButton ? 1 : 0.3,
                            boxShadow: isHoveringButton ? "0 0 30px 2px rgba(225, 29, 72, 0.8)" : "0 0 0px 0px rgba(225, 29, 72, 0)"
                        }}
                        transition={{
                            scaleX: { delay: 0.2, duration: 1.0, ease: "circOut" },
                            opacity: { duration: 0.3 },
                            boxShadow: { duration: 0.3 }
                        }}
                        className="absolute -bottom-2 left-0 right-0 h-[2px] bg-primary rounded-full"
                    />
                </motion.div>

                {/* Login Button */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    onMouseEnter={() => setIsHoveringButton(true)}
                    onMouseLeave={() => setIsHoveringButton(false)}
                >
                    <MagneticButton className="group relative px-8 py-3 bg-transparent hover:bg-white/5 border border-white/10 rounded-full transition-all duration-500 hover:border-white/30 backdrop-blur-sm">
                        <button
                            onClick={handleLogin}
                            className="flex items-center gap-3 text-white"
                        >
                            <span className="font-medium tracking-widest text-sm uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                                Connect with Google
                            </span>
                            <div className="relative w-4 h-4 overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center"
                                    animate={{ x: isHoveringButton ? "100%" : "0%" }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </motion.div>
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center -translate-x-full"
                                    animate={{ x: isHoveringButton ? "0%" : "-100%" }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <ArrowRight className="w-4 h-4 text-primary" />
                                </motion.div>
                            </div>
                        </button>
                    </MagneticButton>
                </motion.div>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-12 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] text-white/20 uppercase tracking-[0.3em]">
                    System Ready
                </span>
            </motion.div>
        </div>
    );
};
