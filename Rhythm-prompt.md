# AI-Powered Music Streaming Platform - Technical Plan

## Core Concept
A minimalist music streaming web app that generates dynamic, AI-curated playlists with intelligent beat-matched transitions between songs, acting as a personal AI DJ.

---

## Key Features

### 1. Simple Interface
- **Single search bar** as primary interaction point
- Context-aware suggestions (mood, vibe, genre, artist, activity)
- Minimal player controls (play/pause, skip, lyrics, playlist view)
- Clean, distraction-free design

### 2. Dynamic Playlist Generation
- **AI-powered content discovery** via custom lightweight YouTube MCP server
- Configurable mix ratio: x% new discoveries + (100-x)% familiar favorites
- Real-time adaptation based on user feedback and vibe evolution
- Personalization engine using listen history and engagement patterns

### 3. Intelligent DJ Transitions
- **AI-generated beat transitions** between songs
- Seamless handoff from song → transition → next song
- Beat-matching and key-compatible mixing
- Dynamic transition generation based on current vibe/mood

---

## Technical Architecture

### Frontend Stack

#### Core Technologies
- **React** with TypeScript for type-safe component development
- **Tailwind CSS** for rapid, responsive UI design
- **Zustand/Redux** for global state management
- **React Query** for server state and caching

#### Audio Engine
- **Web Audio API** for:
  - Real-time audio manipulation
  - Crossfading and volume control
  - Beat detection and tempo analysis
  - Audio graph routing for transitions
- **Tone.js** for advanced audio synthesis and sequencing
- **Howler.js** as fallback for simplified audio playback

#### Key Frontend Components
```
src/
├── components/
│   ├── SearchBar/          # Main input with autocomplete
│   ├── Player/             # Playback controls + visualization
│   ├── PlaylistView/       # Current queue display
│   ├── TransitionVisual/   # Visual feedback during transitions
│   └── LyricsPanel/        # Synchronized lyrics display
├── services/
│   ├── audioEngine.ts      # Web Audio API abstraction
│   ├── transitionEngine.ts # Transition generation logic
│   ├── mcpClient.ts        # YouTube MCP communication
│   └── claudeAPI.ts        # AI coordination
├── stores/
│   ├── playerStore.ts      # Playback state
│   ├── playlistStore.ts    # Queue management
│   └── userStore.ts        # Preferences & history
└── utils/
    ├── beatDetection.ts    # Audio analysis utilities
    └── audioProcessing.ts  # DSP functions
```

---

### Backend Architecture

#### Custom YouTube MCP Server
- **Lightweight Node.js server** implementing MCP protocol
- **YouTube Data API v3** integration for search and metadata
- **yt-dlp** or youtube-dl wrapper for audio stream extraction
- Rate limiting and caching layer for API efficiency

**Core Endpoints:**
```typescript
// MCP Server Tools
{
  search_by_vibe: (query: string, context: UserContext) => Song[]
  get_song_metadata: (videoId: string) => Metadata
  get_audio_stream: (videoId: string) => StreamURL
  analyze_song_features: (videoId: string) => AudioFeatures
}
```

#### AI Orchestration Layer
- **Claude API** (Sonnet 4) for:
  - Natural language understanding of vibes/moods
  - Playlist curation decisions
  - Transition timing and style selection
  - Adaptive learning from user interactions

- **Prompt Engineering Strategy:**
  ```
  System: You're a DJ curating a playlist based on [VIBE].
  Context: User history shows [PATTERNS], current mood is [MOOD].
  Task: Select next song that maintains [X]% familiarity, [Y]% discovery.
  Consider: tempo match, key compatibility, energy arc, lyrical themes.
  ```

#### Transition Generation Engine
Two-tier approach:

**Tier 1: Pre-generated Transition Library**
- Template-based transitions for common BPM ranges
- Genre-specific drum patterns and fills
- Stored as short audio buffers (2-8 seconds)

**Tier 2: Real-time AI Generation** (Future Enhancement)
- **Generative AI models** (Suno API, MusicGen, AudioCraft)
- Generate custom 4-8 bar transitions on-demand
- Parameters: source BPM, target BPM, key, energy level, genre

