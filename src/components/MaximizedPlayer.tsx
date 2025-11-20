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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl pointer-events-auto"
        >
            {/* Container with proper constraints */}
            <div className="h-full w-full flex items-center justify-center p-12 pointer-events-none">
                <div className="w-full max-w-6xl h-full max-h-[800px] flex flex-col pointer-events-auto">

                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="font-display text-xs uppercase tracking-[0.3em] text-white/40">Now Playing</h2>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleMaximized();
                            }}
                            className="w-16 h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors shrink-0"
                            type="button"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Main Content - Horizontal Split */}
                    <div className="flex-1 grid grid-cols-2 gap-16">

                        {/* LEFT COLUMN - Album Art & AI Insights */}
                        <div className="flex flex-col justify-center gap-8">
                            {/* Album Art */}
                            <div className="relative w-full aspect-square group">
                                <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl opacity-50" />
                                <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl">
                                    <img
                                        src={currentTrack.coverUrl}
                                        alt={currentTrack.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* AI Insights */}
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <h3 className="font-display text-xs uppercase tracking-[0.2em] text-white/60">AI Insight</h3>
                                </div>
                                <p className="text-sm text-white/80 leading-relaxed">
                                    {aiInsight}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Track Info & Controls */}
                        <div className="flex flex-col justify-center gap-10">

                            {/* Track Title & Artist */}
                            <div>
                                <h1 className="font-display text-5xl uppercase tracking-tighter text-white mb-3 leading-none line-clamp-2">
                                    {currentTrack.title}
                                </h1>
                                <p className="font-body text-lg text-white/60 uppercase tracking-wider">
                                    {currentTrack.artist}
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-secondary"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-mono text-white/40">
                                    <span>{formatTime(progress)}</span>
                                    <span>{formatTime(currentTrack.duration || 0)}</span>
                                </div>
                            </div>

                            {/* Playback Controls */}
                            <div className="flex items-center justify-center gap-5">
                                <button
                                    onClick={handleShuffle}
                                    className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${shuffle ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40 hover:text-white'
                                        }`}
                                >
                                    <Shuffle className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={prevTrack}
                                    className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                >
                                    <SkipBack className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={handlePlayPause}
                                    className="w-16 h-16 bg-primary hover:bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-105"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-8 h-8 fill-current" />
                                    ) : (
                                        <Play className="w-8 h-8 fill-current ml-1" />
                                    )}
                                </button>

                                <button
                                    onClick={nextTrack}
                                    className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                >
                                    <SkipForward className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={() => setShowQueue(!showQueue)}
                                    className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${showQueue ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40 hover:text-white'
                                        }`}
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Volume Control */}
                            <div className="flex items-center gap-4">
                                <Volume2 className="w-5 h-5 text-white/60 flex-shrink-0" />
                                <div className="flex-1 relative">
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-secondary"
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
                                <span className="text-xs font-mono text-white/40 w-10 text-right flex-shrink-0">
                                    {Math.round(volume * 100)}%
                                </span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Queue Panel - Overlays on right side */}
                <AnimatePresence>
                    {showQueue && (
                        <div className="absolute top-0 right-0 h-full">
                            <QueuePanel onClose={() => setShowQueue(false)} />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
