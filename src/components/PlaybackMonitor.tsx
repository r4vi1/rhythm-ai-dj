import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { transitionEngine } from '../services/transitionEngine';
import { audioAnalyzer } from '../services/audioAnalyzer';

export const PlaybackMonitor: React.FC = () => {
    const { isPlaying, currentTrack, nextTrack, progress, duration } = usePlayerStore();
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
        if (!isPlaying || !currentTrack || !nextTrack || hasTriggeredTransition.current) return;

        const checkAutoTransition = async () => {
            // Default transition window (10s before end)
            let transitionWindow = 10;

            // If we have analysis, use the outro duration
            const analysis = await audioAnalyzer.analyzeTrack(currentTrack);
            if (analysis && analysis.structure.outro) {
                // Start transition halfway through the outro, or at least 8s before end
                transitionWindow = Math.max(8, analysis.structure.outro / 2);
            }

            const remaining = duration - progress;

            if (remaining > 0 && remaining <= transitionWindow) {
                console.log(`🤖 Auto-Triggering Transition: ${remaining.toFixed(1)}s remaining`);
                hasTriggeredTransition.current = true;
                transitionEngine.intelligentTransition(currentTrack, nextTrack);
            }
        };

        // Check every 1s (sufficient for 10s window)
        // For tighter loops, we'd use requestAnimationFrame, but 1s is fine for triggering a 10s transition
        const interval = setInterval(checkAutoTransition, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, currentTrack, nextTrack, progress, duration]);

    return null; // Headless component
};