**Transition Logic:**
```typescript
async function createTransition(
  currentSong: AudioFeatures,
  nextSong: AudioFeatures,
  vibe: string
): TransitionAudio {
  // Analyze compatibility
  const bpmDiff = Math.abs(currentSong.bpm - nextSong.bpm);
  const keyCompatibility = analyzeKeys(currentSong.key, nextSong.key);
  
  // Select transition style
  if (bpmDiff < 5 && keyCompatibility > 0.7) {
    return await quickCrossfade(currentSong, nextSong);
  } else {
    return await generateBeatMatchedTransition({
      sourceBPM: currentSong.bpm,
      targetBPM: nextSong.bpm,
      genre: inferGenre(vibe),
      energy: calculateEnergyArc(currentSong, nextSong)
    });
  }
}
```

---

### Data Layer

#### User Personalization Storage
- **Persistent Storage API** (window.storage) for:
  - Listen history (song IDs, skip patterns, completion rates)
  - Explicit likes/dislikes
  - Vibe preferences and frequency
  - x% discovery ratio preference

- **Storage Schema:**
  ```typescript
  {
    history: [{
      songId: string,
      timestamp: number,
      completionRate: number,
      skipped: boolean,
      vibe: string
    }],
    preferences: {
      discoveryRatio: number,
      favoriteVibes: string[],
      blockedSongs: string[]
    }
  }
  ```

#### Caching Strategy
- **IndexedDB** for:
  - Song metadata and audio features
  - Transition audio buffers
  - Recently played songs (offline capability)
- **Service Worker** for progressive web app capabilities

---

### Audio Processing Pipeline

#### 1. Song Analysis Phase
```
YouTube URL → Download Audio Segment → Audio Analysis
                                        ├── BPM Detection (Essentia.js)
                                        ├── Key Detection
                                        ├── Energy/Loudness
                                        └── Spectral Features
```

#### 2. Playback Phase
```
Current Song (90%) → Fade Out → Transition Layer → Fade In → Next Song
                                      ↓
                              Beat-matched Loop
                              (2-8 seconds)
```

#### 3. Web Audio Graph
```
[Audio Source 1] ──→ [Gain Node 1] ─┐
                                     ├──→ [Master Gain] ──→ [Destination]
[Transition Gen] ──→ [Gain Node 2] ─┤
                                     │
[Audio Source 2] ──→ [Gain Node 3] ─┘
```

---

## Implementation Phases

### Phase 1: MVP (Core Functionality)
- [ ] Basic search bar with Claude-powered query interpretation
- [ ] YouTube MCP server with search and stream extraction
- [ ] Simple playlist generation (no transitions yet)
- [ ] Standard crossfade between songs
- [ ] Local storage for user preferences

### Phase 2: Transition System
- [ ] Audio feature analysis (BPM, key, energy)
- [ ] Pre-generated transition library (50-100 templates)
- [ ] Beat-matching algorithm implementation
- [ ] Seamless handoff system with Web Audio API
- [ ] Visual transition feedback

### Phase 3: AI Enhancement
- [ ] Real-time transition generation (Suno API integration)
- [ ] Advanced personalization engine
- [ ] Dynamic x% discovery ratio adjustment
- [ ] Mood evolution detection and adaptation
- [ ] Collaborative filtering for better recommendations

### Phase 4: Polish & Scale
- [ ] Offline mode with service workers
- [ ] Social features (share vibes, collaborative playlists)
- [ ] Advanced audio visualizations
- [ ] Mobile-optimized PWA
- [ ] Performance optimization for low-end devices

---

## Technical Challenges & Solutions

### Challenge 1: Beat Matching Across Genres
**Solution:** Implement flexible tempo-sync with time-stretching
- Use `AudioContext.createConstantSource()` for tempo control
- Apply phase vocoder algorithm for pitch-preserving time stretch
- Fallback to energy-matched crossfade when BPM difference > 20

### Challenge 2: Real-time Transition Generation Latency
**Solution:** Predictive pre-generation
- Analyze next 3 songs in queue
- Generate transitions during current song playback
- Cache transitions in AudioBuffer memory

