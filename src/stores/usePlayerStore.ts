import { create } from 'zustand';

export interface Track {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
    duration: number;
    vibe?: string;
    bpm?: number;
}

interface PlayerState {
    isPlaying: boolean;
    currentTrack: Track | null;
    volume: number;
    progress: number;
    shuffle: boolean;
    isMaximized: boolean;

    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTrack: (track: Track) => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    toggleShuffle: () => void;
    toggleMaximized: () => void;

    queue: Track[];
    addToQueue: (track: Track) => void;
    playTrack: (track: Track) => void;
    nextTrack: () => void;
    prevTrack: () => void;
    shuffleQueue: () => void;
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;
}

import { transitionEngine } from '../services/transitionEngine';

export const usePlayerStore = create<PlayerState>((set, get) => ({
    isPlaying: false,
    currentTrack: null,
    volume: 0.8,
    progress: 0,
    shuffle: false,
    isMaximized: false,
    queue: [],

    setIsPlaying: (isPlaying) => {
        set({ isPlaying });
    },

    setCurrentTrack: (track) => {
        set({ currentTrack: track, isPlaying: true, progress: 0 });
        if (track.audioUrl) {
            // If we are already playing, try to transition?
            // For now, direct play for explicit clicks, transition for auto-next
            transitionEngine.play(track);
        }

        // Pre-analyze the next track in the queue
        const { queue } = get();
        const currentIndex = queue.findIndex(t => t.id === track.id);
        if (currentIndex !== -1 && currentIndex < queue.length - 1) {
            const nextTrack = queue[currentIndex + 1];
            import('../services/audioAnalyzer').then(({ audioAnalyzer }) => {
                audioAnalyzer.analyzeTrack(nextTrack).catch(console.error);
            });
        }
    },

    setVolume: (volume) => {
        transitionEngine.setVolume(volume);
        set({ volume });
    },

    setProgress: (progress) => set({ progress }),

    toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

    toggleMaximized: () => set((state) => ({ isMaximized: !state.isMaximized })),

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),

    playTrack: (track) => {
        get().setCurrentTrack(track);
    },

    nextTrack: () => {
        const { queue, currentTrack } = get();
        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        if (currentIndex < queue.length - 1) {
            const nextTrack = queue[currentIndex + 1];
            if (currentTrack) {
                // Trigger intelligent transition
                transitionEngine.intelligentTransition(currentTrack, nextTrack);
            } else {
                get().setCurrentTrack(nextTrack);
            }
        }
    },

    prevTrack: () => {
        const { queue, currentTrack } = get();
        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        if (currentIndex > 0) {
            get().setCurrentTrack(queue[currentIndex - 1]);
        }
    },

    shuffleQueue: () => {
        set((state) => {
            const shuffled = [...state.queue];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return { queue: shuffled };
        });
    },

    reorderQueue: (fromIndex, toIndex) => {
        set((state) => {
            const newQueue = [...state.queue];
            const [removed] = newQueue.splice(fromIndex, 1);
            newQueue.splice(toIndex, 0, removed);
            return { queue: newQueue };
        });
    },

    removeFromQueue: (index) => {
        set((state) => ({
            queue: state.queue.filter((_, i) => i !== index)
        }));
    },

    clearQueue: () => set({ queue: [] })
}));
