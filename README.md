# Nexus — Team Chat with AI Assistant

A production-grade collaborative chat application built with Next.js 15, Firebase, BetterAuth, and OpenAI. Real-time team messaging with an on-demand AI assistant invoked via `@ai` mentions.

---

## Stack & Justifications

### Firebase (over Supabase)

- **Firestore real-time listeners** are battle-tested for chat — sub-100ms sync, offline persistence, and optimistic writes are first-class
- **Firebase RTDB** provides `onDisconnect()` which is the only reliable way to handle dropped connections for presence without a server process
- **Subcollection model** (`rooms/{id}/messages`) maps perfectly to paginated chat history; no JOIN queries needed
- Trade-off: NoSQL query limits (no full-text search), vendor lock-in. Acknowledged in the search implementation (client-side filter with a 200-doc cap; production would use Algolia or Typesense via Cloud Functions)

### BetterAuth

- Native Next.js App Router support with cookie-based sessions
- Plugin ecosystem for social providers (Google OAuth)
- Type-safe session management; `useSession()` hook works seamlessly in client components

### Groq

- **Groq Llama 3.1 70B** for AI responses (configurable via API key)
- **Whisper** for voice-to-text transcription (`/api/voice`)
- Streaming via `openai.chat.completions.create({ stream: true })` or Groq API — chunks written progressively to Firestore, clients pick up via `onSnapshot`

### UI

- Custom design system using CSS variables — no component library lock-in
- Syne (display) + Figtree (body) — distinctive, non-generic font pairing
- Dark-first, fully responsive

---

## Features

### Authentication

- Email/password signup and login via BetterAuth
- Google OAuth (social provider)
- Session management with httpOnly cookies
- Route protection at layout level

### Real-Time Chat

- Messages appear instantly via Firestore `onSnapshot` listeners
- **Typing indicators** — RTDB-backed, auto-clear after 3s inactivity
- **Presence system** — online/offline with `onDisconnect()` for drop detection
- Infinite scroll / pagination (load older messages on scroll-to-top)
- Date dividers, message grouping (same sender within 5min)
- Optimistic send (message appears immediately, Firestore confirms async)

### AI Assistant

- Invoked via `@ai` mention anywhere in a message
- Receives last **20 messages** as context (cost-controlled, ~$0.002/invocation)
- Streams response progressively — Firestore document updated every ~150ms with accumulated content; clients see it "type" in real-time without WebSockets
- Visually distinct: star icon avatar, blue accent, `AI` badge, left border
- Rate limited: 1 invocation per room per 3 seconds; `aiResponding` flag blocks duplicate invocations
- Stream failure handling: `streamFailed: true` flag shows ⚠ in UI with the partial content preserved

### Chat Management

- Create public or private channels
- Discover and join public channels (search by name/description)
- Member list with online/offline presence
- Message search (client-side filter, last 200 messages)
- Persistent history — full message history loads on reconnect

### Voice

- Browser `MediaRecorder` API for recording (webm format)
- Transcribed via OpenAI Whisper (`/api/voice`)
- Transcript sent as a regular message with 🎤 indicator
- AI can be invoked from voice messages (`@ai` in transcribed text)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                 │
│                                                     │
│  /app/login          — Auth pages                   │
│  /app/register                                      │
│  /app/chat/layout    — Protected shell + presence   │
│  /app/chat/page      — Room selection / welcome     │
│  /app/chat/[roomId]  — Real-time chat view          │
│                                                     │
│  /api/auth/[...all]  — BetterAuth handler           │
│  /api/ai             — GPT-4o streaming endpoint    │
│  /api/voice          — Whisper transcription        │
└─────────────────┬───────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    Firestore           Firebase RTDB
    ─────────           ─────────────
    rooms/              presence/{uid}
    rooms/{id}/         typing/{roomId}/{uid}
      messages/
