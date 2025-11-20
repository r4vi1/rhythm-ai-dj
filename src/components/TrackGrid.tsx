import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { usePlaylistStore } from '../stores/usePlaylistStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export const TrackGrid: React.FC = () => {
    const { queue } = usePlaylistStore();
    const { currentTrack, isPlaying, setIsPlaying, setCurrentTrack } = usePlayerStore();

    // Mock data if queue empty
    const tracks = queue.length > 0 ? queue : [
        { id: '1', title: 'Midnight City', artist: 'M83', duration: 243, coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80', audioUrl: '', vibe: 'Synthwave' },
        { id: '2', title: 'Nightcall', artist: 'Kavinsky', duration: 258, coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', audioUrl: '', vibe: 'Retrowave' },
        { id: '3', title: 'Resonance', artist: 'Home', duration: 212, coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', audioUrl: '', vibe: 'Chillwave' },
        { id: '4', title: 'After Dark', artist: 'Mr. Kitty', duration: 230, coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', audioUrl: '', vibe: 'Darkwave' },
    ];

    return (
        <section className="py-24 relative z-10 px-4 md:px-8 max-w-[1920px] mx-auto">
            <div className="flex items-end justify-between mb-12 border-b border-white/5 pb-6">
                <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tighter text-white/90">
                    Curated Mix
                </h2>
                <span className="text-xs font-mono text-white/40 uppercase tracking-widest">Vol. 01</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tracks.map((track, i) => (
                    <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`
                            group relative aspect-square bg-white/[0.02] backdrop-blur-sm 
                            border border-white/5 hover:border-white/20 
                            rounded-none overflow-hidden cursor-pointer transition-all duration-700
                            ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}
                        `}
                        onClick={() => {
                            if (currentTrack?.id === track.id) {
                                setIsPlaying(!isPlaying);
                            } else {
                                setCurrentTrack(track);
                            }
                        }}
                    >
                        {/* Image */}
                        <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-50 group-hover:opacity-30 grayscale group-hover:grayscale-0"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />

                        {/* Content */}
                        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-mono border border-white/10 px-2 py-1 bg-black/40 backdrop-blur-md text-white/40 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                    0{i + 1}
                                </span>
                                {currentTrack?.id === track.id && (
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(bar => (
                                            <motion.div
                                                key={bar}
                                                animate={{ height: [4, 12, 4] }}
                                                transition={{ duration: 0.5, repeat: Infinity, delay: bar * 0.1 }}
                                                className="w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(225,29,72,0.8)]"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <h3 className={`font-display uppercase tracking-tighter leading-none mb-3 text-white mix-blend-overlay ${i === 0 ? 'text-5xl' : 'text-2xl'}`}>
                                    {track.title}
                                </h3>
                                <p className="text-primary/80 text-xs md:text-sm uppercase tracking-[0.2em] font-medium">{track.artist}</p>
                            </div>
                        </div>

                        {/* Play Button Reveal (Minimal) */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/5 transition-colors">
                                {currentTrack?.id === track.id && isPlaying ? (
                                    <Pause className="w-8 h-8 text-white fill-white" />
                                ) : (
                                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
