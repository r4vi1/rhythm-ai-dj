import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { transitionEngine } from '../services/transitionEngine';
import { audioAnalyzer } from '../services/audioAnalyzer';

export const PlaybackMonitor: React.FC = () => {
    const { isPlaying, currentTrack, queue, progress } = usePlayerStore();
    const hasTriggeredTransition = useRef(false);
    const lastTrackId = useRef<string | null>(null);

    useEffect(() => {
        // Reset trigger when track changes
        if (currentTrack?.id !== lastTrackId.current) {
            hasTriggeredTransition.current = false;
            lastTrackId.current = currentTrack?.id || null;
        }
    }, [currentTrack]);

    useEffect(() => {
        if (!isPlaying || !currentTrack || hasTriggeredTransition.current) return;

        const checkAutoTransition = async () => {
            // Compute next track from queue
            const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
            const nextTrack = queue[currentIndex + 1];

            if (!nextTrack) return; // No next track

            // Default transition window (10s before end)
            let transitionWindow = 10;

            // If we have analysis, use the outro duration
            const analysis = await audioAnalyzer.analyzeTrack(currentTrack);
            if (analysis && analysis.structure.outro) {
                // Start transition halfway through the outro, or at least 8s before end
                transitionWindow = Math.max(8, analysis.structure.outro / 2);
            }

            // Estimate duration from progress if needed (tracks usually 3-4 mins)
            // For more accuracy, would need Spotify SDK duration info
            const estimatedDuration = 200; // Fallback: 3:20
            const remaining = estimatedDuration - progress;

            if (remaining > 0 && remaining <= transitionWindow) {
                console.log(`🤖 Auto-Triggering Transition: ${remaining.toFixed(1)}s remaining`);
                hasTriggeredTransition.current = true;
                transitionEngine.executeTransition(nextTrack);
            }
        };

        // Check every 1s (sufficient for 10s window)
        const interval = setInterval(checkAutoTransition, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, currentTrack, queue, progress]);

    return null; // Headless component
};
