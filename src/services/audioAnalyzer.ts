import { geminiService } from './geminiService';
import type { Track } from '../stores/usePlayerStore';

export interface TrackAnalysis {
    bpm: number;
    key: string; // Musical key (e.g., "C# minor")
    energy: number; // 0-1 scale
    genre: string;
    mood: string;
    structure: {
        intro: number; // Duration in seconds
        outro: number; // Duration in seconds  
        drop: number; // Timestamp of main drop/chorus
        hasFadeOut?: boolean;
        startsWithBeat?: boolean;
    };
}

class AudioAnalyzerService {
    private cache: Map<string, TrackAnalysis> = new Map();

    async analyzeTrack(track: Track): Promise<TrackAnalysis> {
        // Check cache first
        if (this.cache.has(track.id)) {
            return this.cache.get(track.id)!;
        }

        // Use Gemini AI to analyze track
        const analysis = await this.analyzeWithGemini(track);

        // Cache result
        this.cache.set(track.id, analysis);
        return analysis;
    }

    private async analyzeWithGemini(track: Track): Promise<TrackAnalysis> {
        try {
            // Use the new advanced AI analysis method
            const result = await geminiService.analyzeTrackAdvanced({
                title: track.title,
                artist: track.artist,
                vibe: track.vibe
            });

            // Map to our TrackAnalysis format (structures match)
            return {
                bpm: Math.max(60, Math.min(180, result.bpm)),
                key: result.key || '8A',
                energy: Math.max(0, Math.min(1, result.energy)),
                genre: result.genre || 'Unknown',
                mood: result.genre, // Use genre as mood fallback
                structure: {
                    intro: Math.max(0, result.structure?.intro || 8),
                    outro: Math.max(0, result.structure?.outro || 16),
                    drop: Math.max(0, result.structure?.drop || 32),
                    hasFadeOut: result.structure?.outro > 8, // Infer from outro length
                    startsWithBeat: result.structure?.intro < 4 // If intro < 4s, likely starts with beat
                }
            };
        } catch (error) {
            console.error('Gemini track analysis failed:', error);
            // Fallback defaults
            return {
                bpm: 120,
                key: '8A',
                energy: 0.5,
                genre: 'Unknown',
                mood: 'neutral',
                structure: {
                    intro: 8,
                    outro: 16,
                    drop: 32,
                    hasFadeOut: false,
                    startsWithBeat: true
                }
            };
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

export const audioAnalyzer = new AudioAnalyzerService();
