import type { Track } from '../stores/usePlayerStore';
import { authService } from './authService';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
const DISCOVERY_RATIO = parseFloat(import.meta.env.VITE_DISCOVERY_RATIO || '0.75');

export const youtubeService = {
    search: async (query: string): Promise<Track[]> => {
        if (!YOUTUBE_API_KEY) {
            console.warn("YouTube API Key is missing. Using mock data.");
            return [];
        }

        try {
            const response = await fetch(
                `${YOUTUBE_API_URL}/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.statusText}`);
            }

            const data = await response.json();

            return data.items.map((item: any) => mapYouTubeItemToTrack(item));

        } catch (error) {
            console.error("YouTube Search failed:", error);
            return [];
        }
    },

    getLikedVideos: async (maxResults: number = 50): Promise<Track[]> => {
        if (!authService.isAuthenticated()) {
            console.warn("User not authenticated. Cannot fetch liked videos.");
            return [];
        }

        try {
            const response = await fetch(
                `${YOUTUBE_API_URL}/videos?part=snippet,contentDetails&myRating=like&maxResults=${maxResults}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authService.accessToken}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`YouTube API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.items.map((item: any) => mapYouTubeItemToTrack(item));
        } catch (error) {
            console.error("Failed to fetch liked videos:", error);
            return [];
        }
    },

    getRecommendations: async (seedTrackId: string, maxResults: number = 10): Promise<Track[]> => {
        if (!YOUTUBE_API_KEY) return [];

        try {
            const response = await fetch(
                `${YOUTUBE_API_URL}/search?part=snippet&relatedToVideoId=${seedTrackId}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
            );
            const data = await response.json();
            return data.items.map((item: any) => mapYouTubeItemToTrack(item));
        } catch (error) {
            console.error("Failed to fetch recommendations:", error);
            return [];
        }
    },

    generateSmartPlaylist: async (seedQuery: string): Promise<Track[]> => {
        // 1. Get "Known" songs (Liked videos)
        const knownTracks = await youtubeService.getLikedVideos(50);

        // 2. Get "Unknown" songs (Search results / Recommendations based on query)
        const searchResults = await youtubeService.search(seedQuery);

        // Filter out duplicates from search results that are already in known tracks
        const unknownTracks = searchResults.filter(t => !knownTracks.some(k => k.id === t.id));

        // 3. Mix them based on Ratio (Default 75% Known, 25% Unknown)
        const totalTracks = 20;
        const knownCount = Math.floor(totalTracks * DISCOVERY_RATIO);
        const unknownCount = totalTracks - knownCount;

        // Shuffle and slice
        const selectedKnown = shuffleArray(knownTracks).slice(0, knownCount);
        const selectedUnknown = shuffleArray(unknownTracks).slice(0, unknownCount);

        // Combine and shuffle again for the final playlist
        return shuffleArray([...selectedKnown, ...selectedUnknown]);
    },

    getVideoDetails: async (videoId: string): Promise<Partial<Track>> => {
        if (!YOUTUBE_API_KEY) return {};

        try {
            const response = await fetch(
                `${YOUTUBE_API_URL}/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
            );
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                const duration = parseDuration(item.contentDetails.duration);
                return {
                    duration,
                    vibe: item.snippet.tags ? item.snippet.tags.slice(0, 3).join(', ') : 'Unknown'
                };
            }
            return {};
        } catch (error) {
            console.error("Failed to get video details:", error);
            return {};
        }
    }
};

// Helper Functions
function mapYouTubeItemToTrack(item: any): Track {
    const snippet = item.snippet;
    const id = item.id.videoId || item.id; // 'id' for videos endpoint, 'id.videoId' for search
    return {
        id: id,
        title: snippet.title,
        artist: snippet.channelTitle,
        coverUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
        // Use YouTube nocookie embed URL for audio playback
        // This works with HTML5 video/audio elements and allows programmatic control
        audioUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1`,
        duration: 0, // Placeholder, needs detail fetch
        vibe: 'Unknown'
    };
}

function parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (parseInt(match[1] || '0')) * 3600;
    const minutes = (parseInt(match[2] || '0')) * 60;
    const seconds = parseInt(match[3] || '0');

    return hours + minutes + seconds;
}

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
