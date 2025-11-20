import React from 'react';
import { Play, Pause, SkipForward, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../stores/usePlayerStore';
import { youtubePlayer } from '../services/youtubePlayer';
import { audioEngine } from '../services/audioEngine';

export const MinimizedPlayer: React.FC = () => {
    const { isPlaying, currentTrack, progress, setIsPlaying, nextTrack, toggleMaximized } = usePlayerStore();

    if (!currentTrack) return null;

    const handlePlayPause = () => {
        if (currentTrack.audioUrl.includes('youtube')) {
            if (isPlaying) youtubePlayer.pause();
            else youtubePlayer.resume();
        } else {
            if (isPlaying) audioEngine.pause();
            else audioEngine.resume();
        }
        setIsPlaying(!isPlaying);
    };

    const progressPercent = (progress / (currentTrack.duration || 1)) * 100;

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-6 right-6 z-50"
        >
            <div className="max-w-3xl mx-auto bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {/* Progress Bar - Top (Integrated) */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
                    <div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(225,29,72,0.8)] transition-all duration-300 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Minimal Player Bar */}
                <div className="flex items-center justify-between px-6 py-4 gap-6">
                    {/* Album Art + Info */}
                    <button
                        onClick={toggleMaximized}
                        className="flex items-center gap-4 flex-1 min-w-0 group cursor-pointer text-left"
                    >
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                            <img
                                src={currentTrack.coverUrl}
                                alt={currentTrack.title}
                                className="w-full h-full object-cover animate-spin-slow"
                                style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-display text-sm uppercase tracking-wider text-white truncate group-hover:text-primary transition-colors">
                                {currentTrack.title}
                            </h4>
                            <p className="text-xs text-white/40 uppercase tracking-widest truncate">
                                {currentTrack.artist}
                            </p>
                        </div>
                    </button>

                    {/* Controls */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full transition-all hover:scale-105 hover:bg-primary hover:text-white shadow-lg"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 fill-current" />
                            ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={nextTrack}
                            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-all hover:scale-110"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
