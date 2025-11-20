import { spotifyAuthService } from './authService';
import type { Track } from '../stores/usePlayerStore';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        images: { url: string; height: number }[];
    };
    duration_ms: number;
    uri: string;
}

interface SpotifySearchResponse {
    tracks: {
        items: SpotifyTrack[];
    };
}

async function fetchSpotify(endpoint: string, options: RequestInit = {}) {
    const token = spotifyAuthService.getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await spotifyAuthService.refreshAccessToken();
        if (refreshed) {
            // Retry request
            return fetchSpotify(endpoint, options);
        } else {
            throw new Error('Authentication failed');
        }
    }

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
}

function mapSpotifyTrackToTrack(spotifyTrack: SpotifyTrack): Track {
    return {
        id: spotifyTrack.id,
        title: spotifyTrack.name,
        artist: spotifyTrack.artists.map(a => a.name).join(', '),
        coverUrl: spotifyTrack.album.images[0]?.url || '',
        audioUrl: spotifyTrack.uri, // Spotify URI
        duration: spotifyTrack.duration_ms / 1000,
        vibe: 'Unknown'
    };
}

export const spotifyService = {
    search: async (query: string): Promise<Track[]> => {
        try {
            const data: SpotifySearchResponse = await fetchSpotify(
                `/search?q=${encodeURIComponent(query)}&type=track&limit=10`
            );

            return data.tracks.items.map(mapSpotifyTrackToTrack);
        } catch (error) {
            console.error('Spotify search failed:', error);
            return [];
        }
    },

    getTrack: async (trackId: string): Promise<Track | null> => {
        try {
            const spotifyTrack: SpotifyTrack = await fetchSpotify(`/tracks/${trackId}`);
            return mapSpotifyTrackToTrack(spotifyTrack);
        } catch (error) {
            console.error('Get track failed:', error);
            return null;
        }
    },

    getUserTopTracks: async (timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<Track[]> => {
        try {
            const data = await fetchSpotify(`/me/top/tracks?time_range=${timeRange}&limit=20`);
            return data.items.map(mapSpotifyTrackToTrack);
        } catch (error) {
            console.error('Get top tracks failed:', error);
            return [];
        }
    },

    getRecommendations: async (seedTracks: string[], limit: number = 10): Promise<Track[]> => {
        try {
            const seedQuery = seedTracks.slice(0, 5).join(',');
            const data = await fetchSpotify(`/recommendations?seed_tracks=${seedQuery}&limit=${limit}`);
            return data.tracks.map(mapSpotifyTrackToTrack);
        } catch (error) {
            console.error('Get recommendations failed:', error);
            return [];
        }
    }
};
