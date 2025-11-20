import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../stores/usePlayerStore';
import { spotifyPlayback } from '../services/spotifyPlayback';
import { MinimizedPlayer } from './MinimizedPlayer';
import { MaximizedPlayer } from './MaximizedPlayer';

export const Player: React.FC = () => {
    const { isPlaying, currentTrack, volume, isMaximized } = usePlayerStore();

    // Initialize Spotify Playback SDK
    useEffect(() => {
        spotifyPlayback.initialize().catch(console.error);
    }, []);

    // Play track
    useEffect(() => {
        if (currentTrack && currentTrack.audioUrl.startsWith('spotify:')) {
            spotifyPlayback.play(currentTrack.audioUrl).catch(console.error);
        }
    }, [currentTrack]);

    // Handle play/pause
    useEffect(() => {
        if (!currentTrack) return;

        if (isPlaying) {
            spotifyPlayback.resume().catch(console.error);
        } else {
            spotifyPlayback.pause().catch(console.error);
        }
    }, [isPlaying, currentTrack]);

    // Handle volume
    useEffect(() => {
        spotifyPlayback.setVolume(volume).catch(console.error);
    }, [volume]);

    if (!currentTrack) return null;

    return (
        <AnimatePresence mode="wait">
            {isMaximized ? (
                <MaximizedPlayer key="maximized" />
            ) : (
                <MinimizedPlayer key="minimized" />
            )}
        </AnimatePresence>
    );
};
