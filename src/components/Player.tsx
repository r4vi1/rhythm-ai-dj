import React, { useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { audioEngine } from '../services/audioEngine';
import { MagneticButton } from './MagneticButton';

export const Player: React.FC = () => {
    const { isPlaying, currentTrack, volume, setIsPlaying } = usePlayerStore();

    useEffect(() => {
        if (currentTrack) audioEngine.playTrack(currentTrack.audioUrl);
    }, [currentTrack]);

    useEffect(() => {
        if (isPlaying) audioEngine.resume();
        else audioEngine.pause();
    }, [isPlaying]);

    useEffect(() => {
        audioEngine.setVolume(volume);
    }, [volume]);

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-8 left-8 right-8 z-50">
            <div className="bg-black/90 backdrop-blur-md border border-white/10 p-6 flex items-center justify-between max-w-screen-2xl mx-auto">
                {/* Track Info */}
                <div className="flex items-center gap-6 w-1/3">
                    <div className="w-16 h-16 bg-surface border border-white/10 overflow-hidden">
                        <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover grayscale" />
                    </div>
                    <div>
                        <h3 className="font-display text-2xl uppercase tracking-tight leading-none">{currentTrack.title}</h3>
                        <p className="text-gray-500 text-sm uppercase tracking-widest mt-1">{currentTrack.artist}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-8">
                    <MagneticButton onClick={() => { }} className="text-gray-500 hover:text-white transition-colors">
                        <SkipBack className="w-8 h-8" />
                    </MagneticButton>

                    <MagneticButton
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-20 h-20 bg-primary text-black flex items-center justify-center hover:bg-white transition-colors"
                    >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </MagneticButton>

                    <MagneticButton onClick={() => { }} className="text-gray-500 hover:text-white transition-colors">
                        <SkipForward className="w-8 h-8" />
                    </MagneticButton>
                </div>

                {/* Volume/Extra */}
                <div className="flex items-center justify-end gap-6 w-1/3">
                    <div className="flex items-center gap-3 group">
                        <Volume2 className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                        <div className="w-32 h-1 bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-primary origin-left transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                                style={{ width: `${volume * 100}%` }}
                            />
                            <div className="h-full bg-white w-full" style={{ width: `${volume * 100}%` }} />
                        </div>
                    </div>
                    <span className="text-xs font-mono text-gray-500">02:43 / 04:20</span>
                </div>
            </div>
        </div>
    );
};
