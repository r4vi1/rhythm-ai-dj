import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, X, Volume2, List } from 'lucide-react';
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8"
        >
            {/* Close Button - Fixed top-right */}
            <button
                onClick={toggleMaximized}
                className="fixed top-8 right-8 z-[110] w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                type="button"
            >
                <X className="w-6 h-6 text-white" />
            </button>

            {/* Main Content */}
            <div className="w-full max-w-5xl flex flex-col gap-8">

                {/* Album Art & Track Info */}
                <div className="flex gap-8 items-center">
                    {/* Album Cover */}
                    <div className="w-64 h-64 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl">
                        <img
                            src={currentTrack.coverUrl}
                            alt={currentTrack.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Track Details */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Now Playing</p>
                        <h1 className="font-display text-4xl uppercase tracking-tight text-white mb-2 truncate">
                            {currentTrack.title}
                        </h1>
                        <p className="text-lg text-white/60 uppercase tracking-wide truncate">
                            {currentTrack.artist}
                        </p>

                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs font-mono text-white/40">
                                <span>{formatTime(progress)}</span>
                                <span>{formatTime(currentTrack.duration || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={handleShuffle}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${shuffle ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40 hover:text-white'
                            }`}
                    >
                        <Shuffle className="w-4 h-4" />
                    </button>

                    <button
                        onClick={prevTrack}
                        className="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handlePlayPause}
                        className="w-14 h-14 bg-primary hover:bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-105"
                    >
                        {isPlaying ? (
                            <Pause className="w-7 h-7 fill-current" />
                        ) : (
                            <Play className="w-7 h-7 fill-current ml-0.5" />
                        )}
                    </button>

                    <button
                        onClick={nextTrack}
                        className="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setShowQueue(!showQueue)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${showQueue ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40 hover:text-white'
                            }`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-4 max-w-sm mx-auto">
                    <Volume2 className="w-4 h-4 text-white/60" />
                    <div className="flex-1 relative">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                                style={{ width: `${volume * 100}%` }}
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
                    <span className="text-xs font-mono text-white/40 w-10 text-right">
                        {Math.round(volume * 100)}%
                    </span>
                </div>

                {/* AI Insight */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-xs uppercase tracking-wider text-white/60">AI Insight</h3>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                        {aiInsight}
                    </p>
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
                        className="fixed top-0 right-0 h-full w-96 bg-black/95 backdrop-blur-2xl border-l border-white/10 z-[105]"
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
