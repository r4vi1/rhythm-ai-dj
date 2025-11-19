import React from 'react';
import { Play, Clock } from 'lucide-react';
import { usePlaylistStore } from '../stores/usePlaylistStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export const PlaylistView: React.FC = () => {
    const { queue } = usePlaylistStore();
    const { currentTrack, setCurrentTrack } = usePlayerStore();

    // Mock data for display if queue is empty
    const displayTracks = queue.length > 0 ? queue : [
        { id: '1', title: 'Midnight City', artist: 'M83', duration: 243, coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80', audioUrl: '', vibe: 'Synthwave' },
        { id: '2', title: 'Nightcall', artist: 'Kavinsky', duration: 258, coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', audioUrl: '', vibe: 'Retrowave' },
        { id: '3', title: 'Resonance', artist: 'Home', duration: 212, coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', audioUrl: '', vibe: 'Chillwave' },
    ];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-primary rounded-full" />
                Up Next
            </h2>

            <div className="space-y-2">
                {displayTracks.map((track, index) => (
                    <div
                        key={track.id}
                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                        onClick={() => setCurrentTrack(track)}
                    >
                        <div className="w-8 text-center text-gray-500 group-hover:hidden">{index + 1}</div>
                        <div className="w-8 hidden group-hover:flex justify-center">
                            <Play className="w-4 h-4 text-white fill-current" />
                        </div>

                        <div className="w-12 h-12 rounded-lg overflow-hidden">
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1">
                            <h4 className={`font-medium ${currentTrack?.id === track.id ? 'text-primary' : 'text-white'}`}>{track.title}</h4>
                            <p className="text-sm text-gray-400">{track.artist}</p>
                        </div>

                        <div className="hidden md:block px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/5">
                            {track.vibe}
                        </div>

                        <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(track.duration)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
