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
            <div className="max-w-screen-xl mx-auto bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                {/* Progress Bar - Top */}
                <div className="h-1 bg-white/5 relative">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Minimal Player Bar */}
                <div className="flex items-center gap-5 p-4">
                    {/* Album Art + Info */}
                    <button
                        onClick={toggleMaximized}
                        className="flex items-center gap-4 flex-1 min-w-0 group cursor-pointer"
                    >
                        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                            <img
                                src={currentTrack.coverUrl}
                                alt={currentTrack.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-display text-base uppercase tracking-tight text-white truncate group-hover:text-primary transition-colors">
                                {currentTrack.title}
                            </h4>
                            <p className="text-sm text-white/60 uppercase tracking-wider truncate">
                                {currentTrack.artist}
                            </p>
                        </div>
                    </button>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={handlePlayPause}
                            className="w-12 h-12 flex items-center justify-center bg-primary hover:bg-white text-black rounded-full transition-all hover:scale-105 shadow-lg shadow-primary/30"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={nextTrack}
                            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110 bg-white/5 hover:bg-white/10 rounded-full"
                        >
                            <SkipForward className="w-4 h-4" />
                        </button>

                        <button
                            onClick={toggleMaximized}
                            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-primary transition-all hover:scale-110 bg-white/5 hover:bg-white/10 rounded-full ml-2"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