### Challenge 3: YouTube Content Access & Legal
**Solution:** Operate within fair use and API guidelines
- Stream audio only (no downloads stored permanently)
- Respect YouTube API rate limits
- Display proper attribution and links to original content
- Consider YouTube Premium API for official access

### Challenge 4: Seamless Audio Handoff
**Solution:** Double-buffering with precise timing
```typescript
// Pre-load next song 10 seconds before transition
const PRELOAD_TIME = 10; // seconds
const TRANSITION_START = song.duration - 8; // start transition 8s before end

audioContext.currentTime + TRANSITION_START → scheduleTransition()
```

---

## API Integrations

### Required APIs
1. **YouTube Data API v3** - Search, metadata, thumbnails
2. **Claude API (Anthropic)** - Natural language processing, curation
3. **Suno/Stable Audio API** (Future) - AI transition generation
4. **Spotify API** (Optional) - Enhanced audio features via Web API

### MCP Server Implementation
```typescript
// server.ts
import { MCPServer } from '@modelcontextprotocol/sdk';
import { searchYouTube, extractAudioStream, analyzeAudio } from './youtube';

const server = new MCPServer({
  name: 'youtube-music-server',
  version: '1.0.0',
  tools: [
    {
      name: 'search_by_vibe',
      description: 'Search YouTube for songs matching a vibe',
      inputSchema: {
        query: 'string',
        userContext: 'object',
        discoveryRatio: 'number'
      },
      handler: async ({ query, userContext, discoveryRatio }) => {
        const results = await searchYouTube(query, userContext);
        return curatePlaylist(results, discoveryRatio, userContext);
      }
    },
    // ... other tools
  ]
});
```

---

## Performance Considerations

### Optimization Strategies
- **Lazy loading**: Load songs just-in-time (10s buffer)
- **Web Workers**: Offload audio analysis to background threads
- **AudioWorklet**: Use for low-latency audio processing
- **Chunked streaming**: Stream audio in chunks vs. full downloads
- **Adaptive quality**: Adjust bitrate based on network conditions

### Target Metrics
- **First interaction**: < 2 seconds (search → first result)
- **Transition smoothness**: < 50ms perceived gap
- **Memory footprint**: < 150MB (3-4 songs buffered)
- **CPU usage**: < 15% during playback, < 40% during transitions

---

## Security & Privacy

### Data Protection
- No server-side storage of listen history (client-side only)
- Optional anonymous usage analytics
- No third-party tracking cookies
- Clear data deletion option

### API Security
- Environment variables for all API keys
- Rate limiting on MCP server
- CORS restrictions
- JWT tokens for authenticated features (future)

---

## Future Enhancements

1. **Voice Control**: "Hey DJ, play something upbeat for working out"
2. **Collaborative Sessions**: Real-time shared listening with friends
3. **Live Remixing**: User-adjustable transition styles (scratch, echo, reverb)
4. **Genre Morphing**: Gradually shift from one genre to another
5. **AI DJ Personality**: Different AI personalities (chill, hype, experimental)
6. **Integration with Hardware**: MIDI controller support for manual DJ control

---

## Success Metrics

### User Engagement
- Average session duration > 30 minutes
- Skip rate < 15%
- Return user rate > 60% (weekly)
- Transition satisfaction rating > 4.2/5

### Technical Performance
- 99.5% uptime
- < 2% error rate on transitions
- < 100ms latency for search results
- 95th percentile load time < 3 seconds

---

## Tech Stack Summary

**Frontend:** React + TypeScript + Tailwind + Web Audio API + Tone.js  
**Backend:** Node.js + Express + MCP Protocol + YouTube Data API  
**AI:** Claude API (Sonnet 4) + Suno API (transitions)  
**Storage:** IndexedDB + localStorage + Service Workers  
**Deployment:** Vercel (frontend) + Railway/Fly.io (MCP server)  
**Audio Processing:** Essentia.js + Web Audio API + AudioWorklets

---


**Total:** ~5-7 months for full v1.0 release
