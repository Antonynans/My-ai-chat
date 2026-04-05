import { create } from "zustand";
import type { Room, Message, TypingUser, PresenceData } from "./types";

interface ChatStore {
  currentUserId: string | null;
  currentUserName: string | null;
  currentUserAvatar: string | null;
  setCurrentUser: (id: string, name: string, avatar?: string) => void;

  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  publicRooms: Room[];
  setPublicRooms: (rooms: Room[]) => void;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;

  messages: Record<string, Message[]>;
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (roomId: string, message: Message) => void;
  updateMessage: (
    roomId: string,
    messageId: string,
    updates: Partial<Message>,
  ) => void;

  typingUsers: Record<string, TypingUser[]>;
  setTypingUsers: (roomId: string, users: TypingUser[]) => void;

  presence: Record<string, PresenceData>;
  setPresence: (presence: Record<string, PresenceData>) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  membersOpen: boolean;
  setMembersOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentUserId: null,
  currentUserName: null,
  currentUserAvatar: null,
  setCurrentUser: (id, name, avatar) =>
    set({
      currentUserId: id,
      currentUserName: name,
      currentUserAvatar: avatar,
    }),

  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  publicRooms: [],
  setPublicRooms: (publicRooms) => set({ publicRooms }),
  activeRoomId: null,
  setActiveRoomId: (id) => set({ activeRoomId: id }),

  messages: {},
  setMessages: (roomId, messages) =>
    set((state) => ({ messages: { ...state.messages, [roomId]: messages } })),
  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),
  updateMessage: (roomId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m,
        ),
      },
    })),

  typingUsers: {},
  setTypingUsers: (roomId, users) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [roomId]: users },
    })),

  presence: {},
  setPresence: (presence) => set({ presence }),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  membersOpen: false,
  setMembersOpen: (open) => set({ membersOpen: open }),
}));
