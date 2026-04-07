import {
  ref,
  set,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  off,
} from "firebase/database";
import { rtdb } from "./firebase";
import type { PresenceData, TypingUser, ReadReceipt } from "./types";

export function setupPresence(uid: string, displayName: string) {
  const presenceRef = ref(rtdb, `presence/${uid}`);
  const connectedRef = ref(rtdb, ".info/connected");

  onValue(connectedRef, (snap) => {
    if (!snap.val()) return;

    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: serverTimestamp(),
      displayName,
    });

    set(presenceRef, {
      online: true,
      lastSeen: serverTimestamp(),
      displayName,
    });
  });

  return () => {
    off(connectedRef);
    set(presenceRef, {
      online: false,
      lastSeen: serverTimestamp(),
      displayName,
    });
  };
}

export function subscribeToPresence(
  callback: (presence: Record<string, PresenceData>) => void,
): () => void {
  const presenceRef = ref(rtdb, "presence");
  onValue(presenceRef, (snap) => {
    const data = snap.val() as Record<string, PresenceData> | null;
    callback(data || {});
  });
  return () => off(presenceRef);
}

export function subscribeToUserPresence(
  uid: string,
  callback: (data: PresenceData | null) => void,
): () => void {
  const userRef = ref(rtdb, `presence/${uid}`);
  onValue(userRef, (snap) => {
    callback(snap.val());
  });
  return () => off(userRef);
}

let typingTimeout: NodeJS.Timeout | null = null;

export function setTyping(roomId: string, uid: string, displayName: string) {
  if (typingTimeout) clearTimeout(typingTimeout);

  const typingRef = ref(rtdb, `typing/${roomId}/${uid}`);

  set(typingRef, {
    isTyping: true,
    displayName,
    timestamp: Date.now(),
  });

  typingTimeout = setTimeout(() => {
    remove(typingRef);
  }, 3000);
}

export function clearTyping(roomId: string, uid: string) {
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  const typingRef = ref(rtdb, `typing/${roomId}/${uid}`);
  remove(typingRef);
}

export function subscribeToTyping(
  roomId: string,
  currentUid: string,
  callback: (users: TypingUser[]) => void,
): () => void {
  const typingRef = ref(rtdb, `typing/${roomId}`);
  onValue(typingRef, (snap) => {
    const data = snap.val() || {};
    const typingUsers: TypingUser[] = Object.entries(data)
      .filter(([uid, val]) => {
        const v = val as { isTyping: boolean; timestamp: number };
        return (
          uid !== currentUid && v.isTyping && Date.now() - v.timestamp < 5000
        );
      })
      .map(([uid, val]) => {
        const v = val as { displayName: string; timestamp: number };
        return { uid, displayName: v.displayName, timestamp: v.timestamp };
      });
    callback(typingUsers);
  });
  return () => off(typingRef);
}

// ── Read Receipts ──────────────────────────────────────────

export function markRoomRead(
  roomId: string,
  userId: string,
  lastReadMessageId: string,
) {
  const receiptRef = ref(rtdb, `readReceipts/${roomId}/${userId}`);
  set(receiptRef, {
    lastReadMessageId,
    lastReadAt: Date.now(),
  });
}

export function subscribeToRoomReceipts(
  roomId: string,
  callback: (receipts: Record<string, ReadReceipt>) => void,
): () => void {
  const receiptsRef = ref(rtdb, `readReceipts/${roomId}`);
  onValue(receiptsRef, (snap) => {
    const data = snap.val() as Record<
      string,
      { lastReadMessageId: string; lastReadAt: number }
    > | null;
    if (!data) {
      callback({});
      return;
    }
    const receipts: Record<string, ReadReceipt> = {};
    for (const [uid, val] of Object.entries(data)) {
      receipts[uid] = { userId: uid, ...val };
    }
    callback(receipts);
  });
  return () => off(receiptsRef);
}

// For the sidebar — subscribe to receipts for ALL rooms at once
export function subscribeToAllReceipts(
  roomIds: string[],
  userId: string,
  callback: (unreadRoomIds: Set<string>) => void,
): () => void {
  if (roomIds.length === 0) {
    callback(new Set());
    return () => {};
  }

  // We track each room's receipt state in a map and recompute on any change
  const state: Record<
    string,
    { myLastRead: string | null; latestMsgId: string | null }
  > = {};
  const unsubs: Array<() => void> = [];

  function recompute() {
    const unread = new Set<string>();
    for (const [roomId, s] of Object.entries(state)) {
      if (s.latestMsgId && s.myLastRead !== s.latestMsgId) {
        unread.add(roomId);
      }
    }
    callback(unread);
  }

  for (const roomId of roomIds) {
    state[roomId] = { myLastRead: null, latestMsgId: null };

    // Watch this user's receipt for the room
    const myRef = ref(rtdb, `readReceipts/${roomId}/${userId}`);
    onValue(myRef, (snap) => {
      const val = snap.val() as { lastReadMessageId: string } | null;
      state[roomId].myLastRead = val?.lastReadMessageId ?? null;
      recompute();
    });
    unsubs.push(() => off(myRef));
  }

  return () => unsubs.forEach((u) => u());
}
