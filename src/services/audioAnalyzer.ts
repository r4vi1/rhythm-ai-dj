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
        const prompt = `You are an expert music analyst with 20 years of DJ experience.

Analyze this track for DJ mixing:
Title: "${track.title}"
Artist: ${track.artist}
Genre hint: ${track.vibe || 'Unknown'}

Provide ACCURATE analysis in this EXACT JSON format:
{
  "bpm": <estimated tempo 60-180>,
  "key": "<musical key in Camelot wheel notation, e.g., 8A, 5B>",
  "energy": <0-1 scale, where 0.1=ambient, 0.5=moderate, 0.9=high energy>,
  "genre": "<primary genre: House/Techno/Hip-Hop/Pop/Rock/etc>",
  "mood": "<emotional tone: energetic/melancholic/uplifting/dark/etc>",
  "structure": {
    "intro": <seconds of intro before main beat, typically 8-32>,
    "outro": <seconds of outro/fade section, typically 8-32>,
    "drop": <seconds into track where main drop/chorus hits, typically 45-90>
  }
}

Be accurate - DJs rely on this for beat matching and harmonic mixing.`;

        try {
            const result = await geminiService.generateContent(prompt);
            const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis: TrackAnalysis = JSON.parse(jsonStr);

            // Validate and sanitize
            return {
                bpm: Math.max(60, Math.min(180, analysis.bpm)),
                key: analysis.key || '8A',
                energy: Math.max(0, Math.min(1, analysis.energy)),
                genre: analysis.genre || 'Unknown',
                mood: analysis.mood || 'neutral',
                structure: {
                    intro: Math.max(0, analysis.structure?.intro || 16),
                    outro: Math.max(0, analysis.structure?.outro || 16),
                    drop: Math.max(0, analysis.structure?.drop || 60)
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
                    intro: 16,
                    outro: 16,
                    drop: 60
                }
            };
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

export const audioAnalyzer = new AudioAnalyzerService();
