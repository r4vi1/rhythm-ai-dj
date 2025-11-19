import { create } from 'zustand';
import type { Track } from './usePlayerStore';

interface PlaylistState {
    queue: Track[];
    history: Track[];
    mixRatio: number; // 0-100, percentage of new discoveries

    addToQueue: (track: Track) => void;
    removeFromQueue: (trackId: string) => void;
    addToHistory: (track: Track) => void;
    setMixRatio: (ratio: number) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
    queue: [],
    history: [],
    mixRatio: 30, // Default 30% discovery

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
    removeFromQueue: (id) => set((state) => ({ queue: state.queue.filter(t => t.id !== id) })),
    addToHistory: (track) => set((state) => ({ history: [track, ...state.history].slice(0, 50) })),
    setMixRatio: (ratio) => set({ mixRatio: ratio }),
}));
