export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  lastSeen?: Date
  createdAt: Date
}

export interface Room {
  id: string
  name: string
  description?: string
  createdBy: string
  members: string[]
  memberNames?: Record<string, string>
  isPrivate: boolean
  createdAt: Date
  lastMessage?: string
  lastMessageAt?: Date
  aiResponding?: boolean
}

export type MessageType = 'human' | 'ai' | 'voice' | 'system'

export interface Message {
  id: string
  roomId: string
  content: string
  type: MessageType
  senderId: string
  senderName: string
  senderAvatar?: string
  createdAt: Date
  isAIResponse: boolean
  isStreaming?: boolean
  streamFailed?: boolean
  audioUrl?: string
  voiceTranscript?: string
  reactions?: Record<string, string[]>
}

export interface TypingUser {
  uid: string
  displayName: string
  timestamp: number
}

export interface PresenceData {
  online: boolean
  lastSeen: number
  displayName: string
}

export interface AIInvocation {
  roomId: string
  triggerMessageId: string
  context: { role: 'user' | 'assistant'; content: string }[]
}

export interface ReadReceipt {
  userId: string
  lastReadMessageId: string
  lastReadAt: number
}