```

### AI Streaming Flow

1. Client detects `@ai` in sent message
2. POST `/api/ai` with last 20 messages as context
3. Server creates Firestore message doc: `{ content: '', isStreaming: true }`
4. Server streams GPT-4o; every 150ms, `updateDoc` appends accumulated content
5. Client's `onSnapshot` fires on each update — renders partial content + blinking dots
6. Stream ends: `isStreaming: false`, `aiResponding: false` on room doc

### State Architecture

- **Firestore**: source of truth for all persisted data
- **RTDB**: ephemeral state (presence, typing) — auto-cleaned on disconnect
- **Zustand**: client-side mirror for rooms, presence, current user — avoids prop drilling
- **React state**: per-component UI state (messages, typing users)

---

## Data Model

```typescript
// Firestore
rooms/{roomId}
  name: string
  description?: string
  createdBy: string         // uid
  members: string[]         // uid[]
  memberNames: Record<uid, string>
  isPrivate: boolean
  createdAt: Timestamp
  lastMessage?: string      // preview for sidebar
  lastMessageAt?: Timestamp // for ordering
  aiResponding: boolean     // rate limit flag

rooms/{roomId}/messages/{msgId}
  content: string
  type: 'human' | 'ai' | 'voice'
  senderId: string
  senderName: string
  senderAvatar?: string
  createdAt: Timestamp
  isAIResponse: boolean
  isStreaming: boolean      // true while GPT-4o streams
  streamFailed: boolean
  audioUrl?: string

// RTDB
presence/{uid}: { online: bool, lastSeen: serverTimestamp, displayName: string }
typing/{roomId}/{uid}: { isTyping: bool, displayName: string, timestamp: number }
```

---

## Setup

### 1. Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** (production mode)
3. Enable **Realtime Database**
4. Create a web app, copy the config values

**Firestore security rules:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid in resource.data.members;

      match /messages/{msgId} {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/rooms/$(roomId)).data.members;
      }
    }
  }
}
```

### 2. Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000` to Authorized JavaScript origins
4. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

````env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# Firebase Admin (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI APIs (choose one)
OPENAI_API_KEY=
# or
GROQ_API_KEY=

# Authentication
BETTER_AUTH_SECRET=   # any 32+ char random string
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```Deployment

### Netlify (Recommended for static sites)
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18

6. Set environment variables in Netlify dashboard:
   - All variables from `.env.local` (see Environment Variables section above)
   - Update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Netlify domain

**Note**: Netlify's serverless functions have limitations with SQLite databases. For full functionality, consider Vercel.

### Vercel (Recommended for full features)
```bash
npm install -g vercel
vercel --prod
| Database persistence | SQLite for local dev | Use PostgreSQL/MySQL for production scaling |
| Deployment | Netlify/Vercel/Firebase Hosting | Netlify has SQLite limitations; prefer Vercel for full features |
````

Vercel provides better support for:

- SQLite databases
- Server Actions
- Next.js features
- Automatic deployments

### Firebase Hosting (Alternative)

```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

---

##

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Production Considerations

| Area             | Implementation                                   | Notes                                      |
| ---------------- | ------------------------------------------------ | ------------------------------------------ |
| AI rate limiting | Per-room 3s debounce + `aiResponding` flag       | Add Redis for distributed deployments      |
| Context window   | Last 20 messages                                 | ~$0.002/invocation at GPT-4o pricing       |
| Message search   | Client-side, last 200 docs                       | Add Algolia/Typesense for full search      |
| Firestore cost   | Batch writes, 150ms stream throttle              | Monitor write volume in high-traffic rooms |
| Auth security    | httpOnly cookies, CSRF protection via BetterAuth | Add email verification for production      |
| RTDB cleanup     | `onDisconnect()` auto-removes presence           | Typing indicators auto-expire after 5s     |

---

## What I'd Add With More Time

- Thread replies (nested message context)
- Message reactions (emoji picker)
- File/image attachments via Firebase Storage
- E2E tests (Playwright for chat flow, Jest for AI context building)
- AI response TTS playback (OpenAI TTS API → `<audio>` element)
- Audit log for AI invoc
- Message encryption (end-to-end)
- Admin panel for user/room management
- Integration with Slack/Discord webhooks
- Mobile app (React Native)ations
- Notification system (browser push + email digest)
- Read receipts per-room
