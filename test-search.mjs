#!/usr/bin/env node

/**
 * Test script to verify the search functionality
 * This simulates what happens when a user searches for "chill vibes"
 */

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY;

console.log('🧪 Testing Search Functionality\n');

// Test 1: Check API Keys
console.log('1️⃣ Checking API Keys...');
console.log(`  Gemini API Key: ${GEMINI_API_KEY ? '✅ Present' : '❌ Missing'}`);
console.log(`  YouTube API Key: ${YOUTUBE_API_KEY ? '✅ Present' : '❌ Missing'}\n`);

if (!GEMINI_API_KEY || !YOUTUBE_API_KEY) {
    console.error('❌ API keys are missing. Please check your .env file.');
    process.exit(1);
}

// Test 2: Test Gemini API
console.log('2️⃣ Testing Gemini API...');
testGemini();

async function testGemini() {
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
            You are Rhythm, an expert AI DJ with deep musical knowledge.
            The user wants to listen to music with the vibe: "chill vibes".
            
            Create a curated playlist of 3 songs that match this vibe perfectly.
            Return ONLY a JSON array of objects with these fields:
            - title: string
            - artist: string
            - reason: string (short explanation of why this fits)
            - estimated_bpm: number
            
            Do not include markdown formatting like \`\`\`json. Just the raw JSON array.
        `;

        console.log('  📡 Sending request to Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('  ✅ Gemini response received');
        console.log('  Raw response:', text.substring(0, 100) + '...');

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const songs = JSON.parse(jsonStr);

        console.log(`  ✅ Parsed ${songs.length} songs:`);
        songs.forEach((song, i) => {
            console.log(`    ${i + 1}. "${song.title}" by ${song.artist}`);
        });

        // Test 3: Test YouTube API
        console.log('\n3️⃣ Testing YouTube API...');
        await testYouTube(songs[0]);

    } catch (error) {
        console.error('  ❌ Gemini test failed:', error.message);
        process.exit(1);
    }
}

async function testYouTube(song) {
    try {
        const query = `${song.title} ${song.artist} audio`;
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`;

        console.log(`  🔎 Searching for: "${query}"`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`  ✅ YouTube returned ${data.items.length} results:`);

        data.items.forEach((item, i) => {
            const id = item.id.videoId;
            const title = item.snippet.title;
            const audioUrl = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1`;
            console.log(`    ${i + 1}. ${title}`);
            console.log(`       URL: ${audioUrl.substring(0, 60)}...`);
        });

        console.log('\n✅ All tests passed! Search functionality should work.');

    } catch (error) {
        console.error('  ❌ YouTube test failed:', error.message);
        process.exit(1);
    }
}
