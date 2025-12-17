import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Using gemini-2.5-flash-preview-09-2025 as specified
    try {
        model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
    } catch (e) {
        console.warn("Model initialization failed, using fallback");
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
}

export const geminiService = {
    curatePlaylist: async (vibe: string, userHistory: string[] = []): Promise<any[]> => {
        if (!model) {
            console.warn("Gemini API Key missing");
            return [];
        }

        const prompt = `
            You are Rhythm, an expert AI DJ with deep musical knowledge.
            The user wants to listen to music with the vibe: "${vibe}".
            
            Create a curated playlist of 5 songs that match this vibe perfectly.
            Return ONLY a JSON array of objects with these fields:
            - title: string
            - artist: string
            - reason: string (short explanation of why this fits)
            - estimated_bpm: number
            
            Do not include markdown formatting like \`\`\`json. Just the raw JSON array.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up potential markdown
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Gemini curation failed:", error);
            return [];
        }
    },

    generateTrackInsights: async (track: { title: string, artist: string, vibe?: string }): Promise<string> => {
        if (!model) {
            return track.vibe || 'No insights available';
        }

        const prompt = `
            You are Rhythm, an expert music analyst.
            Analyze this track and provide a brief, engaging insight (2-3 sentences):
            
            Track: "${track.title}" by ${track.artist}
            ${track.vibe ? `Context: ${track.vibe}` : ''}
            
            Describe:
            - Musical characteristics (genre, mood, energy)
            - Why it fits the current vibe
            - What makes it special
            
            Keep it conversational and under 60 words. No formatting.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error("Track insights generation failed:", error);
            return track.vibe || 'A carefully selected track to enhance your listening experience.';
        }
    },

    // Generic content generation
    generateContent: async (prompt: string): Promise<string> => {
        if (!model) {
            throw new Error("Gemini API Key missing");
        }

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini generation failed:", error);
            throw error;
        }
    },

    /**
     * Advanced track analysis for professional DJ mixing
     * Returns: BPM, key (Camelot notation), energy, genre, structure
     */
    analyzeTrackAdvanced: async (track: { title: string, artist: string, vibe?: string }): Promise<{
        bpm: number;
        key: string;
        energy: number;
        genre: string;
        structure: {
            intro: number;
            outro: number;
            drop: number;
        };
    }> => {
        if (!model) {
            // Fallback to reasonable defaults
            return {
                bpm: 120,
                key: '8A',
                energy: 0.7,
                genre: 'Unknown',
                structure: { intro: 8, outro: 16, drop: 32 }
            };
        }

        const prompt = `You are an expert music analyst and professional DJ with 20 years of experience in electronic, hip-hop, and pop music mixing.

Analyze this track for seamless DJ mixing:
- Title: "${track.title}"
- Artist: "${track.artist}"
- Context: "${track.vibe || 'Unknown'}"

Think deeply about:
1. BPM estimation (consider genre typical ranges: House 120-130, Techno 125-135, Hip-Hop 80-110, Pop 100-130)
2. Musical key detection (use Camelot wheel notation: 1A-12A for minor, 1B-12B for major)
3. Energy level (0-1 scale: 0.3 = chill/ambient, 0.7 = upbeat/energetic, 1.0 = peak/intense)
4. Genre classification
5. Track structure timing:
   - Intro: Seconds before the main beat/melody drops
   - Outro: Seconds of fade-out or ending section
   - Main drop: Timestamp of the most energetic moment

Respond ONLY with this exact JSON format (no markdown, no explanation):
{
  "bpm": <number 60-180>,
  "key": "<Camelot notation like 8A or 5B>",
  "energy": <number 0-1>,
  "genre": "<primary genre>",
  "structure": {
    "intro": <seconds>,
    "outro": <seconds>,
    "drop": <seconds from start>
  }
}`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Clean up potential markdown
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Advanced track analysis failed:", error);
            // Fallback
            return {
                bpm: 120,
                key: '8A',
                energy: 0.7,
                genre: 'Unknown',
                structure: { intro: 8, outro: 16, drop: 32 }
            };
        }
    },

    /**
     * Plan professional DJ transition between two tracks
     * Uses harmonic mixing, BPM matching, and energy flow rules
     */
    planTransitionAdvanced: async (
        track1: { bpm: number; key: string; energy: number; genre: string; structure: { outro: number } },
        track2: { bpm: number; key: string; energy: number; genre: string; structure: { intro: number } }
    ): Promise<{
        duration: number;
        technique: string;
        reasoning: string;
        bpmAdjustment: boolean;
        generatedElements: {
            kick: boolean;
            snare: boolean;
            hihat: boolean;
            bass: boolean;
            riser: boolean;
        };
        mixInPoint: number;
        mixOutPoint: number;
    }> => {
        if (!model) {
            // Fallback to simple crossfade
            return {
                duration: 15,
                technique: 'crossfade',
                reasoning: 'Standard crossfade',
                bpmAdjustment: false,
                generatedElements: { kick: false, snare: false, hihat: false, bass: false, riser: false },
                mixInPoint: 20,
                mixOutPoint: 10
            };
        }

        const prompt = `You are a world-class DJ (like James Hype or Fred Again) planning a professional transition between two tracks.

CURRENT TRACK (ending):
- BPM: ${track1.bpm}
- Key: ${track1.key}
- Energy: ${track1.energy}
- Genre: ${track1.genre}
- Outro: ${track1.structure.outro}s

NEXT TRACK (incoming):
- BPM: ${track2.bpm}
- Key: ${track2.key}
- Energy: ${track2.energy}
- Genre: ${track2.genre}
- Intro: ${track2.structure.intro}s

PROFESSIONAL DJ RULES:
1. **BPM Matching**: 
   - <3% difference → No adjustment needed
   - 3-8% difference → Mild tempo ramp
   - >8% difference → Don't force it, use a "reset" transition

2. **Harmonic Mixing** (Camelot Wheel):
   - Same key = perfect blend
   - +1/-1 on wheel = smooth
   - >2 steps away = use EQ/filter techniques

3. **Energy Flow**:
   - ±0.1 energy = seamless
   - ±0.2-0.3 energy = noticeable but acceptable
   - >0.4 energy = needs a "break" or bridge to reset vibe

4. **Duration**:
   - Same genre + compatible = 10-15s
   - Different genres = 15-20s
   - Energy jump = 20-30s (build anticipation)

Based on these rules, create a transition plan in EXACT JSON (no markdown):
{
  "duration": <10-30 seconds>,
  "technique": "crossfade OR bass-swap OR filter-sweep OR echo-out OR build-drop",
  "reasoning": "<1 sentence explaining your choice>",
  "bpmAdjustment": <true or false>,
  "generatedElements": {
    "kick": <boolean>,
    "snare": <boolean>,
    "hihat": <boolean>,
    "bass": <boolean>,
    "riser": <boolean>
  },
  "mixInPoint": <seconds before track1 ends to start transition, usually 15-25>,
  "mixOutPoint": <seconds into track2 to complete fade-in, usually 8-15>
}`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Clean up potential markdown
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Advanced transition planning failed:", error);
            // Fallback
            return {
                duration: 15,
                technique: 'crossfade',
                reasoning: 'Standard crossfade fallback',
                bpmAdjustment: false,
                generatedElements: { kick: false, snare: false, hihat: false, bass: false, riser: false },
                mixInPoint: 20,
                mixOutPoint: 10
            };
        }
    }
};
