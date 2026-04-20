# Nexus — Team Chat with AI Assistant

A production-grade collaborative chat application built with Next.js 16, Firebase, BetterAuth, and multi-provider AI support. Real-time team messaging with an on-demand AI assistant invoked via `@ai` mentions.
---
## 🌍 Live Demo
 https://nexus-ai-chat-project.netlify.app
---

## Stack

### BetterAuth

- Native Next.js App Router support with cookie-based sessions
- Plugin ecosystem for social providers (Google OAuth)
- Type-safe session management; `useSession()` hook works seamlessly in client components

### AI

- **Google Gemini** and **Groq** support for chat assistant responses, selectable by environment variable
- **Whisper** for voice-to-text transcription (`/api/voice`)
- Streaming responses progressively to Firestore; the client renders partial content as it arrives via real-time updates

### UI

- Custom design system using tailwind css
- Syne (display) + Figtree (body) — distinctive, non-generic font pairing
- Dark/light mode toggle with system preference detection and localStorage persistence
- Dark-first, fully responsive
- Read receipts per-room
- Notification system (browser push)

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
- **Browser push notifications** for new messages when the chat is backgrounded
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

### AI Streaming Flow

1. Client detects `@ai` in sent message
2. POST `/api/ai` with last 20 messages as context
3. Server creates Firestore message doc: `{ content: '', isStreaming: true }`
4. Server streams AI output; every 150ms, `updateDoc` appends accumulated content
5. Client's `onSnapshot` fires on each update — renders partial content + blinking dots
6. Stream ends: `isStreaming: false`, `aiResponding: false` on room doc

### State Architecture

- **Firestore**: source of truth for all persisted data
- **RTDB**: ephemeral state (presence, typing) — auto-cleaned on disconnect
- **Zustand**: client-side mirror for rooms, presence, current user — avoids prop drilling
- **React state**: per-component UI state (messages, typing users)

```
---

## Production Considerations

| Area             | Implementation                                   | Notes                                      |
| ---------------- | ------------------------------------------------ | ------------------------------------------ |
| AI rate limiting | Per-room 3s debounce + `aiResponding` flag       | Add Redis for distributed deployments      |
| Context window   | Last 20 messages                                 | Cost varies by provider (Gemini, Groq)     |
| Message search   | Client-side, last 200 docs                       | Add Algolia/Typesense for full search      |
| Firestore cost   | Batch writes, 150ms stream throttle              | Monitor write volume in high-traffic rooms |
| Auth security    | httpOnly cookies, CSRF protection via BetterAuth | Add email verification for production      |
| RTDB cleanup     | `onDisconnect()` auto-removes presence           | Typing indicators auto-expire after 5s     |
