import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash - current stable model from official docs (ai.google.dev)
    // Best price-performance for large-scale processing and JSON generation
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

    generateTransitionParams: async (track1: string, track2: string) => {
        // Future: Ask Gemini how to transition between these two tracks
        // (Crossfade duration, EQ settings, etc.)
    }
};
