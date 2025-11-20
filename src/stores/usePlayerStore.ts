import { create } from 'zustand';

export interface Track {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl: string;
    duration: number;
    vibe?: string;
}

interface PlayerState {
    isPlaying: boolean;
    currentTrack: Track | null;
    volume: number;
    progress: number;

    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentTrack: (track: Track) => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;

    queue: Track[];
    addToQueue: (track: Track) => void;
    playTrack: (track: Track) => void;
    nextTrack: () => void;
    prevTrack: () => void;
}

import { transitionEngine } from '../services/transitionEngine';

export const usePlayerStore = create<PlayerState>((set, get) => ({
    isPlaying: false,
    currentTrack: null,
    volume: 0.8,
    progress: 0,
    queue: [],

    setIsPlaying: (isPlaying) => {
        set({ isPlaying });
    },

    setCurrentTrack: (track) => {
        set({ currentTrack: track, isPlaying: true, progress: 0 });
        if (track.audioUrl) {
            // If we are already playing, try to transition?
            // For now, direct play for explicit clicks, transition for auto-next
            transitionEngine.play(track.audioUrl);
        }
    },

    setVolume: (volume) => {
        transitionEngine.setVolume(volume);
        set({ volume });
    },

    setProgress: (progress) => set({ progress }),

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),

    playTrack: (track) => {
        get().setCurrentTrack(track);
    },

    nextTrack: () => {
        const { queue, currentTrack } = get();
        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        if (currentIndex < queue.length - 1) {
            get().setCurrentTrack(queue[currentIndex + 1]);
        }
    },

    prevTrack: () => {
        const { queue, currentTrack } = get();
        const currentIndex = queue.findIndex(t => t.id === currentTrack?.id);
        if (currentIndex > 0) {
            get().setCurrentTrack(queue[currentIndex - 1]);
        }
    }
}));
