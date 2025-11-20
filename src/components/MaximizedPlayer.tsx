import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, X, Volume2, List } from 'lucide-react';
import { useDominantColor } from '../hooks/useDominantColor';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../stores/usePlayerStore';
import { youtubePlayer } from '../services/youtubePlayer';
import { audioEngine } from '../services/audioEngine';
import { geminiService } from '../services/geminiService';
import { QueuePanel } from './QueuePanel';

export const MaximizedPlayer: React.FC = () => {
    const {
        isPlaying,
        currentTrack,
        volume,
        progress,
        shuffle,
        setIsPlaying,
        setVolume,
        nextTrack,
        prevTrack,
        toggleShuffle,
        toggleMaximized,
        shuffleQueue
    } = usePlayerStore();

    const [showQueue, setShowQueue] = useState(false);
    const [aiInsight, setAiInsight] = useState('Generating insight...');

    // Dynamic Color Extraction
    const dominantColor = useDominantColor(currentTrack?.coverUrl);

    useEffect(() => {
        if (currentTrack) {
            setAiInsight('Analyzing track...');
            geminiService.generateTrackInsights(currentTrack).then(insight => {
                setAiInsight(insight);
            });
        }
    }, [currentTrack]);

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

    const handleShuffle = () => {
        toggleShuffle();
        if (!shuffle) shuffleQueue();
    };

    const progressPercent = (progress / (currentTrack.duration || 1)) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] bg-[#050505]/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 overflow-hidden"
        >
            {/* Dynamic Ambient Glow */}
            <div
                className="absolute inset-0 opacity-30 transition-colors duration-1000 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${dominantColor} 0%, transparent 70%)` }}
            />

            {/* Close Button - Fixed top-right, High Z-Index */}
            <button
                onClick={toggleMaximized}
                className="absolute top-6 right-6 md:top-8 md:right-8 z-[10000] w-14 h-14 flex items-center justify-center bg-black/20 hover:bg-white/10 rounded-full transition-all border border-white/10 hover:border-white/30 cursor-pointer backdrop-blur-md group"
                type="button"
            >
                <X className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
            </button>

            {/* Main Content */}
            <div className="w-full max-w-6xl flex flex-col gap-8 md:gap-16 relative z-10 max-h-full overflow-y-auto md:overflow-visible no-scrollbar px-4">

                {/* Album Art & Track Info */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-center">
                    {/* Album Cover */}
                    <div className="w-72 h-72 md:w-[500px] md:h-[500px] rounded-3xl overflow-hidden flex-shrink-0 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 relative group">
                        <img
                            src={currentTrack.coverUrl}
                            alt={currentTrack.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Subtle reflection/shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Track Details */}
                    <div className="flex-1 min-w-0 text-center md:text-left w-full">
                        <p className="text-xs uppercase tracking-[0.3em] mb-4 font-medium transition-colors duration-500" style={{ color: dominantColor }}>Now Playing</p>
                        <h1 className="font-display text-4xl md:text-7xl uppercase tracking-tighter text-white mb-4 truncate leading-none">
                            {currentTrack.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/50 uppercase tracking-widest truncate font-light">
                            {currentTrack.artist}
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-8 md:mt-12">
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-4 cursor-pointer group">
                                <div
                                    className="h-full shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all ease-linear group-hover:h-full"
                                    style={{ width: `${progressPercent}%`, backgroundColor: dominantColor }}
                                />
                            </div>
                            <div className="flex justify-between text-xs font-mono text-white/30 tracking-widest">
                                <span>{formatTime(progress)}</span>
                                <span>{formatTime(currentTrack.duration || 0)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-8 md:mt-12 flex items-center justify-center md:justify-start gap-6 md:gap-8">
                            <button
                                onClick={handleShuffle}
                                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${shuffle ? 'text-white' : 'text-white/20 hover:text-white'}`}
                                style={{ color: shuffle ? dominantColor : undefined }}
                            >
                                <Shuffle className="w-5 h-5" />
                            </button>

                            <button
                                onClick={prevTrack}
                                className="w-14 h-14 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110"
                            >
                                <SkipBack className="w-8 h-8" />
                            </button>

                            <button
                                onClick={handlePlayPause}
                                className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg text-white"
                                style={{
                                    backgroundColor: dominantColor,
                                    boxShadow: `0 0 30px -5px ${dominantColor}60`
                                }}
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 fill-current" />
                                ) : (
                                    <Play className="w-8 h-8 fill-current ml-1" />
                                )}
                            </button>

                            <button
                                onClick={nextTrack}
                                className="w-14 h-14 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110"
                            >
                                <SkipForward className="w-8 h-8" />
                            </button>

                            <button
                                onClick={() => setShowQueue(!showQueue)}
                                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${showQueue ? 'text-white' : 'text-white/20 hover:text-white'}`}
                                style={{ color: showQueue ? dominantColor : undefined }}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Volume Control & AI Insight */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-white/5">
                    {/* Volume */}
                    <div className="flex items-center gap-4 w-full max-w-xs">
                        <Volume2 className="w-4 h-4 text-white/40" />
                        <div className="flex-1 relative group">
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-colors"
                                    style={{ width: `${volume * 100}%`, backgroundColor: dominantColor }}
                                />
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume * 100}
                                onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* AI Insight */}
                    <div className="flex items-center gap-4 text-right w-full md:w-auto justify-center md:justify-end">
                        <div className="block">
                            <div className="flex items-center justify-center md:justify-end gap-2 mb-1">
                                <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: dominantColor }} />
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40">AI Insight</h3>
                            </div>
                            <p className="text-sm text-white/60 max-w-md line-clamp-2 md:line-clamp-1 text-center md:text-right">
                                {aiInsight}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Queue Panel - Slide from right */}
            <AnimatePresence>
                {showQueue && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-[#0a0a0a] border-l border-white/10 z-[10001] shadow-2xl"
                    >
                        <QueuePanel onClose={() => setShowQueue(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
