import type { Track } from '../stores/usePlayerStore';

const MOCK_TRACKS: Track[] = [
    {
        id: '1',
        title: 'Midnight City',
        artist: 'M83',
        coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/humming_laser_shot.ogg', // Placeholder
        duration: 243,
        vibe: 'Synthwave'
    },
    {
        id: '2',
        title: 'Nightcall',
        artist: 'Kavinsky',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/laser_gun_shot.ogg', // Placeholder
        duration: 258,
        vibe: 'Retrowave'
    },
    {
        id: '3',
        title: 'Resonance',
        artist: 'Home',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/robot_laser.ogg', // Placeholder
        duration: 212,
        vibe: 'Chillwave'
    }
];

export const mockApi = {
    search: async (query: string): Promise<Track[]> => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency
        return MOCK_TRACKS.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || t.artist.toLowerCase().includes(query.toLowerCase()));
    },

    getRecommendations: async (currentTrackId: string): Promise<Track[]> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_TRACKS.filter(t => t.id !== currentTrackId);
    }
};
