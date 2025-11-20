import React, { useState } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockApi } from '../services/mockApi';
import { usePlayerStore } from '../stores/usePlayerStore';

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { setCurrentTrack, addToQueue } = usePlayerStore();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        console.log("🔍 Starting search for:", query);

        try {
            // 1. Get Curation from Gemini
            console.log("📡 Asking Gemini for curation...");
            const curatedSongs = await import('../services/geminiService').then(m => m.geminiService.curatePlaylist(query));
            console.log("✅ Gemini returned:", curatedSongs);

            if (curatedSongs.length === 0) {
                console.warn("⚠️ Gemini returned empty, falling back to direct search");
                // Fallback to direct Spotify search
                const { spotifyService } = await import('../services/spotifyService');
                const results = await spotifyService.search(query);
                if (results.length > 0) {
                    setCurrentTrack(results[0]);
                    results.slice(1).forEach(track => addToQueue(track));
                }
                setIsLoading(false);
                return;
            }

            // 2. Search Spotify for each curated song
            console.log("🎵 Searching Spotify for curated songs...");
            const { spotifyService } = await import('../services/spotifyService');

            let firstTrackFound = false;

            for (const song of curatedSongs) {
                const searchQuery = `${song.title} ${song.artist}`;
                console.log(`  🔎 Searching Spotify for: ${searchQuery}`);

                const searchResults = await spotifyService.search(searchQuery);
                console.log(`  📊 Found ${searchResults.length} results`);

                if (searchResults.length > 0) {
                    const track = searchResults[0];
                    // Add metadata from Gemini
                    track.vibe = song.reason;

                    console.log(`  ✓ Track: ${track.title} by ${track.artist}`);

                    if (!firstTrackFound) {
                        console.log("  ▶️ Playing first track");
                        setCurrentTrack(track);
                        firstTrackFound = true;
                    } else {
                        console.log("  ➕ Adding to queue");
                        addToQueue(track);
                    }
                }
            }

            if (!firstTrackFound) {
                console.error("❌ No tracks found on YouTube");
                alert("No tracks found. Please try a different search.");
            } else {
                console.log("✅ Playlist generated successfully!");
            }

        } catch (error) {
            console.error("❌ Search failed:", error);
            alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mb-32 relative z-30 px-4">
            <motion.form
                onSubmit={handleSearch}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`relative group transition-all duration-500`}
            >
                {/* Neon Glow Border */}
                <div className={`absolute -inset-[2px] bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl opacity-0 transition-opacity duration-500 ${isFocused ? 'opacity-100 blur-md' : 'group-hover:opacity-50 blur-sm'}`} />

                {/* Subtle Glow Behind */}
                <div className={`absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-[40px] rounded-2xl transition-opacity duration-700 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />

                {/* Main Container */}
                <div className={`
                    relative flex items-center bg-[#0a0303] 
                    border border-white/10 transition-all duration-300 rounded-2xl overflow-hidden
                    ${isFocused ? 'shadow-[0_0_50px_-12px_rgba(225,29,72,0.5)]' : 'shadow-2xl'}
                `}>

                    {/* Icon Area */}
                    <div className="pl-6 pr-4 py-6">
                        <Search className={`w-6 h-6 ${isFocused ? 'text-primary drop-shadow-[0_0_10px_rgba(225,29,72,0.8)]' : 'text-white/40'} transition-all duration-300`} />
                    </div>

                    {/* Input */}
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Ask the archive..."
                        className="w-full bg-transparent border-none outline-none text-xl md:text-2xl font-body font-light text-white placeholder-white/20 px-2 py-6 leading-none tracking-wide"
                    />

                    {/* Action Area */}
                    <div className="pr-4 pl-4 py-4 flex items-center gap-3">
                        <AnimatePresence>
                            {query && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    type="submit"
                                    disabled={isLoading}
                                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5" />
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {!query && (
                            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-white/20 border border-white/5 px-3 py-1.5 rounded-lg">
                                <span className="text-[10px]">⌘</span> K
                            </div>
                        )}
                    </div>
                </div>
            </motion.form>

            {/* Quick Prompts (Subtle Pills) */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['Ambient Flow', 'Deep Focus', 'Night Drive', 'Cinematic'].map((tag, i) => (
                    <motion.button
                        key={tag}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                        onClick={() => setQuery(tag)}
                        className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-full transition-all duration-300"
                    >
                        <Sparkles className="w-3 h-3 text-primary/50 group-hover:text-primary transition-colors" />
                        <span className="text-sm font-body text-white/60 group-hover:text-white transition-colors">
                            {tag}
                        </span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
